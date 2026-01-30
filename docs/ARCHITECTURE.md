# Code Runner Platform - Target Architecture

**Version:** 2.0
**Last Updated:** January 2025
**Status:** Target Architecture (Implementation Planned)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Layer-by-Layer Breakdown](#3-layer-by-layer-breakdown)
4. [Data Flow](#4-data-flow)
5. [Technology Stack](#5-technology-stack)
6. [Scaling Strategy](#6-scaling-strategy)
7. [Security Architecture](#7-security-architecture)
8. [Monitoring & Observability](#8-monitoring--observability)
9. [Disaster Recovery](#9-disaster-recovery)
10. [Cost Estimation](#10-cost-estimation)

---

## 1. Executive Summary

### Purpose
This document describes the target production architecture for the Code Runner Platform - an educational Python programming environment for students aged 11-18.

### Design Goals
- **Reliability:** 99.9% uptime (less than 8.7 hours downtime/year)
- **Performance:** Code execution response < 2 seconds (p95)
- **Scalability:** Support 5,000+ concurrent users
- **Security:** Isolated code execution, no data leaks
- **Cost Efficiency:** < $300/month at 20,000 MAU

### Current vs Target

| Aspect | Current State | Target State |
|--------|---------------|--------------|
| Execution Paths | 2 (conflicting) | 1 (queue-based) |
| High Availability | None | 2+ replicas per service |
| Container Startup | 1-2 seconds | < 100ms (pooled) |
| Monitoring | console.log | Prometheus + Grafana + Sentry |
| Auto-scaling | Manual | Kubernetes HPA |
| Security | Basic | Defense in depth |

---

## 2. Architecture Overview

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   ┌───────────┐                                                         │
│   │ Cloudflare│  CDN + DDoS Protection + Edge Caching                   │
│   │    CDN    │                                                         │
│   └─────┬─────┘                                                         │
│         │                                                               │
│         ▼                                                               │
│   ┌───────────┐                                                         │
│   │   nginx   │  Load Balancer + SSL Termination                        │
│   │    LB     │                                                         │
│   └─────┬─────┘                                                         │
│         │                                                               │
│    ┌────┴────┬────────────┐                                            │
│    ▼         ▼            ▼                                            │
│ ┌──────┐ ┌──────┐    ┌──────────┐                                      │
│ │ Web  │ │ Web  │    │   API    │  2+ Replicas for HA                  │
│ │  #1  │ │  #2  │    │  Gateway │                                      │
│ └──────┘ └──────┘    └────┬─────┘                                      │
│                           │                                            │
│         ┌─────────────────┼─────────────────┐                          │
│         ▼                 ▼                 ▼                          │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐                       │
│   │   Auth   │     │ Problems │     │Execution │  Microservices        │
│   │ Service  │     │ Service  │     │ Service  │                       │
│   └──────────┘     └──────────┘     └────┬─────┘                       │
│                                          │                             │
│                                          ▼                             │
│                                   ┌─────────────┐                      │
│                                   │    Redis    │  Queue + Cache       │
│                                   │   Cluster   │                      │
│                                   └──────┬──────┘                      │
│                                          │                             │
│              ┌───────────────────────────┼───────────────────────┐     │
│              ▼                           ▼                       ▼     │
│       ┌────────────┐             ┌────────────┐           ┌──────────┐│
│       │  Runner 1  │             │  Runner 2  │   ...     │ Runner N ││
│       │ (2-3 pods) │             │ (2-3 pods) │           │(2-3 pods)││
│       └─────┬──────┘             └─────┬──────┘           └────┬─────┘│
│             │                          │                       │      │
│             ▼                          ▼                       ▼      │
│       ┌────────────┐             ┌────────────┐           ┌──────────┐│
│       │ Container  │             │ Container  │           │Container ││
│       │   Pool     │             │   Pool     │           │  Pool    ││
│       │ (5-10 warm)│             │ (5-10 warm)│           │(5-10warm)││
│       └────────────┘             └────────────┘           └──────────┘│
│                                                                       │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│   │   MongoDB   │    │  Prometheus │    │   Sentry    │              │
│   │   Atlas     │    │  + Grafana  │    │   Errors    │              │
│   └─────────────┘    └─────────────┘    └─────────────┘              │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **Single Responsibility:** Each service does one thing well
2. **Loose Coupling:** Services communicate via APIs and queues
3. **High Availability:** No single point of failure
4. **Defense in Depth:** Multiple security layers
5. **Observable:** Every component emits metrics and logs
6. **Cost Conscious:** Scale down when not needed

---

## 3. Layer-by-Layer Breakdown

### Layer 1: Edge Layer (Cloudflare)

**Purpose:** First line of defense and performance optimization

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE                               │
│                                                                 │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│   │   DDoS      │ │    Edge     │ │    SSL      │              │
│   │ Protection  │ │   Caching   │ │ Termination │              │
│   └─────────────┘ └─────────────┘ └─────────────┘              │
│                                                                 │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│   │     WAF     │ │   Global    │ │    Bot      │              │
│   │  Firewall   │ │   Anycast   │ │  Detection  │              │
│   └─────────────┘ └─────────────┘ └─────────────┘              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- DDoS protection (Layer 3, 4, 7)
- Global CDN with 300+ edge locations
- SSL/TLS termination
- Web Application Firewall (WAF)
- Bot detection and mitigation
- Edge caching for static assets

**Configuration:**
```
Cache Rules:
- /*.js, /*.css, /images/* → Cache 1 week
- /api/levels/*, /api/problems/* → Cache 5 minutes
- /api/execution/* → No cache (dynamic)

Security Rules:
- Rate limit: 100 requests/minute per IP
- Block known malicious IPs
- Challenge suspicious requests
```

---

### Layer 2: Load Balancer (nginx)

**Purpose:** Distribute traffic and provide SSL termination

```
┌─────────────────────────────────────────────────────────────────┐
│                      NGINX LOAD BALANCER                        │
│                                                                 │
│                    Incoming Requests                            │
│                          │                                      │
│                          ▼                                      │
│              ┌───────────────────────┐                         │
│              │   Health Checker      │                         │
│              │   (every 5 seconds)   │                         │
│              └───────────┬───────────┘                         │
│                          │                                      │
│         ┌────────────────┼────────────────┐                    │
│         ▼                ▼                ▼                    │
│    ┌─────────┐     ┌─────────┐     ┌─────────┐                │
│    │ Server  │     │ Server  │     │ Server  │                │
│    │   #1    │     │   #2    │     │   #3    │                │
│    └─────────┘     └─────────┘     └─────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Load Balancing Strategies:**
- **Web servers:** Round Robin
- **API servers:** Least Connections
- **Health checks:** GET /health every 5 seconds

**nginx Configuration:**
```nginx
upstream web_servers {
    server web1:3000 weight=1 max_fails=3 fail_timeout=30s;
    server web2:3000 weight=1 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

upstream api_servers {
    least_conn;
    server api1:4000 weight=1;
    server api2:4000 weight=1;
    keepalive 64;
}

server {
    listen 443 ssl http2;
    server_name coderunner.example.com;

    # Static files and web app
    location / {
        proxy_pass http://web_servers;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Request-ID $request_id;
    }

    # API requests
    location /api/ {
        proxy_pass http://api_servers;
        proxy_read_timeout 60s;
    }
}
```

---

### Layer 3: Web Application (Next.js)

**Purpose:** Serve the user interface

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEB APPLICATION (Next.js)                    │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                    RESPONSIBILITIES                      │  │
│   │                                                          │  │
│   │   1. Server-Side Rendering (SSR)                        │  │
│   │      - Pre-render pages for SEO and performance         │  │
│   │                                                          │  │
│   │   2. Static Asset Serving                               │  │
│   │      - JavaScript bundles                               │  │
│   │      - CSS stylesheets                                  │  │
│   │      - Images and fonts                                 │  │
│   │                                                          │  │
│   │   3. Client-Side Navigation                             │  │
│   │      - SPA-like experience after initial load           │  │
│   │                                                          │  │
│   │   4. API Proxy (optional)                               │  │
│   │      - Forward /api/* to API Gateway                    │  │
│   │                                                          │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   Replicas: 2 (minimum for HA)                                 │
│   Resources: 512MB RAM, 0.5 CPU per replica                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- React 18 with Server Components
- App Router for file-based routing
- Monaco Editor for code editing
- Tailwind CSS for styling
- Radix UI for accessible components

---

### Layer 4: API Gateway

**Purpose:** Single entry point for all API requests

```
┌─────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                              │
│                                                                 │
│                    Incoming Request                             │
│                          │                                      │
│                          ▼                                      │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                  REQUEST PIPELINE                        │  │
│   │                                                          │  │
│   │   1. Request Logging                                     │  │
│   │      └─ Log request ID, path, method, timestamp          │  │
│   │                                                          │  │
│   │   2. Authentication                                      │  │
│   │      └─ Validate JWT token                               │  │
│   │      └─ Extract user context                             │  │
│   │                                                          │  │
│   │   3. Rate Limiting                                       │  │
│   │      └─ Check per-user limits                            │  │
│   │      └─ Check per-IP limits                              │  │
│   │                                                          │  │
│   │   4. Request Routing                                     │  │
│   │      └─ /auth/*      → Auth Service                      │  │
│   │      └─ /problems/*  → Problems Service                  │  │
│   │      └─ /execution/* → Execution Service                 │  │
│   │      └─ /progress/*  → Progress Service                  │  │
│   │                                                          │  │
│   │   5. Response Transformation                             │  │
│   │      └─ Add CORS headers                                 │  │
│   │      └─ Add security headers                             │  │
│   │                                                          │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Rate Limiting Configuration:**
```
Per User:
- Execution: 10 requests/minute, 100 requests/hour, 500 requests/day
- General API: 60 requests/minute

Per IP (unauthenticated):
- All endpoints: 30 requests/minute
```

---

### Layer 5: Microservices

**Purpose:** Handle specific business domains

#### Auth Service
```
┌─────────────────────────────────────────────────────────────────┐
│                        AUTH SERVICE                             │
│                                                                 │
│   Endpoints:                                                    │
│   ├─ POST /auth/register     Create new user account            │
│   ├─ POST /auth/login        Authenticate and get JWT           │
│   ├─ POST /auth/logout       Invalidate session                 │
│   ├─ POST /auth/refresh      Refresh expired token              │
│   └─ GET  /auth/me           Get current user info              │
│                                                                 │
│   Data Owned:                                                   │
│   ├─ Users collection                                           │
│   └─ Sessions/Tokens                                            │
│                                                                 │
│   Dependencies: MongoDB                                         │
│   Replicas: 2                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Problems Service
```
┌─────────────────────────────────────────────────────────────────┐
│                      PROBLEMS SERVICE                           │
│                                                                 │
│   Endpoints:                                                    │
│   ├─ GET /problems              List all problems               │
│   ├─ GET /problems/:id          Get problem details             │
│   ├─ GET /problems/:id/tests    Get public test cases           │
│   ├─ GET /levels/:age_group     Get levels structure            │
│   └─ GET /sessions/:id          Get session with problems       │
│                                                                 │
│   Data Owned:                                                   │
│   ├─ Problems collection                                        │
│   ├─ TestCases collection                                       │
│   └─ Levels/Sessions metadata                                   │
│                                                                 │
│   Dependencies: MongoDB, Redis (cache)                          │
│   Replicas: 2                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Execution Service
```
┌─────────────────────────────────────────────────────────────────┐
│                     EXECUTION SERVICE                           │
│                                                                 │
│   Endpoints:                                                    │
│   ├─ POST /execution/submit        Submit code for execution    │
│   ├─ POST /execution/submit/grade  Submit code for grading      │
│   ├─ GET  /execution/result/:id    Get execution result         │
│   └─ GET  /execution/queue/stats   Get queue statistics         │
│                                                                 │
│   Data Owned:                                                   │
│   ├─ ExecutionResults collection                                │
│   └─ Job queue (Redis)                                          │
│                                                                 │
│   Dependencies: MongoDB, Redis, Runner Workers                  │
│   Replicas: 2                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Progress Service
```
┌─────────────────────────────────────────────────────────────────┐
│                      PROGRESS SERVICE                           │
│                                                                 │
│   Endpoints:                                                    │
│   ├─ GET  /progress              Get user's progress            │
│   ├─ POST /progress/attempt      Record attempt                 │
│   ├─ POST /progress/complete     Mark problem completed         │
│   └─ GET  /progress/summary      Get progress summary           │
│                                                                 │
│   Data Owned:                                                   │
│   └─ UserProgress collection                                    │
│                                                                 │
│   Dependencies: MongoDB                                         │
│   Replicas: 2                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Layer 6: Message Queue (Redis)

**Purpose:** Decouple services and handle async processing

```
┌─────────────────────────────────────────────────────────────────┐
│                       REDIS CLUSTER                             │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                     JOB QUEUES                           │  │
│   │                                                          │  │
│   │   code-execution:                                        │  │
│   │   ┌─────┬─────┬─────┬─────┬─────┐                       │  │
│   │   │Job 1│Job 2│Job 3│Job 4│ ... │  (FIFO)               │  │
│   │   └─────┴─────┴─────┴─────┴─────┘                       │  │
│   │                                                          │  │
│   │   code-submission:                                       │  │
│   │   ┌─────┬─────┬─────┐                                   │  │
│   │   │Job A│Job B│Job C│  (FIFO, lower concurrency)        │  │
│   │   └─────┴─────┴─────┘                                   │  │
│   │                                                          │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                       CACHE                              │  │
│   │                                                          │  │
│   │   levels:11-14      → [cached level data]    TTL: 5min  │  │
│   │   levels:15-18      → [cached level data]    TTL: 5min  │  │
│   │   problem:42        → [cached problem]       TTL: 5min  │  │
│   │   rate:user:123     → 5                      TTL: 60s   │  │
│   │   session:abc       → [session data]         TTL: 7d    │  │
│   │                                                          │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   Configuration:                                                │
│   ├─ Cluster mode: 3 masters + 3 replicas                      │
│   ├─ Memory: 1GB per node                                      │
│   └─ Persistence: AOF enabled                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Queue Configuration (BullMQ):**
```typescript
// code-execution queue
{
  defaultJobOptions: {
    attempts: 1,           // No retries for user jobs
    timeout: 30000,        // 30 second timeout
    removeOnComplete: 100, // Keep last 100 completed
    removeOnFail: 50,      // Keep last 50 failed
  },
  limiter: {
    max: 100,              // Max 100 jobs per minute
    duration: 60000,
  },
}

// code-submission queue
{
  defaultJobOptions: {
    attempts: 1,
    timeout: 60000,        // 60 second timeout (more test cases)
    removeOnComplete: 100,
    removeOnFail: 50,
  },
}
```

---

### Layer 7: Runner Workers

**Purpose:** Execute user code in isolated containers

```
┌─────────────────────────────────────────────────────────────────┐
│                       RUNNER WORKER                             │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                    WORKER PROCESS                        │  │
│   │                                                          │  │
│   │   ┌─────────────────────────────────────────────────┐   │  │
│   │   │              JOB PROCESSOR                       │   │  │
│   │   │                                                  │   │  │
│   │   │   1. Pull job from Redis queue                   │   │  │
│   │   │   2. Update status to "processing"               │   │  │
│   │   │   3. Get container from pool                     │   │  │
│   │   │   4. Execute code with timeout                   │   │  │
│   │   │   5. Capture stdout/stderr                       │   │  │
│   │   │   6. Save result to MongoDB                      │   │  │
│   │   │   7. Return container to pool                    │   │  │
│   │   │                                                  │   │  │
│   │   └─────────────────────────────────────────────────┘   │  │
│   │                                                          │  │
│   │   Concurrency: 5-10 jobs per worker                     │  │
│   │   Workers per runner: 2-3                               │  │
│   │                                                          │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                  CONTAINER POOL                          │  │
│   │                                                          │  │
│   │   Pre-warmed containers ready for immediate use:         │  │
│   │                                                          │  │
│   │   🐳 Container 1  [BUSY - running job]                  │  │
│   │   🐳 Container 2  [BUSY - running job]                  │  │
│   │   🐳 Container 3  [WARM - ready]                        │  │
│   │   🐳 Container 4  [WARM - ready]                        │  │
│   │   🐳 Container 5  [WARM - ready]                        │  │
│   │                                                          │  │
│   │   Pool size: 5-10 containers                            │  │
│   │   Warm-up time: < 5ms (vs 1000ms cold start)            │  │
│   │                                                          │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Container Sandbox Configuration:**
```typescript
const containerConfig = {
  Image: 'coderunner/python-sandbox:v1.0.0',
  HostConfig: {
    Memory: 128 * 1024 * 1024,    // 128MB RAM limit
    MemorySwap: 128 * 1024 * 1024, // No swap
    CpuQuota: 50000,               // 0.5 CPU
    CpuPeriod: 100000,
    NetworkMode: 'none',           // No network access
    ReadonlyRootfs: true,          // Read-only filesystem
    Tmpfs: {
      '/tmp': 'rw,noexec,nosuid,size=50m'
    },
    PidsLimit: 50,                 // Limit processes
    SecurityOpt: ['no-new-privileges'],
    CapDrop: ['ALL'],              // Drop all capabilities
  },
  Env: [
    'PYTHONUNBUFFERED=1',
    'PYTHONDONTWRITEBYTECODE=1',
  ],
};
```

---

### Layer 8: Data & Monitoring

**Purpose:** Persist data and observe system health

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA & MONITORING                            │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐    │
│   │                   MONGODB ATLAS                        │    │
│   │                                                        │    │
│   │   Collections:                                         │    │
│   │   ├─ users              (Auth Service)                 │    │
│   │   ├─ problems           (Problems Service)             │    │
│   │   ├─ testcases          (Problems Service)             │    │
│   │   ├─ executionresults   (Execution Service, TTL: 7d)   │    │
│   │   ├─ userprogress       (Progress Service)             │    │
│   │   └─ cheatsheets        (Problems Service)             │    │
│   │                                                        │    │
│   │   Cluster: M10 (Production) or M0 (Development)        │    │
│   │   Backups: Continuous, point-in-time recovery          │    │
│   │                                                        │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                 │
│   ┌───────────────────┐  ┌───────────────────┐                 │
│   │   PROMETHEUS      │  │     GRAFANA       │                 │
│   │                   │  │                   │                 │
│   │   Metrics:        │  │   Dashboards:     │                 │
│   │   • Request count │  │   • Overview      │                 │
│   │   • Latency       │  │   • Queue depth   │                 │
│   │   • Queue depth   │  │   • Error rate    │                 │
│   │   • Error rate    │  │   • Performance   │                 │
│   │   • CPU/Memory    │  │                   │                 │
│   │                   │  │   Alerts:         │                 │
│   │   Scrape: 15s     │  │   • Slack/Email   │                 │
│   │   Retention: 15d  │  │   • PagerDuty     │                 │
│   │                   │  │                   │                 │
│   └───────────────────┘  └───────────────────┘                 │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐    │
│   │                      SENTRY                            │    │
│   │                                                        │    │
│   │   Error Tracking:                                      │    │
│   │   • Stack traces with source maps                      │    │
│   │   • User context (who experienced the error)           │    │
│   │   • Breadcrumbs (what led to the error)               │    │
│   │   • Release tracking                                   │    │
│   │                                                        │    │
│   │   Alerts: Slack, Email on new errors                   │    │
│   │                                                        │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Flow

### Code Execution Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CODE EXECUTION - COMPLETE FLOW                       │
│                                                                         │
│   STEP 1: User submits code                                            │
│   ─────────────────────────                                            │
│   Browser → POST /api/execution/submit                                  │
│   Body: { code: "print('hello')", problemId: 42 }                      │
│                                                                         │
│   STEP 2: Request traverses infrastructure                             │
│   ────────────────────────────────────────                             │
│   Cloudflare → nginx → API Gateway → Execution Service                 │
│                                                                         │
│   STEP 3: Execution Service processes request                          │
│   ───────────────────────────────────────────                          │
│   ┌─────────────────────────────────────────────────────────────┐      │
│   │ 1. Validate JWT token                                       │      │
│   │ 2. Check rate limits (Redis)                                │      │
│   │ 3. Check queue depth (backpressure)                         │      │
│   │ 4. Create ExecutionResult in MongoDB (status: pending)      │      │
│   │ 5. Add job to Redis queue                                   │      │
│   │ 6. Return { jobId, status: "queued" }                       │      │
│   └─────────────────────────────────────────────────────────────┘      │
│                                                                         │
│   STEP 4: Runner processes job                                         │
│   ────────────────────────────                                         │
│   ┌─────────────────────────────────────────────────────────────┐      │
│   │ 1. Pull job from queue                                      │      │
│   │ 2. Update ExecutionResult (status: processing)              │      │
│   │ 3. Get container from pool                                  │      │
│   │ 4. Execute code in sandbox (timeout: 30s)                   │      │
│   │ 5. Capture stdout, stderr, execution time                   │      │
│   │ 6. Update ExecutionResult (status: completed/failed)        │      │
│   │ 7. Return container to pool                                 │      │
│   └─────────────────────────────────────────────────────────────┘      │
│                                                                         │
│   STEP 5: User polls for result                                        │
│   ─────────────────────────────                                        │
│   Browser → GET /api/execution/result/:jobId                           │
│   Response: { status: "completed", output: "hello\n", time: 47 }       │
│                                                                         │
│   TIMELINE:                                                            │
│   ─────────                                                            │
│   0ms     - User clicks "Run"                                          │
│   50ms    - Request reaches Execution Service                          │
│   60ms    - Job queued, response sent to user                          │
│   100ms   - Runner picks up job                                        │
│   150ms   - Container ready (from pool)                                │
│   200ms   - Code execution completes                                   │
│   250ms   - Result saved to MongoDB                                    │
│   300ms   - User's poll receives result                                │
│                                                                         │
│   TOTAL: ~300ms (user perceives near-instant response)                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Code Grading Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CODE GRADING - COMPLETE FLOW                         │
│                                                                         │
│   STEP 1: User submits code for grading                                │
│   ─────────────────────────────────────                                │
│   Browser → POST /api/execution/submit/grade                           │
│   Body: { code: "def add(a,b): return a+b", problemId: 42 }            │
│                                                                         │
│   STEP 2: Execution Service prepares grading job                       │
│   ──────────────────────────────────────────                           │
│   ┌─────────────────────────────────────────────────────────────┐      │
│   │ 1. Fetch ALL test cases for problem (including hidden)      │      │
│   │ 2. Create job with code + test cases                        │      │
│   │ 3. Add to code-submission queue                             │      │
│   └─────────────────────────────────────────────────────────────┘      │
│                                                                         │
│   STEP 3: Runner grades submission                                     │
│   ────────────────────────────────                                     │
│   ┌─────────────────────────────────────────────────────────────┐      │
│   │ For each test case:                                         │      │
│   │   1. Run code with test input                               │      │
│   │   2. Compare output with expected                           │      │
│   │   3. Record pass/fail                                       │      │
│   │                                                             │      │
│   │ Test Cases:                                                 │      │
│   │   ✓ Test 1: add(1, 2) = 3       (public)                   │      │
│   │   ✓ Test 2: add(0, 0) = 0       (public)                   │      │
│   │   ✓ Test 3: add(-1, 1) = 0      (hidden)                   │      │
│   │   ✗ Test 4: add(999, 1) = 1000  (hidden) - got 1001        │      │
│   │                                                             │      │
│   │ Result: 3/4 passed (75%)                                    │      │
│   └─────────────────────────────────────────────────────────────┘      │
│                                                                         │
│   STEP 4: Result returned to user                                      │
│   ───────────────────────────────                                      │
│   {                                                                    │
│     "status": "completed",                                             │
│     "passed": 3,                                                       │
│     "total": 4,                                                        │
│     "passRate": 75,                                                    │
│     "testResults": [                                                   │
│       { "input": "1, 2", "expected": "3", "passed": true },           │
│       { "input": "0, 0", "expected": "0", "passed": true },           │
│       { "passed": true, "hidden": true },                             │
│       { "passed": false, "hidden": true }                             │
│     ]                                                                  │
│   }                                                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Technology Stack

### Core Technologies

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | Next.js | 15.x | React framework with SSR |
| **Frontend** | React | 18.x | UI library |
| **Frontend** | TypeScript | 5.x | Type safety |
| **Frontend** | Tailwind CSS | 3.x | Styling |
| **Frontend** | Monaco Editor | 0.45.x | Code editor |
| **Backend** | Node.js | 20.x LTS | Runtime |
| **Backend** | Express.js | 4.x | API framework |
| **Backend** | BullMQ | 5.x | Job queue |
| **Database** | MongoDB | 7.x | Document database |
| **Cache/Queue** | Redis | 7.x | Cache and message broker |
| **Container** | Docker | 24.x | Code isolation |
| **Orchestration** | Kubernetes | 1.28+ | Container orchestration |

### Infrastructure

| Component | Service | Tier |
|-----------|---------|------|
| **CDN** | Cloudflare | Free / Pro |
| **Database** | MongoDB Atlas | M0 (dev) / M10 (prod) |
| **Redis** | Upstash / Redis Cloud | Free / Pay-as-you-go |
| **Compute** | Railway / Hetzner / AWS | Various |
| **Monitoring** | Prometheus + Grafana | Self-hosted |
| **Errors** | Sentry | Free tier |
| **Logs** | Grafana Loki | Self-hosted |

---

## 6. Scaling Strategy

### Horizontal Scaling

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SCALING TRIGGERS                                 │
│                                                                         │
│   COMPONENT        METRIC              SCALE UP         SCALE DOWN      │
│   ─────────────────────────────────────────────────────────────────    │
│   Web              CPU > 70%           +1 replica       CPU < 30%       │
│   API Gateway      CPU > 70%           +1 replica       CPU < 30%       │
│   Auth Service     CPU > 70%           +1 replica       CPU < 30%       │
│   Problems Svc     CPU > 70%           +1 replica       CPU < 30%       │
│   Execution Svc    CPU > 70%           +1 replica       CPU < 30%       │
│   Runner           Queue depth > 50    +1 runner        Queue < 10      │
│                                                                         │
│   SCALING LIMITS:                                                       │
│   ─────────────────                                                    │
│   Web:             min 2, max 5                                        │
│   API Gateway:     min 2, max 5                                        │
│   Services:        min 2, max 5                                        │
│   Runners:         min 1, max 10                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Capacity Planning

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      CAPACITY ESTIMATION                                │
│                                                                         │
│   SCENARIO: 500 Concurrent Users (10 classes × 50 students)            │
│                                                                         │
│   Assumptions:                                                          │
│   • Each student runs code 2x per minute during active session         │
│   • Active session duration: 30 minutes                                │
│   • Execution time: 2 seconds average                                  │
│                                                                         │
│   Calculations:                                                         │
│   • Executions per minute: 500 users × 2 runs = 1000/min              │
│   • Executions per second: 1000/60 = ~17/sec                          │
│   • With 2s execution time, concurrent jobs: 17 × 2 = 34              │
│   • Runner capacity needed: 34 / 5 (concurrency) = 7 runners          │
│                                                                         │
│   Recommended Configuration:                                            │
│   • Runners: 3 (normal) → 7 (peak)                                    │
│   • Container pool: 10 per runner                                      │
│   • Redis: 1GB memory                                                  │
│   • MongoDB: M10 tier                                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Security Architecture

### Defense in Depth

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                                  │
│                                                                         │
│   LAYER 1: EDGE (Cloudflare)                                           │
│   ──────────────────────────                                           │
│   • DDoS protection                                                    │
│   • WAF rules                                                          │
│   • Bot detection                                                      │
│   • Rate limiting (100 req/min per IP)                                │
│                                                                         │
│   LAYER 2: TRANSPORT                                                   │
│   ──────────────────────                                               │
│   • TLS 1.3 everywhere                                                 │
│   • Certificate pinning (optional)                                     │
│   • HSTS headers                                                       │
│                                                                         │
│   LAYER 3: APPLICATION                                                 │
│   ───────────────────────                                              │
│   • JWT authentication (RS256)                                         │
│   • Per-user rate limiting                                             │
│   • Input validation (Zod schemas)                                     │
│   • CORS restricted to web domain                                      │
│   • Security headers (Helmet.js)                                       │
│                                                                         │
│   LAYER 4: CODE EXECUTION                                              │
│   ───────────────────────────                                          │
│   • Network isolation (--network none)                                 │
│   • Memory limits (128MB)                                              │
│   • CPU limits (0.5 cores)                                             │
│   • Read-only filesystem                                               │
│   • No privileged access                                               │
│   • Process limits (50 PIDs)                                           │
│   • Execution timeout (30s)                                            │
│                                                                         │
│   LAYER 5: DATA                                                        │
│   ─────────────                                                        │
│   • Encryption at rest (MongoDB Atlas)                                 │
│   • Encryption in transit (TLS)                                        │
│   • Password hashing (bcrypt, 10 rounds)                               │
│   • No sensitive data in logs                                          │
│   • TTL on execution results (7 days)                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      JWT AUTHENTICATION                                 │
│                                                                         │
│   LOGIN:                                                               │
│   ───────                                                              │
│   1. User: POST /auth/login { username, password }                     │
│   2. Server: Verify password against bcrypt hash                       │
│   3. Server: Generate JWT with claims:                                 │
│      {                                                                 │
│        sub: userId,                                                    │
│        username: "student42",                                          │
│        role: "student",                                                │
│        age_group: "15-18",                                             │
│        iat: 1705312800,                                                │
│        exp: 1705917600  // 7 days                                      │
│      }                                                                 │
│   4. Server: Return { token, user }                                    │
│   5. Client: Store token in httpOnly cookie                            │
│                                                                         │
│   AUTHENTICATED REQUEST:                                               │
│   ───────────────────────                                              │
│   1. Client: Include Authorization: Bearer <token>                     │
│   2. API Gateway: Validate signature                                   │
│   3. API Gateway: Check expiration                                     │
│   4. API Gateway: Extract user context                                 │
│   5. Service: Process request with user context                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Monitoring & Observability

### Metrics

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         KEY METRICS                                     │
│                                                                         │
│   AVAILABILITY:                                                        │
│   ─────────────                                                        │
│   • Uptime percentage (target: 99.9%)                                  │
│   • Health check success rate                                          │
│   • Error rate by endpoint                                             │
│                                                                         │
│   PERFORMANCE:                                                         │
│   ────────────                                                         │
│   • Request latency (p50, p95, p99)                                   │
│   • Queue wait time                                                    │
│   • Execution duration                                                 │
│   • Container pool utilization                                         │
│                                                                         │
│   THROUGHPUT:                                                          │
│   ───────────                                                          │
│   • Requests per second                                                │
│   • Executions per minute                                              │
│   • Queue depth                                                        │
│   • Active jobs                                                        │
│                                                                         │
│   RESOURCES:                                                           │
│   ──────────                                                           │
│   • CPU utilization                                                    │
│   • Memory utilization                                                 │
│   • Disk usage                                                         │
│   • Network I/O                                                        │
│                                                                         │
│   BUSINESS:                                                            │
│   ─────────                                                            │
│   • Daily active users                                                 │
│   • Executions per user                                                │
│   • Problem completion rate                                            │
│   • Session duration                                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Alerting Rules

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ALERT RULES                                     │
│                                                                         │
│   CRITICAL (Page immediately):                                         │
│   ────────────────────────────                                         │
│   • API health check failing > 1 minute                                │
│   • Error rate > 5% for 5 minutes                                      │
│   • Queue depth > 500                                                  │
│   • All runners down                                                   │
│   • Database connection failed                                         │
│                                                                         │
│   WARNING (Notify during business hours):                              │
│   ────────────────────────────────────────                             │
│   • API latency p95 > 2 seconds                                        │
│   • Queue depth > 100 for 5 minutes                                    │
│   • CPU > 80% for 10 minutes                                           │
│   • Memory > 85% for 10 minutes                                        │
│   • Error rate > 1% for 10 minutes                                     │
│                                                                         │
│   INFO (Log only):                                                     │
│   ─────────────────                                                    │
│   • Deployment completed                                               │
│   • Scaling event                                                      │
│   • Configuration change                                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Disaster Recovery

### Backup Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKUP STRATEGY                                 │
│                                                                         │
│   MONGODB (Atlas):                                                     │
│   ────────────────                                                     │
│   • Continuous backup enabled                                          │
│   • Point-in-time recovery (last 7 days)                              │
│   • Daily snapshots retained for 30 days                              │
│   • Cross-region replication (optional)                               │
│                                                                         │
│   REDIS:                                                               │
│   ──────                                                               │
│   • AOF persistence enabled                                            │
│   • RDB snapshots every hour                                           │
│   • Note: Queue data is ephemeral, loss acceptable                    │
│                                                                         │
│   CODE & CONFIG:                                                       │
│   ──────────────                                                       │
│   • All infrastructure as code (Terraform/Pulumi)                      │
│   • Git repository with full history                                   │
│   • Docker images in registry with tags                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Recovery Procedures

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      RECOVERY PROCEDURES                                │
│                                                                         │
│   SCENARIO 1: Single Service Failure                                   │
│   ──────────────────────────────────                                   │
│   1. Kubernetes automatically restarts pod                             │
│   2. Health check passes                                               │
│   3. Load balancer adds back to rotation                              │
│   Recovery time: < 2 minutes                                           │
│                                                                         │
│   SCENARIO 2: Database Corruption                                      │
│   ───────────────────────────────                                      │
│   1. Identify corruption extent                                        │
│   2. Use Atlas point-in-time recovery                                  │
│   3. Restore to last known good state                                  │
│   4. Verify data integrity                                             │
│   Recovery time: 15-30 minutes                                         │
│                                                                         │
│   SCENARIO 3: Complete Infrastructure Failure                          │
│   ───────────────────────────────────────────                          │
│   1. Provision new infrastructure (Terraform)                          │
│   2. Restore MongoDB from backup                                       │
│   3. Deploy services from Docker registry                              │
│   4. Update DNS to new infrastructure                                  │
│   5. Verify functionality                                              │
│   Recovery time: 1-2 hours                                             │
│                                                                         │
└─────────────────────────────────────────────────���───────────────────────┘
```

---

## 10. Cost Estimation

### Monthly Cost Breakdown

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COST ESTIMATION (20,000 MAU)                         │
│                                                                         │
│   COMPONENT                    DEV/DEMO        PRODUCTION               │
│   ─────────────────────────────────────────────────────────────────    │
│   Cloudflare                   $0 (Free)       $0-20 (Pro optional)    │
│   Compute (Web + API)          $0-20           $40-80                  │
│   Compute (Runners)            $5-15           $30-60                  │
│   MongoDB Atlas                $0 (M0)         $57 (M10)               │
│   Redis (Upstash)              $0 (Free)       $10-20                  │
│   Monitoring (Grafana Cloud)   $0 (Free)       $0-50                   │
│   Sentry                       $0 (Free)       $0-26                   │
│   Domain + SSL                 $12/year        $12/year                │
│   ─────────────────────────────────────────────────────────────────    │
│   TOTAL                        $5-35/month     $137-313/month          │
│                                                                         │
│   NOTES:                                                               │
│   • Dev/Demo: Single instances, free tiers                             │
│   • Production: HA setup, paid tiers for reliability                   │
│   • Costs scale with traffic; estimates for 20,000 MAU                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Cost Optimization Tips

1. **Use spot/preemptible instances** for runners (60-80% savings)
2. **Scale to zero** during off-hours if traffic is predictable
3. **Cache aggressively** to reduce database load
4. **Use free tiers** where SLA requirements allow
5. **Right-size instances** based on actual usage metrics

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **CDN** | Content Delivery Network - globally distributed cache |
| **HA** | High Availability - system designed to minimize downtime |
| **HPA** | Horizontal Pod Autoscaler - Kubernetes auto-scaling |
| **JWT** | JSON Web Token - stateless authentication token |
| **LB** | Load Balancer - distributes traffic across servers |
| **MAU** | Monthly Active Users |
| **p95** | 95th percentile - 95% of requests are faster than this |
| **Pod** | Kubernetes unit of deployment (one or more containers) |
| **SSR** | Server-Side Rendering - HTML generated on server |
| **TTL** | Time To Live - expiration time for cached data |
| **WAF** | Web Application Firewall - filters malicious requests |

---

## Appendix B: Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-01 | Queue-based execution only | Consistency, scalability |
| 2025-01 | MongoDB Atlas over self-hosted | Reduced ops burden |
| 2025-01 | Container pooling | 10-50x faster execution |
| 2025-01 | Microservices architecture | Independent scaling |
| 2025-01 | Kubernetes deployment | Industry standard, HA |

---

## Appendix C: References

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Document Owner:** Engineering Team
**Review Cycle:** Quarterly
**Next Review:** April 2025
