# Docker Execution Fixes & Latency Reduction

**Repository:** `code-runner-production-main`  
**Purpose:** Optimize Docker-based code execution for lower latency and higher reliability.

---

## 1) Prebuilt Sandbox Image (Critical Fix)

### Issue
- Runner builds `python-code-runner` image at runtime.
- Causes cold start delays and build failures.

### Fix: Prebuild Image in CI

**File:** `.github/workflows/build-sandbox.yml` (new)

```yaml
name: Build Sandbox Image
on:
  push:
    paths: ['apps/runner/Dockerfile']
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build image
        run: |
          docker build -t python-runner:${{ github.sha }} -f apps/runner/Dockerfile .
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker tag python-runner:${{ github.sha }} your-registry/python-runner:latest
          docker push your-registry/python-runner:latest
```

**File:** `apps/runner/Dockerfile` (new)

```dockerfile
FROM python:3.11-slim

# Install system deps
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd -m -u 1000 runner

# Set workdir
WORKDIR /app

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Switch to non-root
USER runner

# Default command
CMD ["python"]
```

**File:** `apps/runner/src/executors/docker.executor.ts`

```ts
// Pull prebuilt image instead of building
async ensureImageExists(): Promise<void> {
  const imageName = 'your-registry/python-runner:latest';
  try {
    await this.docker.getImage(imageName).inspect();
  } catch {
    // Image not found - pull it
    await this.docker.pull(imageName);
  }
}
```

---

## 2) Optimize Docker Container Constraints

### Issue
- Current constraints may be too loose or too strict.

### Fix: Tuned Constraints

**File:** `apps/runner/src/executors/docker.executor.ts`

```ts
const containerConfig = {
  Image: this.imageName,
  Cmd: ['python', '-c', code],
  WorkingDir: '/tmp',
  HostConfig: {
    Memory: 128 * 1024 * 1024, // 128MB
    CpuQuota: 50000, // 0.5 CPU
    CpuPeriod: 100000,
    NetworkMode: 'none', // No network
    ReadonlyRootfs: true,
    Tmpfs: {
      '/tmp': 'rw,noexec,nosuid,size=100m'
    },
    LogConfig: {
      Type: 'json-file',
      Config: { 'max-size': '10m', 'max-file': '3' }
    },
    AutoRemove: true, // Cleanup automatically
    User: '1000:1000' // Non-root user
  },
  Env: ['PYTHONUNBUFFERED=1', 'PYTHONDONTWRITEBYTECODE=1']
};
```

---

## 3) Reduce Container Startup Overhead

### Issue
- Creating containers is slow due to Docker daemon overhead.

### Fix: Container Pool

**File:** `apps/runner/src/executors/container-pool.ts` (new)

```ts
export class ContainerPool {
  private pool: Docker.Container[] = [];
  private maxSize = 5;

  async getContainer(): Promise<Docker.Container> {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.docker.createContainer(this.containerConfig);
  }

  async returnContainer(container: Docker.Container): Promise<void> {
    if (this.pool.length < this.maxSize) {
      await container.restart(); // Reset container
      this.pool.push(container);
    } else {
      await container.remove();
    }
  }
}
```

**File:** `apps/runner/src/executors/docker.executor.ts`

```ts
const pool = new ContainerPool();

async executeCode(code: string, input?: string): Promise<ExecutionResult> {
  const container = await pool.getContainer();
  try {
    await container.start();
    // ... execution logic
  } finally {
    await pool.returnContainer(container);
  }
}
```

---

## 4) Optimize Python Execution

### Issue
- Python startup overhead and bytecode compilation.

### Fix: Precompiled Python

**File:** `apps/runner/Dockerfile`

```dockerfile
# Precompile standard library
RUN python -m compileall -f /usr/local/lib/python3.11

# Use .pyc files
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
```

**File:** `apps/runner/src/executors/docker.executor.ts`

```ts
// Use compiled Python
const execCode = `
import py_compile
import sys
try:
    py_compile.compile('user_code.py', doraise=True)
    exec(open('user_code.py').read())
except Exception as e:
    print(e, file=sys.stderr)
    sys.exit(1)
`;
```

---

## 5) Parallel Test Case Execution

### Issue
- Test cases run sequentially, increasing latency.

### Fix: Parallel Execution

**File:** `apps/runner/src/executors/docker.executor.ts`

```ts
async executeWithTestCases(code: string, testCases: TestCase[]): Promise<SubmissionResult> {
  const promises = testCases.map(async (testCase) => {
    const container = await this.createContainer();
    try {
      const result = await this.runInContainer(container, code, testCase.input);
      return { testCase, result };
    } finally {
      await container.remove();
    }
  });

  const results = await Promise.allSettled(promises);
  return this.aggregateResults(results);
}
```

---

## 6) Reduce Image Size

### Issue
- Large images increase pull time.

### Fix: Multi-stage Build

**File:** `apps/runner/Dockerfile`

```dockerfile
# Build stage
FROM python:3.11-slim as builder
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Runtime stage
FROM python:3.11-slim
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
RUN useradd -m -u 1000 runner
USER runner
WORKDIR /tmp
CMD ["python"]
```

