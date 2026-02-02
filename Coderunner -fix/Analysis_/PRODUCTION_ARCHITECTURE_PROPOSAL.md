# Production-Grade Architecture Proposal (Battle-Tested, Low-Cost, High-Availability)

**Repository:** `code-runner-production-main`  
**Goal:** Replace the current fragile patterns with a battle-tested, cost-controlled, HA architecture that delivers the same user experience with predictable ops.

---

## 1) Executive Summary

- **Current issues**: Two execution paths, runtime Docker builds, no quotas, no backpressure, client-side progress, exposed debug routes, no graceful shutdown.
- **Proposed solution**: Single queue-based execution path, prebuilt sandbox images, per-user quotas, backpressure, server-side progress, structured logging, graceful shutdown, and cost controls.
- **Result**: Predictable costs, zero-downtime deploys, high availability, and ops simplicity.

---

## 2) High-Level Architecture Diagram

```
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│   Browser   │          │   CDN/CF    │          │  Load Bal.  │
│ (Next.js)   │◄────►    │  (Static)   │◄────►    │   (API GW)  │
└─────▲───────┘          └─────▲───────┘          └─────▲───────┘
      │ HTTPS                   │ HTTPS                │ HTTPS
      │                         │                      │
      ▼                         ▼                      ▼
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│   Web App   │          │   API Svc   │          │   Queue     │
│ (Next.js)   │◄────►    │ (Express)   │◄────►    │  (Redis)    │
└─────▲───────┘          └─────▲───────┘          └─────▲───────┘
      │ API/HTTPS               │ API/HTTPS              │ Redis
      │                         │                      │
      ▼                         ▼                      ▼
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│   Auth Svc  │          │  Runner Svc │          │   MongoDB   │
│ (JWT)       │          │ (BullMQ)    │◄────►    │ (Atlas)     │
└─────────────┘          └─────▲───────┘          └─────────────┘
                                │ Docker
                                ▼
                         ┌─────────────┐
                         │  Sandbox    │
                         │ (Prebuilt)  │
                         └─────────────┘
```

**Key changes vs current:**
- **Single execution path**: Web → API → Queue → Runner → MongoDB.
- **Prebuilt sandbox image**: No runtime builds.
- **Per-user quotas + backpressure**: Cost control.
- **Server-side progress**: Multi-device sync.
- **Structured logs + alerts**: Ops visibility.
- **Graceful shutdown**: Zero-downtime deploys.

---

## 3) Detailed End-to-End Flow (Button Click → DB Save → Execution Roundtrip)

### 3.1 User Clicks “Run” or “Submit”

1. **Web App (Next.js)**
   - UI calls `apiClient.execute(code, input)` (single client).
   - Client includes JWT in Authorization header.
   - Request goes to API service via Load Balancer.

2. **API Service (Express)**
   - Auth middleware validates JWT.
   - Rate limiting middleware checks per-user quotas (Redis counters).
   - Backpressure check: reject if queue wait > threshold.
   - Enqueue job to Redis (BullMQ) with job metadata.
   - Persist initial `ExecutionResult` (status: pending) to MongoDB.
   - Return `202 Accepted` with `jobId`.

3. **Queue (Redis)**
   - Job sits in `code-execution` or `code-submission` queue.
   - BullMQ handles retries and job TTL.

4. **Runner Service (BullMQ Workers)**
   - Worker pulls job from queue.
   - Pulls prebuilt sandbox image (e.g., `python-runner:v1.2.3`).
   - Executes code in isolated Docker container with constraints.
   - Writes stdout/stderr to result.
   - Updates `ExecutionResult` in MongoDB (status: completed/failed, result).
   - Emits job completion event.

5. **Web App Polling**
   - UI polls `/execution/result/:jobId` every 1–2 seconds.
   - API returns `ExecutionResult` from MongoDB.
   - UI updates when status is `completed` or `failed`.

6. **Progress Tracking**
   - On successful submission, API writes `UserProgress` record.
   - UI fetches progress from API on login and after completion.

---

## 4) Tech Stack (Low-Cost, Battle-Tested)

