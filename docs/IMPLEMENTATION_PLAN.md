# Code Runner Platform - Implementation Plan

**Version:** 1.0
**Created:** January 2025
**Status:** Ready for Execution

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Assessment](#2-current-state-assessment)
3. [Implementation Phases](#3-implementation-phases)
4. [Phase 0: Foundation](#4-phase-0-foundation)
5. [Phase 1: Critical Fixes](#5-phase-1-critical-fixes)
6. [Phase 2: Core Infrastructure](#6-phase-2-core-infrastructure)
7. [Phase 3: Microservices](#7-phase-3-microservices)
8. [Phase 4: Production Hardening](#8-phase-4-production-hardening)
9. [Phase 5: Scaling & Optimization](#9-phase-5-scaling--optimization)
10. [Risk Management](#10-risk-management)
11. [Success Metrics](#11-success-metrics)

---

## 1. Executive Summary

### Goal
Transform the Code Runner Platform from a prototype into a production-ready, scalable architecture capable of supporting 5,000+ concurrent users with 99.9% uptime.

### Approach
Incremental migration with zero-downtime deployments. Each phase delivers working software while moving toward the target architecture.

### Timeline Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        IMPLEMENTATION TIMELINE                          │
│                                                                         │
│   PHASE 0: Foundation (Week 1)                                         │
│   ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░     │
│   • Project setup                                                       │
│   • Development environment                                             │
│   • CI/CD basics                                                        │
│                                                                         │
│   PHASE 1: Critical Fixes (Week 2-3)                                   │
│   ░░░░░░░░████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░     │
│   • Security vulnerabilities                                            │
│   • Single execution path                                               │
│   • Docker sandbox setup                                                │
│                                                                         │
│   PHASE 2: Core Infrastructure (Week 4-5)                              │
│   ░░░░░░░░░░░░░░░░░░░░░░░░████████████████░░░░░░░░░░░░░░░░░░░░░░░     │
│   • API Gateway                                                         │
│   • Redis queue                                                         │
│   • Container pooling                                                   │
│                                                                         │
│   PHASE 3: Microservices (Week 6-8)                                    │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████████████░░     │
│   • Service separation                                                  │
│   • Database optimization                                               │
│   • Caching layer                                                       │
│                                                                         │
│   PHASE 4: Production Hardening (Week 9-10)                            │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████     │
│   • Monitoring                                                          │
│   • Alerting                                                            │
│   • Load testing                                                        │
│                                                                         │
│   PHASE 5: Scaling (Ongoing)                                           │
│   • Auto-scaling                                                        │
│   • Performance optimization                                            │
│   • Cost optimization                                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Current State Assessment

### Architecture Issues

| Issue | Severity | Impact | Fix Phase |
|-------|----------|--------|-----------|
| Two execution paths | 🔴 Critical | Inconsistent behavior | Phase 1 |
| No Dockerfile | 🔴 Critical | Runner fails | Phase 1 |
| Debug routes exposed | 🔴 Critical | Security breach | Phase 1 |
| Default JWT secret | 🔴 Critical | Auth bypass | Phase 1 |
| No quotas/backpressure | 🟠 High | Cost explosion | Phase 1 |
| No container pooling | 🟠 High | Slow execution | Phase 2 |
| No caching | 🟠 High | DB overload | Phase 3 |
| No monitoring | 🟠 High | Blind to issues | Phase 4 |
| Hardcoded concurrency | 🟡 Medium | Can't scale | Phase 2 |
| LocalStorage progress | 🟡 Medium | Data loss | Phase 3 |
| No graceful shutdown | 🟡 Medium | Dropped requests | Phase 2 |
| No structured logging | 🟡 Medium | Hard to debug | Phase 2 |

### Current Architecture

```
CURRENT STATE (Problematic):
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ┌──────────┐                                                  │
│   │  Browser │                                                  │
│   └────┬─────┘                                                  │
│        │                                                        │
│        ▼                                                        │
│   ┌──────────┐     PATH A (Next.js local)                      │
│   │  Next.js │────────────────────────────▶ Docker (direct)    │
│   │   Web    │                                                  │
│   │          │     PATH B (Queue-based)                        │
│   │          │────▶ Express API ────▶ Redis ────▶ Runner       │
│   └──────────┘                                                  │
│                                                                 │
│   PROBLEMS:                                                     │
│   ✗ Two conflicting execution paths                            │
│   ✗ No high availability                                       │
│   ✗ No load balancing                                          │
│   ✗ No monitoring                                              │
│   ✗ Security vulnerabilities                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Implementation Phases

### Phase Overview

| Phase | Focus | Duration | Deliverables |
|-------|-------|----------|--------------|
| **Phase 0** | Foundation | 1 week | Dev environment, CI/CD, docs |
| **Phase 1** | Critical Fixes | 2 weeks | Security, single path, Docker |
| **Phase 2** | Core Infrastructure | 2 weeks | Gateway, queue, pooling |
| **Phase 3** | Microservices | 3 weeks | Service separation, caching |
| **Phase 4** | Production Hardening | 2 weeks | Monitoring, testing, alerts |
| **Phase 5** | Scaling | Ongoing | Auto-scaling, optimization |

### Dependencies

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PHASE DEPENDENCIES                               │
│                                                                         │
│   Phase 0 ─────▶ Phase 1 ─────▶ Phase 2 ─────▶ Phase 3                 │
│     │              │              │              │                      │
│     │              │              │              ▼                      │
│     │              │              │           Phase 4                   │
│     │              │              │              │                      │
│     │              │              │              ▼                      │
│     │              │              └──────────▶ Phase 5                  │
│     │              │                                                    │
│     │              └─── Can deploy to staging after Phase 1             │
│     │                                                                   │
│     └─── Must complete before any other work                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Phase 0: Foundation

**Duration:** 1 week
**Goal:** Set up proper development environment and project structure

### Tasks

#### 0.1 Project Structure Setup
```
□ Create proper folder structure:

  code-runner-production/
  ├── apps/
  │   ├── web/              # Next.js frontend
  │   ├── api-gateway/      # API Gateway (NEW)
  │   ├── services/         # Microservices (NEW)
  │   │   ├── auth/
  │   │   ├── problems/
  │   │   ├── execution/
  │   │   └── progress/
  │   └── runner/           # Code execution workers
  ├── packages/
  │   └── shared/           # Shared code
  ├── infrastructure/       # IaC (NEW)
  │   ├── docker/
  │   ├── kubernetes/
  │   └── terraform/
  ├── docs/                 # Documentation (NEW)
  │   ├── ARCHITECTURE.md
  │   ├── IMPLEMENTATION_PLAN.md
  │   └── RUNBOOK.md
  └── scripts/              # Utility scripts
```

#### 0.2 Development Environment
```
□ Create docker-compose.yml for local development:
  - MongoDB
  - Redis
  - All services

□ Create .env.example files for all services

□ Document local setup in README.md

□ Ensure all team members can run locally
```

#### 0.3 CI/CD Setup
```
□ GitHub Actions workflows:
  - lint.yml        # Run linting on PR
  - test.yml        # Run tests on PR
  - build.yml       # Build Docker images
  - deploy-dev.yml  # Deploy to dev environment

□ Docker Hub / GitHub Container Registry setup

□ Branch protection rules:
  - Require PR reviews
  - Require passing checks
  - No direct push to main
```

#### 0.4 Documentation
```
□ ARCHITECTURE.md (created ✓)
□ IMPLEMENTATION_PLAN.md (this document ✓)
□ CONTRIBUTING.md
□ API documentation (OpenAPI/Swagger)
```

### Deliverables
- [ ] Working local development environment
- [ ] CI/CD pipeline running
- [ ] Documentation complete
- [ ] All team members onboarded

---

## 5. Phase 1: Critical Fixes

**Duration:** 2 weeks
**Goal:** Fix security vulnerabilities and establish single execution path

### Tasks

#### 1.1 Security Fixes (Priority: CRITICAL)

##### 1.1.1 Remove/Protect Debug Routes
```
File: apps/web/src/app/api/debug/*/route.ts

Action: Add production guard to ALL debug routes

Code:
────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  // ... rest of debug code
}
────────────────────────────────────────────────────────────────

Verification:
□ Deploy to staging
□ Try to access /api/debug/* endpoints
□ Should return 404
```

##### 1.1.2 Enforce Strong JWT Secret
```
File: packages/shared/src/utils/jwt.utils.ts

Action: Add validation at startup

Code:
────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;

// Validate on module load
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required');
}

if (JWT_SECRET.length < 32) {
  throw new Error('FATAL: JWT_SECRET must be at least 32 characters');
}

const WEAK_SECRETS = ['secret', 'default', 'password', 'jwt_secret'];
if (WEAK_SECRETS.some(weak => JWT_SECRET.toLowerCase().includes(weak))) {
  throw new Error('FATAL: JWT_SECRET appears to be a weak/default value');
}

export const jwtSecret = JWT_SECRET;
────────────────────────────────────────────────────────────────

Verification:
□ Try starting app without JWT_SECRET → Should crash
□ Try starting app with weak secret → Should crash
□ Try starting app with strong secret → Should work
```

##### 1.1.3 Add Environment Validation
```
File: packages/shared/src/config/validate-env.ts (NEW)

Code:
────────────────────────────────────────────────────────────────
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  MONGODB_URI: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().url(),
});

export function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Environment validation failed:');
    result.error.issues.forEach(issue => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }

  return result.data;
}
────────────────────────────────────────────────────────────────

Usage: Call validateEnv() at startup of each service
```

#### 1.2 Single Execution Path (Priority: CRITICAL)

##### 1.2.1 Remove Next.js Local Execution
```
Files to modify:
- apps/web/src/app/api/run/route.ts
- apps/web/src/app/api/submit/route.ts

Action: Replace with redirect to queue-based API

Code:
────────────────────────────────────────────────────────────────
// apps/web/src/app/api/run/route.ts

export async function POST(request: Request) {
  // In production, this endpoint should not exist
  // Redirect to the proper API
  return NextResponse.json(
    {
      error: 'This endpoint is deprecated. Use /api/execution/submit',
      redirect: '/api/execution/submit'
    },
    { status: 410 } // Gone
  );
}
────────────────────────────────────────────────────────────────

Alternative: Delete these files entirely (recommended)
```

##### 1.2.2 Update Frontend API Client
```
File: apps/web/src/lib/api-client.ts

Action: Update all execution endpoints to use Express API

Code:
────────────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const apiClient = {
  // Execution endpoints - use Express API
  submitCode: async (code: string, problemId?: number) => {
    const response = await fetch(`${API_URL}/execution/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ code, problemId }),
    });
    return response.json();
  },

  submitForGrading: async (code: string, problemId: number) => {
    const response = await fetch(`${API_URL}/execution/submit/grade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ code, problemId }),
    });
    return response.json();
  },

  getResult: async (jobId: string) => {
    const response = await fetch(`${API_URL}/execution/result/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return response.json();
  },

  // Polling with timeout
  waitForResult: async (jobId: string, maxAttempts = 30, interval = 1000) => {
    for (let i = 0; i < maxAttempts; i++) {
      const result = await apiClient.getResult(jobId);

      if (result.status === 'completed' || result.status === 'failed') {
        return result;
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error('Timeout waiting for result');
  },
};
────────────────────────────────────────────────────────────────
```

#### 1.3 Docker Sandbox Setup (Priority: CRITICAL)

##### 1.3.1 Create Dockerfile for Python Sandbox
```
File: apps/runner/sandbox/Dockerfile (NEW)

Code:
────────────────────────────────────────────────────────────────
# Build stage
FROM python:3.11-alpine AS builder

WORKDIR /build

# Install build dependencies
RUN apk add --no-cache gcc musl-dev

# Install Python packages
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Runtime stage
FROM python:3.11-alpine AS runtime

# Security: Create non-root user
RUN addgroup -g 1000 sandbox && \
    adduser -D -u 1000 -G sandbox sandbox

# Copy Python packages from builder
COPY --from=builder /root/.local /home/sandbox/.local
ENV PATH=/home/sandbox/.local/bin:$PATH

# Set working directory
WORKDIR /sandbox

# Security: Switch to non-root user
USER sandbox

# Python optimizations
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONHASHSEED=random

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "print('ok')" || exit 1

CMD ["python"]
────────────────────────────────────────────────────────────────

File: apps/runner/sandbox/requirements.txt (NEW)

Code:
────────────────────────────────────────────────────────────────
# Core packages that students might need
# Keep minimal for fast builds

# No external packages initially
# Add based on curriculum needs
────────────────────────────────────────────────────────────────
```

##### 1.3.2 CI/CD for Sandbox Image
```
File: .github/workflows/build-sandbox.yml (NEW)

Code:
────────────────────────────────────────────────────────────────
name: Build Sandbox Image

on:
  push:
    paths:
      - 'apps/runner/sandbox/**'
    branches:
      - main
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}/python-sandbox

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha
            type=raw,value=latest

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: apps/runner/sandbox
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
────────────────────────────────────────────────────────────────
```

##### 1.3.3 Update Docker Executor to Pull Image
```
File: apps/runner/src/executors/docker.executor.ts

Changes:
────────────────────────────────────────────────────────────────
// Configuration
const SANDBOX_IMAGE = process.env.SANDBOX_IMAGE || 'ghcr.io/yourorg/python-sandbox:latest';

export class DockerExecutor {
  private docker: Docker;
  private imageReady: boolean = false;

  constructor() {
    this.docker = new Docker();
  }

  async initialize(): Promise<void> {
    await this.ensureImageExists();
    this.imageReady = true;
    console.log(`Sandbox image ready: ${SANDBOX_IMAGE}`);
  }

  private async ensureImageExists(): Promise<void> {
    try {
      await this.docker.getImage(SANDBOX_IMAGE).inspect();
      console.log(`Image ${SANDBOX_IMAGE} found locally`);
    } catch {
      console.log(`Pulling image ${SANDBOX_IMAGE}...`);
      await new Promise<void>((resolve, reject) => {
        this.docker.pull(SANDBOX_IMAGE, (err: Error, stream: NodeJS.ReadableStream) => {
          if (err) return reject(err);

          this.docker.modem.followProgress(stream, (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
      });
      console.log(`Image ${SANDBOX_IMAGE} pulled successfully`);
    }
  }
}
────────────────────────────────────────────────────────────────
```

#### 1.4 Add Quotas and Backpressure (Priority: HIGH)

##### 1.4.1 Rate Limiting Middleware
```
File: apps/api/src/middleware/rate-limit.middleware.ts (UPDATE)

Code:
────────────────────────────────────────────────────────────────
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';

// Per-user execution rate limit
export const executionRateLimit = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:exec:',
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 executions per minute
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: 'Too many executions. Please wait before running more code.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Per-user daily limit
export const dailyExecutionLimit = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:daily:',
  }),
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 500, // 500 executions per day
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: 'Daily execution limit reached. Try again tomorrow.',
    retryAfter: 86400,
  },
});

// General API rate limit
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests' },
});
────────────────────────────────────────────────────────────────
```

##### 1.4.2 Queue Backpressure
```
File: apps/api/src/routes/execution.routes.ts

Add before job creation:
────────────────────────────────────────────────────────────────
import { codeExecutionQueue } from '../queue/queue.config';

const MAX_QUEUE_DEPTH = parseInt(process.env.MAX_QUEUE_DEPTH || '200');

router.post('/submit',
  authMiddleware,
  executionRateLimit,
  dailyExecutionLimit,
  async (req, res) => {
    // Check queue depth (backpressure)
    const jobCounts = await codeExecutionQueue.getJobCounts();
    const queueDepth = jobCounts.waiting + jobCounts.active;

    if (queueDepth >= MAX_QUEUE_DEPTH) {
      return res.status(503).json({
        error: 'System is busy. Please try again in a few seconds.',
        queueDepth,
        estimatedWait: `${Math.ceil(queueDepth / 10)} seconds`,
      });
    }

    // ... rest of submit logic
  }
);
────────────────────────────────────────────────────────────────
```

### Phase 1 Deliverables
- [ ] All debug routes protected/removed
- [ ] JWT secret validation enforced
- [ ] Environment validation at startup
- [ ] Single execution path (queue-based only)
- [ ] Frontend updated to use Express API
- [ ] Docker sandbox image building in CI
- [ ] Rate limiting enabled
- [ ] Queue backpressure implemented
- [ ] All tests passing

### Phase 1 Verification
```
SECURITY CHECKLIST:
□ Cannot access /api/debug/* in production
□ App crashes with weak JWT_SECRET
□ App crashes with missing env vars
□ Cannot bypass rate limits

EXECUTION PATH CHECKLIST:
□ /api/run returns 410 Gone
□ /api/submit returns 410 Gone
□ Frontend uses /execution/* endpoints
□ Code execution works via queue

DOCKER CHECKLIST:
□ Sandbox image builds in CI
□ Runner pulls image successfully
□ Code executes in sandbox
□ Sandbox has no network access
```

---

## 6. Phase 2: Core Infrastructure

**Duration:** 2 weeks
**Goal:** Establish core infrastructure components

### Tasks

#### 2.1 API Gateway Setup

##### 2.1.1 Create API Gateway Service
```
Directory: apps/api-gateway/ (NEW)

Structure:
apps/api-gateway/
├── src/
│   ├── index.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   ├── logging.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/
│   │   └── proxy.routes.ts
│   └── config/
│       ├── services.ts
│       └── redis.ts
├── package.json
├── tsconfig.json
└── Dockerfile
```

##### 2.1.2 Gateway Implementation
```
File: apps/api-gateway/src/index.ts

Code:
────────────────────────────────────────────────────────────────
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

import { authMiddleware, optionalAuthMiddleware } from './middleware/auth.middleware';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware';
import { loggingMiddleware } from './middleware/logging.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { validateEnv } from '@shared/config/validate-env';

// Validate environment
validateEnv();

const app = express();

// Trust proxy (for rate limiting behind LB)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

// Request ID
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Logging
app.use(loggingMiddleware);

// Health check (no auth)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Service routing
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
  problems: process.env.PROBLEMS_SERVICE_URL || 'http://localhost:4002',
  execution: process.env.EXECUTION_SERVICE_URL || 'http://localhost:4003',
  progress: process.env.PROGRESS_SERVICE_URL || 'http://localhost:4004',
};

// Auth routes (no auth required for login/register)
app.use('/auth', createProxyMiddleware({
  target: services.auth,
  changeOrigin: true,
  pathRewrite: { '^/auth': '' },
}));

// Problems routes (optional auth)
app.use('/problems', optionalAuthMiddleware, rateLimitMiddleware, createProxyMiddleware({
  target: services.problems,
  changeOrigin: true,
  pathRewrite: { '^/problems': '' },
}));

// Execution routes (required auth, strict rate limit)
app.use('/execution', authMiddleware, rateLimitMiddleware, createProxyMiddleware({
  target: services.execution,
  changeOrigin: true,
  pathRewrite: { '^/execution': '' },
}));

// Progress routes (required auth)
app.use('/progress', authMiddleware, rateLimitMiddleware, createProxyMiddleware({
  target: services.progress,
  changeOrigin: true,
  pathRewrite: { '^/progress': '' },
}));

// Error handling
app.use(errorMiddleware);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
────────────────────────────────────────────────────────────────
```

#### 2.2 Container Pool Implementation

##### 2.2.1 Container Pool Class
```
File: apps/runner/src/executors/container-pool.ts (NEW)

Code:
────────────────────────────────────────────────────────────────
import Docker from 'dockerode';
import { EventEmitter } from 'events';

interface PooledContainer {
  container: Docker.Container;
  createdAt: number;
  lastUsedAt: number;
}

export class ContainerPool extends EventEmitter {
  private docker: Docker;
  private available: PooledContainer[] = [];
  private inUse: Map<string, PooledContainer> = new Map();
  private config: Docker.ContainerCreateOptions;

  private minSize: number;
  private maxSize: number;
  private maxAge: number; // Max container age in ms

  constructor(options: {
    minSize?: number;
    maxSize?: number;
    maxAge?: number;
  } = {}) {
    super();
    this.docker = new Docker();
    this.minSize = options.minSize || 3;
    this.maxSize = options.maxSize || 10;
    this.maxAge = options.maxAge || 30 * 60 * 1000; // 30 minutes

    this.config = {
      Image: process.env.SANDBOX_IMAGE || 'python-sandbox:latest',
      Tty: true,
      OpenStdin: true,
      HostConfig: {
        Memory: 128 * 1024 * 1024,
        MemorySwap: 128 * 1024 * 1024,
        CpuQuota: 50000,
        CpuPeriod: 100000,
        NetworkMode: 'none',
        ReadonlyRootfs: true,
        Tmpfs: { '/tmp': 'rw,noexec,nosuid,size=50m' },
        PidsLimit: 50,
        SecurityOpt: ['no-new-privileges'],
        CapDrop: ['ALL'],
        AutoRemove: false,
      },
      Env: ['PYTHONUNBUFFERED=1', 'PYTHONDONTWRITEBYTECODE=1'],
    };
  }

  async initialize(): Promise<void> {
    console.log(`Warming container pool (min: ${this.minSize})...`);

    const warmupPromises = [];
    for (let i = 0; i < this.minSize; i++) {
      warmupPromises.push(this.createContainer());
    }

    const containers = await Promise.all(warmupPromises);
    this.available.push(...containers);

    console.log(`Container pool warmed with ${this.available.length} containers`);

    // Start cleanup interval
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  async acquire(): Promise<Docker.Container> {
    // Try to get from pool
    while (this.available.length > 0) {
      const pooled = this.available.pop()!;

      // Check if container is still healthy
      try {
        const info = await pooled.container.inspect();
        if (info.State.Running) {
          pooled.lastUsedAt = Date.now();
          this.inUse.set(pooled.container.id, pooled);
          this.emit('acquired', { containerId: pooled.container.id });
          return pooled.container;
        }
      } catch {
        // Container is gone, try next
        continue;
      }
    }

    // Pool empty, create new if under max
    if (this.inUse.size < this.maxSize) {
      const pooled = await this.createContainer();
      pooled.lastUsedAt = Date.now();
      this.inUse.set(pooled.container.id, pooled);
      this.emit('created', { containerId: pooled.container.id });
      return pooled.container;
    }

    // At max capacity, wait for one to be released
    return new Promise((resolve) => {
      this.once('released', async () => {
        resolve(await this.acquire());
      });
    });
  }

  async release(container: Docker.Container): Promise<void> {
    const pooled = this.inUse.get(container.id);
    if (!pooled) return;

    this.inUse.delete(container.id);

    try {
      // Reset container state
      await this.resetContainer(container);

      // Return to pool if under max
      if (this.available.length < this.maxSize) {
        pooled.lastUsedAt = Date.now();
        this.available.push(pooled);
        this.emit('released', { containerId: container.id });
      } else {
        // Pool full, destroy
        await container.stop();
        await container.remove();
        this.emit('destroyed', { containerId: container.id });
      }
    } catch (error) {
      // Container cleanup failed, destroy it
      try {
        await container.kill();
        await container.remove({ force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  private async createContainer(): Promise<PooledContainer> {
    const container = await this.docker.createContainer(this.config);
    await container.start();

    return {
      container,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    };
  }

  private async resetContainer(container: Docker.Container): Promise<void> {
    // Clean up /tmp
    const exec = await container.exec({
      Cmd: ['sh', '-c', 'rm -rf /tmp/* 2>/dev/null || true'],
      AttachStdout: false,
      AttachStderr: false,
    });
    await exec.start({ Detach: true });
  }

  private async cleanup(): Promise<void> {
    const now = Date.now();

    // Remove old containers from pool
    const toRemove: PooledContainer[] = [];
    this.available = this.available.filter(pooled => {
      if (now - pooled.createdAt > this.maxAge) {
        toRemove.push(pooled);
        return false;
      }
      return true;
    });

    // Destroy old containers
    for (const pooled of toRemove) {
      try {
        await pooled.container.stop();
        await pooled.container.remove();
      } catch {
        // Ignore cleanup errors
      }
    }

    // Ensure minimum pool size
    while (this.available.length < this.minSize) {
      const pooled = await this.createContainer();
      this.available.push(pooled);
    }

    this.emit('cleanup', {
      removed: toRemove.length,
      available: this.available.length,
      inUse: this.inUse.size,
    });
  }

  getStats() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size,
      maxSize: this.maxSize,
    };
  }
}
────────────────────────────────────────────────────────────────
```

#### 2.3 Graceful Shutdown

##### 2.3.1 Implement for API
```
File: apps/api/src/index.ts

Add:
────────────────────────────────────────────────────────────────
import { createTerminus } from '@godaddy/terminus';
import http from 'http';

const app = express();
// ... app setup ...

const server = http.createServer(app);

// Graceful shutdown
createTerminus(server, {
  signal: 'SIGTERM',
  healthChecks: {
    '/health': async () => {
      // Check MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        throw new Error('MongoDB not connected');
      }
      // Check Redis connection
      await redis.ping();
      return { status: 'ok' };
    },
  },
  onSignal: async () => {
    console.log('SIGTERM received, starting graceful shutdown...');

    // Stop accepting new connections
    // (handled by terminus)

    // Close database connections
    await mongoose.connection.close();
    console.log('MongoDB connection closed');

    // Close Redis connection
    await redis.quit();
    console.log('Redis connection closed');
  },
  onShutdown: async () => {
    console.log('Graceful shutdown complete');
  },
  timeout: 30000, // 30 seconds
  logger: console.log,
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
────────────────────────────────────────────────────────────────
```

#### 2.4 Structured Logging

##### 2.4.1 Logger Setup
```
File: packages/shared/src/utils/logger.ts (NEW)

Code:
────────────────────────────────────────────────────────────────
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
    bindings: () => ({}),
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  base: {
    service: process.env.SERVICE_NAME || 'unknown',
    env: process.env.NODE_ENV || 'development',
  },
});

// Create child logger with context
export const createLogger = (context: Record<string, unknown>) => {
  return logger.child(context);
};

// Express middleware
export const loggingMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();
  const log = createLogger({
    requestId: req.id,
    method: req.method,
    path: req.path,
    userId: req.user?.id,
  });

  req.log = log;

  res.on('finish', () => {
    const duration = Date.now() - start;
    log.info({
      statusCode: res.statusCode,
      duration,
    }, 'Request completed');
  });

  next();
};
────────────────────────────────────────────────────────────────
```

### Phase 2 Deliverables
- [ ] API Gateway service created and deployed
- [ ] Container pool implemented
- [ ] Graceful shutdown for all services
- [ ] Structured logging throughout
- [ ] Environment-based configuration
- [ ] Health checks for all services

---

## 7. Phase 3: Microservices

**Duration:** 3 weeks
**Goal:** Split monolith into separate services

### Tasks

#### 3.1 Extract Auth Service
```
Directory: apps/services/auth/

Endpoints:
- POST /register
- POST /login
- POST /logout
- POST /refresh
- GET /me
- GET /validate (internal, for gateway)

Database: Users collection
```

#### 3.2 Extract Problems Service
```
Directory: apps/services/problems/

Endpoints:
- GET /              (list all)
- GET /:id           (get one)
- GET /:id/tests     (public tests)
- GET /:id/tests/all (all tests - internal only)
- GET /levels/:age   (get levels)
- GET /sessions/:id  (get session)

Database: Problems, TestCases collections
Caching: Redis (5 minute TTL)
```

#### 3.3 Extract Execution Service
```
Directory: apps/services/execution/

Endpoints:
- POST /submit
- POST /submit/grade
- GET /result/:id
- GET /queue/stats

Database: ExecutionResults collection
Queue: Redis (BullMQ)
Workers: Separate runner pods
```

#### 3.4 Create Progress Service
```
Directory: apps/services/progress/ (NEW)

Endpoints:
- GET /              (get user progress)
- POST /attempt      (record attempt)
- POST /complete     (mark complete)
- GET /summary       (get summary)

Database: UserProgress collection (NEW)
```

#### 3.5 Add Caching Layer
```
Implement Redis caching for:
- Problems (TTL: 5 min)
- Levels (TTL: 5 min)
- User progress summary (TTL: 1 min)

Cache invalidation:
- On problem update (admin)
- On progress update (user)
```

### Phase 3 Deliverables
- [ ] Auth service extracted and deployed
- [ ] Problems service extracted with caching
- [ ] Execution service extracted
- [ ] Progress service created
- [ ] All services communicating via gateway
- [ ] Database indexes optimized
- [ ] API documentation updated

---

## 8. Phase 4: Production Hardening

**Duration:** 2 weeks
**Goal:** Monitoring, alerting, and production readiness

### Tasks

#### 4.1 Prometheus Metrics
```
Metrics to collect:
- http_requests_total
- http_request_duration_seconds
- queue_depth
- queue_wait_time
- execution_duration_seconds
- container_pool_size
- container_pool_available
- error_total
```

#### 4.2 Grafana Dashboards
```
Dashboards:
- Overview (requests, errors, latency)
- Queue (depth, wait time, throughput)
- Runners (pool size, utilization)
- Business (DAU, executions per user)
```

#### 4.3 Alerting Rules
```
Critical:
- API health failing > 1 min
- Error rate > 5% for 5 min
- Queue depth > 500
- All runners down

Warning:
- Latency p95 > 2s
- Queue depth > 100 for 5 min
- CPU > 80% for 10 min
```

#### 4.4 Load Testing
```
Scenarios:
1. Normal load: 100 concurrent users
2. Peak load: 500 concurrent users
3. Stress test: 1000 concurrent users
4. Spike test: 0 → 500 → 0 users

Tools: k6, Artillery, or Locust
```

### Phase 4 Deliverables
- [ ] Prometheus collecting all metrics
- [ ] Grafana dashboards created
- [ ] Alerting rules configured
- [ ] Load tests passing
- [ ] Runbook documented
- [ ] Incident response plan

---

## 9. Phase 5: Scaling & Optimization

**Duration:** Ongoing
**Goal:** Auto-scaling and continuous improvement

### Tasks

#### 5.1 Kubernetes Auto-scaling
```
HPA Configuration:
- Web: CPU > 70% → scale up
- API: CPU > 70% → scale up
- Runners: Queue > 50 → scale up
```

#### 5.2 Performance Optimization
```
Areas to optimize:
- Database query performance
- Container startup time
- Network latency
- Cache hit rates
```

#### 5.3 Cost Optimization
```
Strategies:
- Spot instances for runners
- Scale down during off-hours
- Right-size instances
- Optimize cloud spend
```

### Phase 5 Deliverables
- [ ] Auto-scaling configured
- [ ] Performance baselines established
- [ ] Cost monitoring in place
- [ ] Continuous improvement process

---

## 10. Risk Management

### Identified Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data loss during migration | Low | High | Backup before each phase |
| Extended downtime | Medium | High | Blue-green deployments |
| Performance regression | Medium | Medium | Load testing each phase |
| Security vulnerability | Low | Critical | Security review each phase |
| Team skill gaps | Medium | Medium | Training and documentation |
| Scope creep | High | Medium | Strict phase boundaries |

### Mitigation Strategies

1. **Backup Before Migration**
   - Full MongoDB backup before each phase
   - Test restore procedure

2. **Blue-Green Deployments**
   - Run old and new versions in parallel
   - Quick rollback if issues arise

3. **Feature Flags**
   - Gradual rollout of new features
   - Easy disable if problems occur

4. **Monitoring First**
   - Set up monitoring before changes
   - Detect issues immediately

---

## 11. Success Metrics

### Technical Metrics

| Metric | Current | Phase 1 | Phase 4 | Target |
|--------|---------|---------|---------|--------|
| Uptime | Unknown | 99% | 99.5% | 99.9% |
| Execution p95 | 5-10s | 3s | 1s | <500ms |
| Error rate | Unknown | <5% | <1% | <0.1% |
| Queue wait | 10-30s | 5s | 2s | <1s |

### Business Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Concurrent users | 50 | 5000 |
| Daily executions | 1000 | 100,000 |
| User satisfaction | Unknown | >90% |

### Operational Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Deploy frequency | Weekly | Daily |
| Deploy time | 30 min | 5 min |
| Incident response | Hours | Minutes |
| Recovery time | Hours | <15 min |

---

## Appendix A: Checklist Summary

### Phase 0 Checklist
- [ ] Project structure created
- [ ] Docker compose for local dev
- [ ] CI/CD pipelines working
- [ ] Documentation complete

### Phase 1 Checklist
- [ ] Debug routes protected
- [ ] JWT secret validated
- [ ] Environment validation
- [ ] Single execution path
- [ ] Docker sandbox in CI
- [ ] Rate limiting
- [ ] Backpressure

### Phase 2 Checklist
- [ ] API Gateway deployed
- [ ] Container pool working
- [ ] Graceful shutdown
- [ ] Structured logging

### Phase 3 Checklist
- [ ] Auth service extracted
- [ ] Problems service extracted
- [ ] Execution service extracted
- [ ] Progress service created
- [ ] Caching implemented

### Phase 4 Checklist
- [ ] Prometheus metrics
- [ ] Grafana dashboards
- [ ] Alerting configured
- [ ] Load tests passing
- [ ] Runbook complete

### Phase 5 Checklist
- [ ] Auto-scaling configured
- [ ] Performance optimized
- [ ] Cost optimized
- [ ] Continuous improvement

---

**Document Owner:** Engineering Team
**Last Updated:** January 2025
**Next Review:** After each phase completion
