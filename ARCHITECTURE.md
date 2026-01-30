# Code Runner - System Architecture

This document describes the architecture, design decisions, and implementation status of the Code Runner platform.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Service Components](#service-components)
4. [Technology Stack](#technology-stack)
5. [Data Flow](#data-flow)
6. [Security & Sandboxing](#security--sandboxing)
7. [Implementation Status](#implementation-status)
8. [Future Enhancements](#future-enhancements)

---

## System Overview

Code Runner is a microservices-based online coding platform that allows users to write, execute, and submit Python code in a safe, sandboxed environment. The platform features:

- **User authentication** with JWT
- **Problem-based learning** organized by age groups and levels
- **Real-time code execution** in isolated Docker containers
- **Asynchronous job processing** with BullMQ and Redis
- **Progress tracking** and gamification
- **Interactive cheatsheets** for learning support

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Next.js Web Application (Port 3000)           │ │
│  │  • React UI with Server Components                         │ │
│  │  • Client-side state management                            │ │
│  │  • Polling for async execution results                     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ HTTP/REST
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                           │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           Express API Service (Port 4000)                  │ │
│  │                                                             │ │
│  │  Middleware Stack:                                         │ │
│  │  ├─ Helmet (Security headers)                              │ │
│  │  ├─ CORS (Cross-origin support)                            │ │
│  │  ├─ Morgan + Winston (HTTP logging)                        │ │
│  │  ├─ Rate Limiting (Redis-backed)                           │ │
│  │  ├─ JWT Authentication                                     │ │
│  │  └─ Request Validation                                     │ │
│  │                                                             │ │
│  │  Routes:                                                    │ │
│  │  ├─ /auth         - Authentication endpoints               │ │
│  │  ├─ /problems     - Problem CRUD operations                │ │
│  │  ├─ /levels       - Level management                       │ │
│  │  ├─ /sessions     - Session tracking                       │ │
│  │  ├─ /execution    - Async code execution (BullMQ)          │ │
│  │  ├─ /progress     - User progress tracking                 │ │
│  │  └─ /cheatsheets  - Learning resources                     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                    │                              │
                    │                              │
        ┌───────────▼──────────┐      ┌───────────▼──────────────┐
        │   MongoDB Atlas      │      │   Redis (Railway)        │
        │   (Database)         │      │   • Job Queues           │
        │                      │      │   • Rate Limiting Store  │
        │   Collections:       │      │   • Session Management   │
        │   • users            │      └──────────────────────────┘
        │   • problems         │                  │
        │   • levels           │                  │
        │   • sessions         │                  │ BullMQ Workers
        │   • executionResults │                  │
        │   • progress         │                  ▼
        │   • cheatsheets      │      ┌───────────────────────────┐
        └──────────────────────┘      │   Runner Service          │
                    ▲                 │   (Worker Processes)      │
                    │                 │                           │
                    └─────────────────┤   Workers:                │
                                      │   ├─ CodeExecutionWorker  │
                                      │   │   (5 concurrent)      │
                                      │   └─ CodeSubmissionWorker │
                                      │       (3 concurrent)      │
                                      │                           │
                                      │   Features:               │
                                      │   • Job rate limiting     │
                                      │   • Backpressure control  │
                                      │   • Graceful shutdown     │
                                      │   • Structured logging    │
                                      └───────────┬───────────────┘
                                                  │
                                                  │ Docker API
                                                  ▼
                                      ┌───────────────────────────┐
                                      │   Docker Engine           │
                                      │                           │
                                      │   Per-execution:          │
                                      │   ┌─────────────────────┐ │
                                      │   │ Python Container    │ │
                                      │   │ • Alpine-based      │ │
                                      │   │ • Network isolated  │ │
                                      │   │ • Memory: 128MB     │ │
                                      │   │ • CPU: 0.5 cores    │ │
                                      │   │ • Read-only FS      │ │
                                      │   │ • 5s timeout        │ │
                                      │   └─────────────────────┘ │
                                      └───────────────────────────┘
```

---

## Service Components

### 1. Web Application (Next.js)
**Location:** `apps/web/`
**Port:** 3000
**Purpose:** User interface and client-side logic

**Key Features:**
- Server-side rendering with Next.js App Router
- Character-based theme system (Astro, Leo, Kenji, Nila, Cosmic)
- Responsive design with Tailwind CSS
- Interactive code editor with syntax highlighting
- Real-time execution feedback with polling
- Progress visualization and gamification

**Main Routes:**
- `/` - Landing page
- `/login` - Authentication
- `/home` - User dashboard
- `/levels/[age_group]` - Level selection
- `/levels/[age_group]/[level_number]` - Problem interface

### 2. API Service (Express)
**Location:** `apps/api/`
**Port:** 4000
**Purpose:** REST API and business logic

**Key Features:**
- RESTful API design
- JWT-based authentication
- Redis-backed rate limiting (100 requests/min)
- Queue-based async code execution
- Backpressure control (max 100 pending jobs)
- Graceful shutdown with connection cleanup
- Structured logging with Winston

**Security Measures:**
- Helmet.js security headers
- CORS with origin whitelist
- Input validation and sanitization
- JWT secret strength validation
- Environment variable validation on startup

**Health Endpoints:**
- `GET /health` - Service health check
- `GET /health/redis` - Redis connection status

### 3. Runner Service (BullMQ Workers)
**Location:** `apps/runner/`
**Purpose:** Background job processing for code execution

**Workers:**

#### CodeExecutionWorker
- **Queue:** `code-execution`
- **Concurrency:** 5 jobs
- **Rate Limit:** 10 jobs/second
- **Purpose:** Test runs (no grading)

#### CodeSubmissionWorker
- **Queue:** `code-submission`
- **Concurrency:** 3 jobs
- **Rate Limit:** 5 jobs/second
- **Purpose:** Graded submissions with test cases

**Features:**
- Docker-based code execution
- Lazy Redis connection initialization
- Graceful shutdown (completes in-flight jobs)
- Structured logging with Winston
- Error tracking and retry logic
- Execution result persistence

### 4. Shared Package
**Location:** `packages/shared/`
**Purpose:** Common utilities and models

**Exports:**
- Database models (Mongoose schemas)
- JWT utilities with lazy validation
- Password hashing utilities
- Environment validation
- Structured logger factory
- TypeScript types and interfaces

---

## Technology Stack

### Frontend
- **Framework:** Next.js 15 with App Router
- **UI:** React 19, Tailwind CSS, shadcn/ui
- **State:** React hooks and context
- **Code Editor:** Monaco Editor / CodeMirror
- **Deployment:** Railway (standalone mode)

### Backend
- **Runtime:** Node.js with TypeScript
- **API Framework:** Express.js
- **Queue System:** BullMQ
- **Database:** MongoDB Atlas (Mongoose ORM)
- **Cache/Queue Store:** Redis (Railway managed)
- **Authentication:** JWT with bcrypt
- **Logging:** Winston with daily log rotation
- **Container Engine:** Docker

### DevOps
- **Containerization:** Docker (Alpine Python 3.9)
- **Deployment:** Railway
- **Process Manager:** Built-in (tsx for dev, node for prod)
- **Monitoring:** Winston structured logs
- **Version Control:** Git

---

## Data Flow

### 1. Test Run Flow (Simple Execution)

```
User clicks "Run" → Web App
                      │
                      ▼
                  POST /execution/run
                      │
                      ▼
              API creates job record
              (status: 'pending')
                      │
                      ▼
              Checks queue depth
              (backpressure < 100)
                      │
                      ▼
              Adds job to BullMQ
              ('code-execution' queue)
                      │
                      ▼
              Returns jobId to client
                      │
                      ▼
              Client polls: GET /execution/:jobId
                      │
                      ├─ Status: pending → Keep polling
                      ├─ Status: processing → Keep polling
                      └─ Status: completed → Show results
                                  │
                                  ▼
                      Runner Worker picks job
                      (CodeExecutionWorker)
                                  │
                                  ▼
                      Creates Docker container
                      (isolated, resource-limited)
                                  │
                                  ▼
                      Executes Python code
                      (5s timeout)
                                  │
                                  ▼
                      Captures stdout/stderr
                                  │
                                  ▼
                      Destroys container
                                  │
                                  ▼
                      Updates job in database
                      (status: 'completed')
                                  │
                                  ▼
                      Client receives result
```

### 2. Submission Flow (Graded with Test Cases)

```
User clicks "Submit" → Web App
                         │
                         ▼
                   POST /execution/submit
                         │
                         ▼
                 API fetches problem + test cases
                         │
                         ▼
                 Creates job record
                 (status: 'pending')
                         │
                         ▼
                 Checks queue depth
                 (backpressure < 100)
                         │
                         ▼
                 Adds job to BullMQ
                 ('code-submission' queue)
                         │
                         ▼
                 Returns jobId to client
                         │
                         ▼
                 Client polls: GET /execution/:jobId
                         │
                         ▼
             Runner Worker picks job
             (CodeSubmissionWorker)
                         │
                         ▼
         FOR EACH test case:
             ├─ Create Docker container
             ├─ Execute code with test input
             ├─ Capture output
             ├─ Compare with expected output
             ├─ Mark as passed/failed
             └─ Destroy container
                         │
                         ▼
             Calculate pass rate
             (passed / total)
                         │
                         ▼
             Update job in database
             (submissionResult with all test results)
                         │
                         ▼
             Client receives grading results
             (shows passed/failed test cases)
```

---

## Security & Sandboxing

### Docker Sandbox

Every code execution runs in an isolated Docker container with strict resource limits:

**Container Specifications:**
```bash
docker run -d \
  --name exec-<unique-id> \
  --network none              # No network access
  --memory 128m               # 128MB RAM limit
  --cpus="0.5"                # 50% of 1 CPU core
  --read-only                 # Read-only filesystem
  --tmpfs /tmp:size=50m       # 50MB writable /tmp
  --user 1000:1000            # Non-root user
  python-code-runner
```

**Security Measures:**
- Network isolation prevents external connections
- Memory and CPU limits prevent resource exhaustion
- Read-only filesystem prevents persistence
- Non-root user prevents privilege escalation
- 5-second execution timeout prevents infinite loops
- Automatic container cleanup after execution

**Image Details:**
- Base: `python:3.9-alpine`
- Size: ~50MB (minimal footprint)
- Python packages: Standard library only
- No persistent storage

### Application Security

**Authentication:**
- JWT tokens with 7-day expiration
- bcrypt password hashing (10 rounds)
- JWT secret validation (min 32 chars, no weak patterns)
- Environment variable validation on startup

**API Protection:**
- Helmet.js security headers
- CORS with origin whitelist
- Redis-backed rate limiting (100 req/min per IP)
- Request body size limits (10MB)
- Input validation and sanitization

**Secrets Management:**
- Environment variables for sensitive data
- `.env.local` files (gitignored)
- MongoDB connection string validation
- Redis URL password protection

---

## Implementation Status

### ✅ Phase 1: Critical Fixes (COMPLETED)

| Feature | Status | Description |
|---------|--------|-------------|
| **JWT Validation** | ✅ Complete | Lazy validation pattern to prevent startup crashes |
| **Environment Validation** | ✅ Complete | Validates all required env vars on service start |
| **Debug Route Protection** | ✅ Complete | Debug endpoints removed from production |
| **Single Execution Path** | ✅ Complete | Unified async execution via `/execution/run` and `/execution/submit` |
| **Rate Limiting** | ✅ Complete | Redis-backed rate limiting with lazy store creation |
| **Backpressure Control** | ✅ Complete | Queue depth checking to prevent overload |
| **Docker Sandboxing** | ✅ Complete | Isolated containers with resource limits |

**Key Achievements:**
- Fixed module load order issues with lazy initialization
- Implemented proper error handling and validation
- Eliminated race conditions in Redis connection
- Ensured all critical security measures are in place

### ✅ Phase 2: Production Readiness (PARTIAL)

| Feature | Status | Description |
|---------|--------|-------------|
| **Graceful Shutdown** | ✅ Complete | SIGTERM/SIGINT handlers for API and Runner |
| **Structured Logging** | ✅ Complete | Winston logger with JSON output and log rotation |
| **Container Pooling** | ⏭️ Deferred | Attempted but reverted due to stability issues |
| **API Gateway** | ⏭️ Not Started | Optional - not critical for MVP |

**Graceful Shutdown Implementation:**
- Both API and Runner services handle SIGTERM/SIGINT
- Closes HTTP server (waits for active requests)
- Closes Redis connections cleanly
- Closes MongoDB connections cleanly
- Workers complete in-flight jobs before shutdown
- Prevents data loss during deployments

**Structured Logging Implementation:**
- Winston logger with customizable log levels
- Service-specific loggers (api, runner, docker-executor, workers)
- JSON format for production (machine-readable)
- Colored console output for development
- Daily log rotation (production only)
- Structured metadata with all log entries
- HTTP request logging via Morgan + Winston stream

### 📋 Phase 3: Advanced Features (NOT STARTED)

| Feature | Status | Description |
|---------|--------|-------------|
| **Metrics & Monitoring** | ⏭️ Planned | Prometheus metrics, execution time tracking |
| **Container Pooling** | ⏭️ Revisit | Pre-warmed containers for faster execution |
| **Multi-language Support** | ⏭️ Planned | JavaScript, Java support |
| **WebSocket Live Updates** | ⏭️ Planned | Real-time execution feedback |
| **Advanced Caching** | ⏭️ Planned | Problem caching, execution memoization |
| **API Gateway** | ⏭️ Planned | Nginx reverse proxy with load balancing |

---

## Future Enhancements

### Short-term (1-3 months)
1. **Container Pooling** - Revisit with proper health checks on Windows/Docker Desktop
2. **Metrics Dashboard** - Execution time, success rates, queue depth visualization
3. **Error Tracking** - Integration with Sentry or similar service
4. **Load Testing** - Validate system under concurrent user load

### Mid-term (3-6 months)
1. **Multi-language Support** - JavaScript, Java execution
2. **WebSocket Updates** - Real-time execution progress
3. **Advanced Problem Types** - File I/O, multi-file projects
4. **Leaderboard** - Global and age-group rankings

### Long-term (6+ months)
1. **Collaborative Coding** - Pair programming mode
2. **AI Hints** - Context-aware help system
3. **Custom Contests** - Teacher-created challenges
4. **Mobile App** - React Native iOS/Android apps

---

## Configuration Reference

### Environment Variables

#### API Service (`apps/api/.env.local`)
```bash
# Server
PORT=4000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/code-runner

# Redis
REDIS_URL=redis://default:password@host:port

# Authentication
JWT_SECRET=<strong-secret-min-32-chars>

# CORS
CORS_ORIGIN=http://localhost:3000,http://192.168.1.106:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000    # 1 minute
RATE_LIMIT_MAX_REQUESTS=100   # 100 requests per window

# Backpressure
MAX_PENDING_JOBS=100          # Max queued jobs before rejection

# Logging (optional)
LOG_LEVEL=info                # error | warn | info | http | debug
LOG_DIR=logs                  # Log file directory
```

#### Runner Service (`apps/runner/.env.local`)
```bash
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/code-runner

# Redis
REDIS_URL=redis://default:password@host:port

# Docker (optional)
SKIP_DOCKER_INIT=false        # Skip Docker check for Railway

# Logging (optional)
LOG_LEVEL=info
LOG_DIR=logs
```

#### Web Service (`apps/web/.env.local`)
```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:4000

# Optional: Analytics, etc.
```

---

## Monitoring & Debugging

### Health Checks

**API Health:**
```bash
curl http://localhost:4000/health
```
Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-29T15:27:04.123Z",
  "service": "code-runner-api"
}
```

**Redis Health:**
```bash
curl http://localhost:4000/health/redis
```

### Logs

**Development (Console):**
- Colored output with timestamps
- Service name tags
- Structured JSON metadata
- Real-time in terminal

**Production (Files):**
- `logs/api-combined-2026-01-29.log` - All API logs
- `logs/api-error-2026-01-29.log` - Error logs only
- `logs/runner-combined-2026-01-29.log` - All Runner logs
- `logs/runner-error-2026-01-29.log` - Error logs only

**Log Rotation:**
- Daily rotation at midnight
- 14 days retention
- Gzip compression for old logs
- Max 20MB per file

### Common Issues

**Issue: Port 4000 already in use**
- Solution: Stop existing API process or change PORT in .env.local

**Issue: Redis connection failed**
- Solution: Verify REDIS_URL is correct, check Railway Redis status

**Issue: MongoDB connection timeout**
- Solution: Check MONGODB_URI, verify Atlas IP whitelist (0.0.0.0/0 for Railway)

**Issue: Docker execution fails**
- Solution: Ensure Docker Desktop is running, check `docker ps` works

**Issue: Jobs stuck in pending**
- Solution: Verify Runner service is running, check Redis connection

---

## Performance Characteristics

### Execution Times

**Test Run (Simple):**
- Queue wait: < 100ms (low load)
- Container creation: ~500ms
- Code execution: < 5s (timeout)
- Container cleanup: ~200ms
- **Total:** < 1s for simple code

**Submission (with test cases):**
- Per test case: ~700ms (container + execution)
- 5 test cases: ~3.5s total
- 10 test cases: ~7s total

### Scalability

**Current Limits:**
- API: 100 requests/minute per IP
- Execution Queue: 100 pending jobs max
- Code Execution: 5 concurrent
- Code Submission: 3 concurrent

**Theoretical Capacity:**
- ~8-12 executions per second (with current workers)
- ~480-720 executions per minute
- Limited by Docker container lifecycle overhead

**Scaling Options:**
1. Horizontal: Add more Runner instances
2. Worker Concurrency: Increase worker concurrency
3. Container Pooling: Pre-warmed containers (future)
4. Resource Optimization: Lighter Docker images

---

## Maintenance

### Regular Tasks

**Weekly:**
- Check log files for errors
- Monitor queue depth and latency
- Review execution success rates

**Monthly:**
- Update dependencies (`npm update`)
- Review and rotate logs
- Database index optimization
- Security audit

**Quarterly:**
- Major dependency updates
- Performance benchmarking
- Capacity planning
- Security penetration testing

### Backup Strategy

**Database:**
- MongoDB Atlas automated backups (daily)
- Point-in-time recovery available
- 7-day retention

**Code:**
- Git repository (GitHub)
- Production branch protection
- Tag releases

---

## Contributing

### Development Workflow

1. Clone repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` in each service
4. Start MongoDB and Redis locally (or use cloud)
5. Build shared package: `cd packages/shared && npm run build`
6. Start services in dev mode:
   ```bash
   # Terminal 1: API
   cd apps/api && npm run dev

   # Terminal 2: Runner
   cd apps/runner && npm run dev

   # Terminal 3: Web
   cd apps/web && npm run dev
   ```

### Code Standards

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for formatting
- Conventional commits for git messages

---

## License

Proprietary - League of Founders

---

**Document Version:** 1.0
**Last Updated:** 2026-01-29
**Maintained By:** Development Team