| Layer | Recommended Stack | Why |
|---|---|---|
| **Web** | Next.js (static export) on Vercel/Railway | Cheap, CDN-friendly, zero-downtime |
| **API** | Node.js Express on Railway/Render/Fly.io | Simple, cheap, managed |
| **Queue** | Redis (Upstash/Railway plugin) | Cheap, managed, BullMQ support |
| **Runner** | Node.js BullMQ on Hetzner/DigitalOcean VPS | Docker guaranteed, cheap |
| **DB** | MongoDB Atlas (M0–M10) | Managed, backups, TTL |
| **CDN** | Cloudflare | Free tier covers most traffic |
| **Logs** | Pino + Sentry (free tier) | Structured, alerts |
| **Alerts** | UptimeRobot + custom webhook | Free, simple |

**Cost estimate (base scenario, MAU 20k):** $80–$250/month.

---

## 5) How This Architecture Fixes Current Issues

| Current Issue | Fix in Proposed Architecture |
|---|---|
| Two execution paths | **Single path**: Remove Next-local routes; use only queue path |
| Runner builds Docker at runtime | **Prebuilt image**: CI builds image; runner pulls by tag |
| No quotas/backpressure | **Per-user limits**: Redis counters; reject on queue depth |
| Progress only in localStorage | **Server-side progress**: `UserProgress` model |
| No structured logging | **Pino + Sentry**: JSON logs, error tracking |
| No graceful shutdown | **SIGTERM handler**: Stop accepting, close DB, exit |
| Exposed debug routes | **Feature flag**: Disable in production |
| Hardcoded runner concurrency | **Env vars**: Configurable concurrency |
| No alerting | **Sentry + UptimeRobot**: Health and error alerts |
| Mixed concerns in Next | **Separate services**: Next = UI only; API = business logic |
| No circuit breakers | **Graceful degradation**: Return cached content on DB down |
| Large blobs in ExecutionResult | **Size limits + external storage**: S3 for large outputs |

---

## 6) Implementation Plan (A–Z)

### Phase 1: Critical Fixes (1–2 days)
1. **Choose queue-only execution path**
   - Remove `/api/run` and `/api/submit` routes.
   - Update `api-client.ts` to use `/execution/*`.
2. **Add prebuilt sandbox image**
   - Add `Dockerfile` at repo root.
   - Build and push to registry in CI.
   - Update runner to pull image by tag.
3. **Add quotas + backpressure**
   - Add Redis counters for per-user limits.
   - Reject jobs when queue wait > 5s.
4. **Secure debug routes**
   - Add `ENABLE_DEBUG_ROUTES=false` in production.
5. **Validate env vars**
   - Add startup validation for `MONGODB_URI`, `JWT_SECRET`, `REDIS_URL`.

### Phase 2: Architectural Hygiene (3–5 days)
6. **Add structured logging**
   - Replace `console.log` with `pino`.
   - Add request/job IDs.
7. **Add graceful shutdown**
   - Handle SIGTERM in API and runner.
8. **Cache content aggregation**
   - Cache `/levels/:age_group` in Redis (5m TTL).
9. **Make runner concurrency configurable**
   - Use env vars `WORKER_CONCURRENCY_EXECUTION`, `WORKER_CONCURRENCY_SUBMISSION`.
10. **Add circuit breakers**
    - Return cached content if MongoDB down.

### Phase 3: Production Readiness (1–2 weeks)
11. **Server-side progress tracking**
    - Add `UserProgress` model.
    - Write completion events.
12. **Add alerts**
    - Sentry for errors.
    - UptimeRobot for health checks.
13. **Separate UI and compute**
    - Move execution logic out of Next.
14. **Add request/job IDs**
    - Correlate logs across services.
15. **Add rate limiting per user**
    - Tighten execution limits.

---

## 7) Cost Control Strategy

### 7.1 Execution Quotas
- **Daily runs per user**: 50 (configurable).
- **Per-minute runs per user**: 5.
- **Queue backpressure**: Reject if wait > 5s.

### 7.2 Infrastructure Sizing
- **Web**: 2 replicas (static, cheap).
- **API**: 2 replicas (small instances).
- **Runner**: 1x 2vCPU/4GB VPS; add second when queue wait > 2s.
- **Redis**: Managed small tier.
- **MongoDB**: Atlas M10 (includes backups).

### 7.3 Monitoring Costs
- **Sentry**: Free tier (5k errors/month).
- **UptimeRobot**: Free tier (50 checks).
- **Logs**: Ship to provider or rotate locally.