---

## 7) Fast File System Operations

### Issue
- File I/O in containers is slow.

### Fix: Use Memory Filesystem

**File:** `apps/runner/src/executors/docker.executor.ts`

```ts
const containerConfig = {
  HostConfig: {
    Tmpfs: {
      '/tmp': 'rw,noexec,nosuid,size=100m',
      '/app': 'rw,noexec,nosuid,size=50m'
    }
  }
};
```

---

## 8) Optimize Queue Processing

### Issue
- Worker concurrency may not match container capacity.

### Fix: Dynamic Concurrency

**File:** `apps/runner/src/workers/code-execution.worker.ts`

```ts
const MAX_CONCURRENCY = parseInt(process.env.MAX_CONCURRENCY) || 5;
const queue = new Queue('code-execution', redisConfig);

new Worker('code-execution', async (job) => {
  // Process job
}, {
  concurrency: MAX_CONCURRENCY,
  limiter: {
    max: 100,
    duration: 60000 // 1 minute
  }
});
```

---

## 9) Reduce Network Latency

### Issue
- Runner and API may be in different regions.

### Fix: Co-locate Services

**Deployment:**
- Deploy API and runner in same region.
- Use internal DNS for communication.
- Use connection pooling for Redis/Mongo.

---

## 10) Cache Common Dependencies

### Issue
- Common libraries imported every execution.

### Fix: Pre-warm Container

**File:** `apps/runner/src/executors/docker.executor.ts`

```ts
async prewarmContainer(): Promise<void> {
  const container = await this.docker.createContainer({
    Image: this.imageName,
    Cmd: ['python', '-c', 'import sys, os, json'],
    HostConfig: { AutoRemove: true }
  });
  await container.start();
  await container.wait();
}
```

---

## 11) Optimize Result Transfer

### Issue
- Large outputs transferred slowly.

### Fix: Stream Results

**File:** `apps/runner/src/executors/docker.executor.ts`

```ts
async getContainerOutput(container: Docker.Container): Promise<string> {
  const stream = await container.logs({
    stdout: true,
    stderr: true,
    timestamps: false
  });
  
  let output = '';
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => {
      output += chunk.toString();
    });
    stream.on('end', () => resolve(output));
    stream.on('error', reject);
  });
}
```

---

## 12) Health Checks and Fast Fail

### Issue
- Slow failure detection.

### Fix: Quick Health Checks

**File:** `apps/runner/src/executors/docker.executor.ts`

```ts
async executeCode(code: string, input?: string): Promise<ExecutionResult> {
  const startTime = Date.now();
  const timeout = 5000; // 5 seconds
  
  try {
    const container = await this.createContainer();
    const exec = await container.exec({
      Cmd: ['python', '-c', code],
      AttachStdout: true,
      AttachStderr: true
    });
    
    const stream = await exec.start({
      hijack: true,
      stdin: false
    });
    
    // Set timeout
    const timeoutId = setTimeout(() => {
      container.kill();
    }, timeout);
    
    try {
      const output = await this.streamToString(stream);
      clearTimeout(timeoutId);
      return { output, status: 'success', duration: Date.now() - startTime };
    } catch (error) {
      clearTimeout(timeoutId);
      return { output: error.message, status: 'timeout', duration: Date.now() - startTime };
    }
  } catch (error) {
    return { output: error.message, status: 'error', duration: Date.now() - startTime };
  }
}
```

---

## 13) Monitor and Alert on Latency

### Fix: Latency Metrics

**File:** `apps/runner/src/metrics.ts` (new)

```ts
export const executionLatency = new Histogram({
  name: 'execution_duration_seconds',
  help: 'Duration of code execution',
  labelNames: ['status']
});

export const recordExecution = (duration: number, status: string) => {
  executionLatency.observe({ status }, duration / 1000);
};
```

---

## 14) Reduce Cold Starts with Warm Containers

### Fix: Container Warming

**File:** `apps/runner/src/index.ts`

```ts
async warmContainers() {
  const warmupCount = 2;
  for (let i = 0; i < warmupCount; i++) {
    const container = await docker.createContainer(containerConfig);
    await container.start();
    await container.stop(); // Keep ready
  }
}
```

---

## 15) Optimize Docker Daemon

### Fix: Docker Daemon Config

**File:** `/etc/docker/daemon.json` on runner host

```json
{
  "storage-driver": "overlay2",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  }
}
```

---

## Expected Improvements

- **Cold start**: 5–10s → < 1s
- **Execution latency**: 2–3s → < 1s
- **Throughput**: 2–3x improvement
- **Resource usage**: 30–50% reduction

---

## How to Apply

1. **Add Dockerfile** at `apps/runner/Dockerfile`.
2. **Set up CI** to build and push image.
3. **Update executor** to use prebuilt image.
4. **Add container pooling** for reuse.
5. **Tune constraints** based on testing.
6. **Monitor latency** with metrics.

---

**Status:** Ready to implement. These fixes will significantly reduce execution latency and improve reliability.
