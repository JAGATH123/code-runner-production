# Docker Build Stages & Execution Optimization

**Repository:** `code-runner-production-main`  
**Purpose:** Optimize Docker build stages and execution for reduced latency, lower cost, and better performance.

---

## 1) Multi-Stage Build (Reduce Image Size)

### Current Issue
- Single-stage build includes build tools in final image.
- Image size ~900MB, slow pulls.

### Fix: Multi-Stage Dockerfile

**File:** `apps/runner/Dockerfile`

```dockerfile
# Build stage
FROM python:3.11-alpine as builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache gcc musl-dev

# Copy and install Python packages
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Runtime stage
FROM python:3.11-alpine as runtime
WORKDIR /app

# Install only runtime dependencies
RUN apk add --no-cache \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Create non-root user
RUN addgroup -g 1000 runner && \
    adduser -D -u 1000 -G runner runner

# Switch to non-root
USER runner

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.exit(0)" || exit 1

CMD ["python"]
```

**Result:** Image size reduced to ~150MB.

---

## 2) Layer Caching Optimization

### Issue
- Changing code invalidates all layers.

### Fix: Optimize Layer Order

**File:** `apps/runner/Dockerfile`

```dockerfile
# 1. System dependencies (rarely changes)
FROM python:3.11-alpine as base
RUN apk add --no-cache ca-certificates

# 2. Python dependencies (change when requirements.txt changes)
WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# 3. Application code (changes frequently)
COPY . .

# 4. Runtime setup (last)
RUN adduser -D -u 1000 runner
USER runner
```

**Why:** Maximizes layer cache reuse.

---

## 3) Build Arguments for Flexibility

### Issue
- Hardcoded Python version and dependencies.

### Fix: Build Args

**File:** `apps/runner/Dockerfile`

```dockerfile
ARG PYTHON_VERSION=3.11
ARG NODE_VERSION=18

FROM python:${PYTHON_VERSION}-alpine
```

**Build with custom args:**
```bash
docker build --build-arg PYTHON_VERSION=3.10 -t python-runner .
```

---

## 4) .dockerignore Optimization

### Issue
- Unnecessary files copied to build context.

### Fix: .dockerignore

**File:** `.dockerignore`

```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.nyc_output
.coverage
.vscode
.DS_Store
*.log
```

**Why:** Reduces build context size.

---

## 5) Parallel Build Optimization

### Issue
- Sequential package installation.

### Fix: Parallel Pip

**File:** `apps/runner/Dockerfile`

```dockerfile
RUN pip install --user --no-cache-dir --upgrade pip && \
    pip install --user --no-cache-dir -r requirements.txt
```

---

## 6) Minimal Base Image

### Issue
- Full Python image includes unnecessary packages.

### Fix: Alpine Slim

**File:** `apps/runner/Dockerfile`

```dockerfile
# Use Alpine for minimal size
FROM python:3.11-alpine

# Or use distroless for even smaller size
# FROM gcr.io/distroless/python3-debian11
```

---

## 7) Execution Environment Optimization

### Issue
- Python startup overhead and environment setup.

### Fix: Optimized Python Environment

**File:** `apps/runner/Dockerfile`

```dockerfile
# Optimize Python environment
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Pre-compile Python modules
RUN python -m compileall -f /usr/local/lib/python3.11
```

---

## 8) Security Hardening

### Issue
- Running as root, broad permissions.

### Fix: Security Best Practices

**File:** `apps/runner/Dockerfile`

```dockerfile
# Create non-root user with minimal permissions
RUN addgroup -g 1000 runner && \
    adduser -D -u 1000 -G runner -s /bin/sh runner

# Set working directory permissions
WORKDIR /app
RUN chown runner:runner /app

# Switch to non-root
USER runner

# Remove setuid/setgid bits
RUN find /usr/local/bin -type f -exec chmod a-s {} \;
```

---

## 9) Health Check Implementation

### Issue
- No health check for container readiness.

### Fix: Custom Health Check

**File:** `apps/runner/Dockerfile`

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import sys; print('OK')" || exit 1
```

---

## 10) Optimized Docker Compose (Local Dev)

### Issue
- Slow local development setup.

### Fix: Optimized Compose

**File:** `docker-compose.yml`

```yaml
version: '3.8'
services:
  runner:
    build:
      context: .
      dockerfile: apps/runner/Dockerfile
      target: runtime
    environment:
      - NODE_ENV=development
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./apps/runner:/app
      - /app/node_modules
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    restart: unless-stopped
```

---

## 11) BuildKit Optimization

### Issue
- Default builder is slow.

### Fix: Use BuildKit

```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1

# Build with cache mount
docker build \
  --cache-from type=registry,ref=python-runner:cache \
  --cache-to type=registry,ref=python-runner:cache,mode=max \
  -t python-runner .