---

## 8) High-Availability Design

### 8.1 Zero-Downtime Deploys
- **Web/API**: Rolling deploy with health checks.
- **Runner**: Deploy with overlap (new runner up before old stops).
- **Queue**: Redis managed (HA by provider).
- **DB**: Atlas (automatic failover).

### 8.2 Failure Modes & Recovery
- **Runner crash**: Queue buffers; new runner picks up jobs.
- **Redis restart**: In-flight jobs lost; clients retry.
- **DB down**: Serve cached content; graceful degradation.
- **API crash**: Load balancer routes to healthy replica.

### 8.3 Scaling Triggers
- **Add runner**: Queue wait > 2s for 5 minutes.
- **Scale API**: CPU > 80% for 5 minutes.
- **Scale web**: Traffic > 1000 RPS.

---

## 9) Security Hardening

### 9.1 Execution Sandbox
- **Network**: `--network none`.
- **Memory**: `--memory 128m`.
- **CPU**: `--cpus=0.5`.
- **Read-only**: `--read-only` (except `/tmp`).
- **Tmpfs**: `--tmpfs /tmp`.
- **Timeout**: 5s (run), 15s (submit).

### 9.2 Auth & Session
- **JWT**: 7-day expiration; rotate secret.
- **Rate limiting**: Per-user, per-IP.
- **CORS**: Locked to web domain.

### 9.3 Data Protection
- **TTL**: `ExecutionResult` 7 days.
- **Encryption**: TLS everywhere.
- **Env vars**: No defaults in production.

---

## 10) Observability & Alerting

### 10.1 Logs
- **Format**: JSON (pino).
- **Fields**: timestamp, level, service, requestId, jobId, userId, error.
- **Retention**: 30 days.

### 10.2 Metrics
- **Queue depth**: `queue.waiting`
- **Job latency**: `job.duration`
- **Error rate**: `errors.total`
- **Runner CPU**: `runner.cpu`

### 10.3 Alerts
- **API health**: `/health` fails.
- **Queue depth**: > 100 jobs.
- **Runner errors**: > 5% failure rate.
- **DB latency**: > 100ms.

---

## 11) Migration Steps

### 11.1 Prep
- Branch: `production-architecture`.
- CI: Build sandbox image and push to registry.

### 11.2 Deploy
1. Deploy new runner (pulls prebuilt image).
2. Deploy API with quotas and backpressure.
3. Deploy web with updated client (queue-only).
4. Enable structured logging and alerts.

### 11.3 Verify
- Smoke test: Run/submit flows.
- Load test: 100 concurrent users.
- Failover test: Stop runner; ensure queue buffers.

### 11.4 Cut Over
- Switch traffic to new stack.
- Monitor for 24 hours.
- Decommission old paths.

---

## 12) Rollback Plan

- **Runner**: Revert to old image (if needed).
- **API**: Revert to old version (no quotas).
- **Web**: Revert client (old endpoints).
- **Data**: No breaking changes; backward compatible.

---

## 13) Success Metrics

- **Cost**: < $250/month at MAU 20k.
- **Availability**: > 99.9% uptime.
- **Latency**: < 2s for runs, < 5s for submissions.
- **Error rate**: < 1% for execution.
- **Queue wait**: < 2s 95th percentile.

---

## 14) Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Runner Docker image not found | Health check on startup; fallback to older tag |
| Redis memory full | Backpressure; alerts |
| MongoDB throttling | Cache aggregation; read replicas |
| Cost spike | Quotas; alerts on queue depth |
| Deployment failure | Rolling deploy; health checks |

---

## 16) Low-Cost Deployment Guide (Demo-Ready, Predictable Costs)

Below is a **step-by-step deployment plan** for a demo environment with predictable monthly costs under $50. Includes pitfalls to avoid and cost/performance tradeoffs.

### 16.1 Target Monthly Budget: < $50

| Component | Recommended Service | Monthly Cost | Why |
|---|---|---|---|
| **Web** | Vercel (Hobby) | $0 | Static hosting, CDN included |
| **API** | Railway (Hobby) | $0–$20 | 2 replicas, 500h/month |
| **Queue** | Upstash Redis (Free) | $0 | 10k commands/day |
| **Runner** | Hetzner CX21 (2vCPU/4GB) | $5 | Docker guaranteed |
| **DB** | MongoDB Atlas M0 | $0 | 512MB, enough for demo |
| **Logs** | Sentry (Free) | $0 | 5k errors/month |
| **Total** | | **$5–$25** | Predictable, low cost |

### 16.2 Deployment Steps

#### Step 1: Web (Vercel)
- Push `apps/web` to Vercel.
- Set `NEXT_PUBLIC_API_URL` to Railway API URL.
- Enable CI/CD.

#### Step 2: API (Railway)
- Connect GitHub repo.
- Set root directory to `apps/api`.
- Add env vars: `MONGODB_URI`, `REDIS_URL`, `JWT_SECRET`, `CORS_ORIGIN`.
- Enable 2 replicas.

#### Step 3: Queue (Upstash)
- Create Redis database.
- Copy `REDIS_URL` to Railway env.
- No extra config needed.

#### Step 4: Runner (Hetzner)
- Create CX21 server.
- Install Docker, Node.js.
- Clone repo, install deps.
- Set env vars: `MONGODB_URI`, `REDIS_URL`.
- Run `npm start` as systemd service.

#### Step 5: DB (MongoDB Atlas)
- Create M0 cluster.
- Add IP whitelist (Hetzner + Railway IPs).
- Copy `MONGODB_URI` to all services.

#### Step 6: Monitoring
- Create Sentry project.
- Add DSN to API and runner env.
- Set up UptimeRobot for API health.

### 16.3 What NOT to Do (Cost/Performance Traps)

| Pitfall | Why It’s Bad | Cost Impact |
|---|---|---|
| **Use AWS ECS Fargate for runner** | $0.014/vCPU-hour = $20/month minimum | 4x cost vs Hetzner |
| **Use MongoDB Atlas M10** | $57/month for demo | Overkill |
| **Enable Redis Cluster** | $30+/month | Unnecessary |
| **Use Cloudflare Pro** | $20/month | Free tier sufficient |
| **Log everything to Sentry** | Exceeds free tier quickly | Bill spikes |
| **Run API on large instance** | $50+/month | Small instance enough |
| **Enable autoscaling** | Complex and costly | Manual scaling OK for demo |

### 16.4 Cost Control Checklist

- [ ] Use free tiers where possible (Vercel, Upstash, Atlas M0).
- [ ] Set resource limits (CPU, memory) on runner.
- [ ] Enable TTL on `ExecutionResult` (7 days).
- [ ] Monitor Sentry usage; stay under 5k errors.
- [ ] Use Hetzner for runner (cheapest Docker host).
- [ ] Avoid managed Redis clusters.
- [ ] Keep API replicas at 2 (not 3+).

### 16.5 Performance vs Cost Tradeoffs

| Decision | Performance Impact | Cost Impact |
|---|---|---|
| **Runner: Hetzner CX21** | Good for demo | $5/month |
| **Runner: Railway** | Slower cold starts | $20/month |
| **DB: Atlas M0** | 500 connections, slow reads | $0 |
| **DB: Self-hosted** | Faster but ops overhead | $5/month |
| **Queue: Upstash Free** | 10k commands/day | $0 |
| **Queue: Railway Redis** | Unlimited but $5/month | $5/month |

---

## 17) Provider Comparisons (Low-Cost Options)

| Provider | Best For | Pros | Cons | Estimated Monthly Cost (Demo) |
|---|---|---|---|---|
| **Vercel + Railway + Hetzner** | Fastest demo setup | Free tiers, cheap runner | Multiple providers | $5–$25 |
| **Render + Hetzner** | All-in-one UI | Simple, free tier | Slower cold starts | $7–$30 |
| **Fly.io + Hetzner** | Global edge | Anycast, cheap | Complex networking | $10–$35 |
| **DigitalOcean** | Single provider | Simple, cheap | No free tier for API | $15–$40 |

---

## 18) Next Steps

1. **Approve architecture** and assign owners.
2. **Create branch** and set up CI for sandbox image.
3. **Implement Phase 1 fixes** (critical).
4. **Test in staging**.
5. **Deploy to production**.
6. **Monitor and iterate**.

---

**Status:** Proposal ready for review. Once approved, follow the implementation plan to achieve a battle-tested, low-cost, high-availability platform.