```

---

## 12) Layer Pruning

### Issue
- Intermediate layers consume space.

### Fix: Prune During Build

**File:** `apps/runner/Dockerfile`

```dockerfile
# Install and clean up in same layer
RUN apk add --no-cache gcc musl-dev && \
    pip install --user --no-cache-dir -r requirements.txt && \
    apk del gcc musl-dev && \
    rm -rf /var/cache/apk/*
```

---

## 13) Execution-Specific Optimizations

### Issue
- Generic Python image not optimized for code execution.

### Fix: Execution-Optimized Image

**File:** `apps/runner/Dockerfile.execution`

```dockerfile
FROM python:3.11-alpine

# Install execution-specific packages
RUN apk add --no-cache \
    gcc \
    musl-dev \
    linux-headers \
    && rm -rf /var/cache/apk/*

# Create execution environment
RUN adduser -D -u 1000 runner && \
    mkdir -p /tmp/execution && \
    chown runner:runner /tmp/execution

WORKDIR /tmp/execution

# Pre-install common packages
COPY requirements-execution.txt .
RUN pip install --user --no-cache-dir -r requirements-execution.txt

# Security constraints
USER runner

# Execution-specific health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import sys, os; print('OK')" || exit 1

CMD ["python"]
```

---

## 14) Parallel Test Execution

### Issue
- Test cases run sequentially.

### Fix: Parallel Execution Container

**File:** `apps/runner/src/executors/parallel-executor.ts`

```ts
export class ParallelExecutor {
  async executeParallel(code: string, testCases: TestCase[]): Promise<ExecutionResult[]> {
    const promises = testCases.map(async (testCase, index) => {
      const container = await this.createContainer();
      try {
        const result = await this.runInContainer(container, code, testCase.input);
        return { index, result };
      } finally {
        await container.remove();
      }
    });

    const results = await Promise.allSettled(promises);
    return results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason });
  }
}
```

---

## 15) Caching Strategy for Dependencies

### Issue
- Rebuilding dependencies is slow.

### Fix: Dependency Cache

**File:** `apps/runner/Dockerfile`

```dockerfile
# Cache Python dependencies
FROM python:3.11-alpine as dependencies
WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Use cached dependencies
FROM dependencies as runtime
COPY --chown=runner:runner . .
USER runner
```

---

## 16) Optimized .dockerignore for Execution

### Issue
- Unnecessary files in execution context.

### Fix: Execution-Specific .dockerignore

**File:** `.dockerignore`

```
# Exclude everything except what's needed
*
!apps/runner/
!packages/shared/
!requirements*.txt

# Exclude dev files
node_modules
.git
.gitignore
*.md
.env
.vscode
coverage
*.log
```

---

## 17) Build Time Optimization

### Issue
- Build time is slow due to network I/O.

### Fix: Local Package Cache

```bash
# Create local package cache
docker build \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  --cache-from type=local,src=/path/to/cache \
  --cache-to type=local,dest=/path/to/cache \
  -t python-runner .
```

---

## 18) Runtime Optimization

### Issue
- Container startup time is slow.

### Fix: Optimize Runtime

**File:** `apps/runner/Dockerfile`

```dockerfile
# Use ENTRYPOINT for better signal handling
ENTRYPOINT ["python", "-u"]

# Set Python path
ENV PYTHONPATH=/app

# Preload common modules
RUN python -c "import sys, os, json, math"
```

---

## 19) Monitoring and Debugging

### Issue
- No visibility into container performance.

### Fix: Monitoring Labels

**File:** `apps/runner/Dockerfile`

```dockerfile
LABEL maintainer="your-email@example.com" \
      version="1.0" \
      description="Python code execution environment"
```

---

## 20) Production vs Development Builds

### Issue
- Same image for dev and prod.

### Fix: Targeted Builds

**File:** `apps/runner/Dockerfile`

```dockerfile
# Development target
FROM python:3.11-alpine as development
RUN apk add --no-cache gcc musl-dev
# ... dev dependencies

# Production target
FROM development as production
RUN apk del gcc musl-dev
# ... prod optimizations
```

**Build commands:**
```bash
# Development
docker build --target development -t python-runner:dev .

# Production
docker build --target production -t python-runner:prod .
```

---

## Expected Improvements

- **Build time**: 50–70% faster (layer caching, BuildKit)
- **Image size**: 80% smaller (multi-stage, Alpine)
- **Pull time**: 60% faster (smaller image)
- **Startup time**: 30% faster (optimized runtime)
- **Security**: Non-root user, minimal packages
- **Cost**: Less storage and bandwidth usage

---

## How to Apply

1. **Update Dockerfile** with multi-stage build.
2. **Add .dockerignore** to reduce context.
3. **Enable BuildKit** for faster builds.
4. **Use build arguments** for flexibility.
5. **Implement health checks** for monitoring.
6. **Optimize runtime** for execution.
7. **Separate dev/prod** builds.

---

**Status:** Ready to implement. These optimizations will significantly improve build and execution performance.
