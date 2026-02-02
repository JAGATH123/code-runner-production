# Pre-Live Readiness Report — Code Runner Platform

**Repository:** `code-runner-production-main`  
**Purpose:** Checklist and risk assessment before production launch. Covers architecture, security, ops, data, performance, and user experience.

---

## 0) Executive Summary

- **Critical path**: Choose **one production execution architecture** (API+Runner recommended) and remove the other to eliminate “works locally” drift.
- **Highest risks**: Docker-in-Docker availability on runner, execution abuse (no quotas), and endpoint mismatches.
- **Cost control**: Execution is the dominant variable cost; quotas + backpressure are essential.
- **Observability gaps**: Add structured logs, alerts, and queue depth monitoring.

---

## 0.1) DevOps Team Rating (0–100)

| Perspective | Score | Rationale |
|---|---:|---|
| **Reliability** | 45 | Two execution paths create drift; no graceful API shutdown; runner image undefined. |
| **Cost Control** | 55 | Execution is dominant variable cost; no quotas yet; runner scaling is manual. |
| **Security** | 50 | Sandbox constraints are good; but debug routes leak info; no execution quotas. |
| **Scalability** | 60 | Queue-based design scales; but no backpressure; hardcoded runner concurrency; uncached DB aggregation. |
| **Overall** | **50** | **Needs fixes** in execution path, quotas, logging, and runner image before production. |

**Interpretation:**  
- 80–100: Production-ready with minor tweaks.  
- 60–79: Viable with targeted fixes.  
- 40–59: Risky; fix critical items before launch.  
- <40: Not recommended for production without major changes.

---

## 1) Architecture & Deployment Readiness

### 1.1 Execution path decision (required)
Your repo contains **two execution systems**:
- **Microservices**: Web → API (`/execution/*`) → Redis (BullMQ) → Runner → Mongo
- **Monolith inside Next**: Web UI → Next API (`/api/run`, `/api/submit`) → Docker pool

**Risk:** Different behavior, Docker requirements, and endpoint contracts.

**Action:** Choose **one** for production. Recommended: **API+Runner** (queue-based).

### 1.2 Endpoint contract alignment
Current mismatch in `apps/web/src/lib/api-client.ts`:
- Client calls `/submit`, `/results/:jobId`, `/submit/grade`
- Express routes are under `/execution/*`

**Risk:** 404s if UI switches to queue path.

**Action:** Update client to use `/execution/submit`, `/execution/result/:jobId`, `/execution/submit/grade`.

### 1.3 Runner Docker image determinism
Runner tries to build `python-code-runner` from a `Dockerfile` that does not exist in repo.

**Risk:** Runtime failures, environment drift.

**Action:** Choose one:
- **Preferred**: Build sandbox image in CI; runner pulls versioned image.
- **Acceptable**: Add a `Dockerfile` at repo root and ensure runner build path is correct.

### 1.4 Zero-downtime deployment
- **Web + API**: Rolling deploy with health checks (`/health`, `/health/redis`).
- **Runner**: Deploy with overlap (new runner up before old stops). BullMQ retries jobs.

### 1.5 Health checks
- API: `/health` and `/health/redis` already exist.
- Runner: Add a “ready” log/metric after Redis+Mongo connection.

---

## 2) Environment & Secrets

### 2.1 Required env vars (must be set in production)
- `MONGODB_URI` (URL-encoded special chars)
- `JWT_SECRET` (strong, not default)
- `REDIS_URL` or `REDIS_HOST`/`REDIS_PORT`
- `CORS_ORIGIN` (your deployed web URL)
- `NODE_ENV=production`

### 2.2 Fail-fast validation
Add startup validation in API and Runner:
- Crash if `JWT_SECRET` is default-like.
- Crash if Redis/Mongo unreachable.

### 2.3 Rate limits
- `executionLimiter`: 5 executions/minute per user/IP.
- `authLimiter`: 10 auth attempts/15 minutes.
- `apiLimiter`: 30 requests/minute.

---

## 3) Security & Abuse Protection

### 3.1 Execution sandbox constraints (already good)
- `--network none`
- `--memory 128m`
- `--cpus=0.5`
- `--read-only`
- `--tmpfs /tmp`
- Timeout enforced (5s)

### 3.2 Quotas & backpressure (missing)
- Daily run limit per user
- Per-minute run limit
- Reject when queue depth > threshold

**Risk:** Unlimited execution can cause cost spikes and abuse.

### 3.3 CORS
Set `CORS_ORIGIN` to your deployed web URL only.

### 3.4 JWT
- Expiration: 7 days (reasonable)
- Ensure fallback default is not used in production.

### 3.5 File handling (if pygame/files supported)
- Validate file types/sizes
- Isolate per-user storage
- Clean up old files

---

## 4) Data Integrity & Business Logic

### 4.1 Progress tracking
Currently progress is mostly localStorage.

**Risk:** Multi-device usage loses progress; no admin reporting.

**Action:** Add `UserProgress` model and server-side completion tracking.

### 4.2 Submission history (optional)
Store `Submission` model with:
- userId, problemId, codeHash, results, timestamp

### 4.3 Test case visibility
- Public test cases visible to users.
- Hidden test cases only used by runner.

### 4.4 Content aggregation (`/levels/:age_group`)
Currently aggregates `Problem` docs per request.

**Risk:** Heavy DB queries under load.

**Action:** Cache levels at CDN or precompute.

---

## 5) Observability & Alerting

### 5.1 Logging
- Use structured JSON logs.
- Remove `console.log` in favor of logger.

### 5.2 Error tracking
- Configure Sentry for web + API.

### 5.3 Alerts (recommended)
- API health failing
- Redis connectivity lost
- Queue waiting > threshold
- Runner failures / container errors
- Job failure spikes

### 5.4 Metrics
- Queue depth (`/execution/queue/stats`)
- Job latency
- Runner CPU utilization
- API error rate

---

## 6) Performance & Scalability

### 6.1 CDN caching
Cache at Cloudflare:
- `/levels/:age_group`
- `/problems/:id`
- Static assets

### 6.2 Database indexes
Ensure indexes on:
- `Problem.problem_id`, `Problem.age_group`, `Problem.level_number`, `Problem.session_id`
- `TestCase.problem_id`
- `ExecutionResult.jobId`, `ExecutionResult.userId`

### 6.3 Runner concurrency
Make concurrency configurable via env (currently hardcoded).

### 6.4 Backpressure testing
Simulate high queue depth and ensure graceful rejection.

---

## 7) Disaster Recovery & Backups

### 7.1 MongoDB
- Enable automated backups (Atlas or manual).

### 7.2 Redis
- Enable persistence (AOF/RDB) if self-hosted.

### 7.3 Rollback plan
- How to revert a bad deploy
- How to clear a stuck queue
- How to reset runner state

---

## 8) Legal & Compliance

### 8.1 Terms / Privacy
- Live and linked.

### 8.2 Data retention
- `ExecutionResult` TTL 7 days (already set).

### 8.3 Age gating
- Enforce if required (your `User.age_group` implies minors).

---

## 9) User Experience Polish

### 9.1 Loading/error states
- Execution polling
- Queue full / rate limit
- Runner downtime

### 9.2 Offline/timeout
- Graceful behavior.

### 9.3 Feedback loop
- Submission results
- Progress updates

---

## 10) Post-Launch Ops Readiness

### 10.1 Runbook
Document responses to:
- Runner crashes
- Redis down
- Queue stuck
- High error rates

### 10.2 On-call
- Rotation and escalation contacts.

### 10.3 Dashboard
- Queue depth
- Job latency
- Error rates
- Runner CPU

---

## 11) Debug/Development Endpoints (secure or remove before live)

You have debug routes under `apps/web/src/app/api/debug/*`. Example:

```ts
// apps/web/src/app/api/debug/db-info/route.ts
// Exposes MONGODB_URI prefix and problem details
```

**Risk:** Leaks internal state and DB connection strings.

**Actions:**
- Remove debug routes in production build, or
- Protect them with admin auth, or
- Ensure they’re behind a feature flag.

---

## 12) Smoke Test Before Going Live

1. Deploy to staging with production-like env.
2. Run jobs (run + submit) and verify:
   - Job appears in queue
   - Runner processes
   - Result appears in UI
3. Trigger failures:
   - Malformed code
   - Exceed rate limit
   - Stop Redis (confirm alerts)
4. Check logs for structured output and error capture.
5. Validate quotas by hitting the limit.

---

## 13) Cost Control Checklist

- [ ] Execution quotas enforced
- [ ] Backpressure when queue deep
- [ ] CDN caching enabled
- [ ] Runner sizing matches queue latency
- [ ] Alerts on cost drivers (queue depth, runner CPU)

---

## 14) Final “Go/No-Go” Checklist

| Area | Status |
|---|---|
| Execution architecture chosen | |
| Endpoints aligned | |
| Runner image deterministic | |
| Env validation added | |
| Quotas/backpressure live | |
| Structured logs + Sentry | |
| Alerts configured | |
| DB indexes verified | |
| CDN caching enabled | |
| Debug routes secured/removed | |
| Smoke test passed | |

---

## 15) Skeptical Review: Critical Setbacks You Could Still Hit

Even with the checklists, here are the **high-impact, low-visibility risks** that could still bite you in production.

### 15.1 Execution path ambiguity is still a time bomb
You haven’t explicitly disabled Next-local execution (`/api/run`, `/api/submit`) in production. If any code path still calls those endpoints, you’ll have:
- **Different sandbox behavior** (Next-local vs Runner)
- **Different Docker requirements** (web host vs runner host)
- **Different latency** (synchronous vs queue)
- **Different error handling**

**Setback:** Users see inconsistent results; “works locally” persists.

**Mitigation:** Remove or block Next execution routes in production builds, or add a feature flag that forces the queue path.

### 15.2 Runner Docker image build is still undefined
Your runner tries to build `python-code-runner` from a `Dockerfile` that doesn’t exist. If you don’t fix this:
- Runner crashes on first job
- You’ll scramble to add a Dockerfile and redeploy
- Queue backlog builds up

**Setback:** Immediate downtime for execution; support tickets spike.

**Mitigation:** Add a `Dockerfile` at repo root ASAP, or switch to pulling a prebuilt image from CI.

### 15.3 No quotas or backpressure yet
Execution is currently unlimited. One abusive user or a bug can:
- Spike your runner cost 10–100x
- Fill Redis queue and starve legitimate users
- Trigger provider rate limits or OOM

**Setback:** Surprise bill spikes; platform becomes unusable under load.

**Mitigation:** Implement per-user daily/minute limits and queue-depth rejection before you go live.

### 15.4 Progress is still client-side only
If a user switches devices or clears localStorage, they lose progress. You don’t have a server source of truth.

**Setback:** “My progress disappeared” support tickets; no admin reporting.

**Mitigation:** Add a `UserProgress` model and write completion events to the API.

### 15.5 Debug routes are exposed
`/api/debug/*` can leak DB connection strings and internal state.

**Setback:** Information disclosure; potential security incident.

**Mitigation:** Remove or auth-protect these routes in production.

### 15.6 No structured logging or alerts
You’re still using `console.log`. When something fails:
- You’ll have noisy, unsearchable logs
- You won’t know until users report issues
- Queue stalls silently

**Setback:** Long incident response times; hard to debug production issues.

**Mitigation:** Add a JSON logger and set up basic alerts (health, queue depth).

### 15.7 No graceful shutdown for API
Your API exits on unhandled errors but doesn’t stop accepting new connections gracefully.

**Setback:** Rolling deploys may drop in-flight requests; brief 503s.

**Mitigation:** Add SIGTERM handling to stop accepting new connections and close DB.

### 15.8 Content aggregation is uncached
`/levels/:age_group` aggregates `Problem` docs per request. Under traffic:
- DB load spikes
- Latency increases
- You may hit connection limits

**Setback:** Slow page loads; possible DB throttling.

**Mitigation:** Cache levels in Redis/CDN or precompute.

### 15.9 No backpressure on queue depth
If jobs pile up, you keep accepting more. This can:
- Stall the queue
- OOM Redis
- Create runaway latency

**Setback:** Execution becomes unreliable for everyone.

**Mitigation:** Reject new runs when queue waiting > threshold.

### 15.10 No deterministic runner scaling
Runner concurrency is hardcoded. If you need more capacity:
- You must redeploy to change concurrency
- You can’t react to spikes quickly

**Setback:** Manual scaling delays; poor performance under load.

**Mitigation:** Make concurrency configurable via env and consider autoscaling triggers.

---

## 16) Immediate “must-fix before live” list (skeptical priority)

1. **Choose one execution path** and disable the other.
2. **Add a Dockerfile** or switch to prebuilt image for runner.
3. **Implement quotas + backpressure** (even simple per-user limits).
4. **Secure or remove debug routes**.
5. **Add structured logging** and at least one alert (API health).

If you skip any of these, expect a **production incident within the first week**.

---

## 18) Real-World Failure Scenarios & Mitigations

Below are **real-world incidents** you will face if you go live with the current code, and how each recommended fix prevents them.

### 18.1 Execution Path Conflicts (Two Systems Running)

#### Real-world incident: “My code sometimes works, sometimes doesn’t”
- **What happens:** A teacher reports that students in the same class get different results: some submissions return instantly, others take forever. Some pass, others fail for the same code.
- **Why it happens:** The UI sometimes calls Next-local `/api/run` (synchronous) and sometimes calls the queue path `/execution/submit` (asynchronous). They have different timeouts and sandbox limits.
- **Error codes users see:** 200 (fast), 202 (queued), 504 (timeout), 500 (runner error).
- **Business impact:** Support tickets flood in; trust in the platform drops.

#### Mitigation: Choose one execution path
- **Fix:** Remove or disable Next-local `/api/run` and `/api/submit` in production. Update `api-client.ts` to always use `/execution/*`.
- **Result:** All submissions use the same sandbox and behavior; support tickets drop.

---

### 18.2 Runner Crashes on First Job (No Dockerfile)

#### Real-world incident: “Submit button does nothing”
- **What happens:** On launch day, a student submits code. The UI says “queued” but never shows a result. The queue depth keeps rising. The runner logs “image not found: python-code-runner”.
- **Why it happens:** The runner tries to build a Docker image that doesn’t exist in the repo.
- **User experience:** Infinite spinner; no feedback.
- **System impact:** Queue fills Redis memory; new submissions are rejected once backpressure is added.

#### Mitigation: Deterministic runner image
- **Fix:** Add a `Dockerfile` at repo root, or build a versioned image in CI and have the runner pull it.
- **Result:** Runner starts jobs immediately; queue stays healthy.

---

### 18.3 Unlimited Execution Abuse

#### Real-world incident: “System is always busy”
- **What happens:** A bot or a class of 200 students each run 30 times per minute. Your runner bill spikes 10x. Legitimate users see “system busy” and can’t submit.
- **Why it happens:** No per-user quotas; no backpressure when queue is deep.
- **Error codes:** 429 (rate limit), 503 (queue full).
- **Business impact:** Cost surprise; user frustration; platform appears unreliable.

#### Mitigation: Quotas + backpressure
- **Fix:** Add per-user daily and per-minute run limits. Reject new runs when queue waiting exceeds a threshold.
- **Result:** Costs stay predictable; legitimate users can always get in.

---

### 18.4 Debug Routes Leak Internal Data

#### Real-world incident: “Someone posted our DB connection string on Discord”
- **What happens:** A curious user discovers `/api/debug/db-info` and shares the output, which includes the MongoDB URI prefix and internal problem data.
- **Why it happens:** Debug routes are exposed in production.
- **Security impact:** Internal credentials exposed; compliance breach.

#### Mitigation: Secure or remove debug routes
- **Fix:** Remove `/api/debug/*` routes in production builds, or protect them with admin auth.
- **Result:** No internal data leaks; compliance maintained.

---

### 18.5 API Crashes (Unhandled Exception)

#### Real-world incident: “Random 500 errors during class”
- **What happens:** During a live session, the API starts returning 500 errors. Students can’t log in or fetch problems. The service restarts and recovers, then fails again.
- **Why it happens:** Missing env var (e.g., `JWT_SECRET`) or an unhandled promise crashes the process.
- **User experience:** 500 pages; loss of work.
- **System impact:** Downtime until restart; possible rolling deploy failures.

#### Mitigation: Fail-fast env validation + graceful shutdown
- **Fix:** Add startup validation for required env vars. Handle SIGTERM to stop accepting connections and close DB gracefully.
- **Result:** Crashes are prevented; rolling deploys are smooth.

---

### 18.6 Queue Overflows (Redis Memory Full)

#### Real-world incident: “All submissions stopped working”
- **What happens:** After a traffic spike (e.g., a coding competition), Redis hits its memory limit. New jobs are accepted but never processed. Queue depth climbs, and Redis OOMs.
- **Why it happens:** No backpressure; jobs pile up.
- **Error codes:** 503 (service unavailable) or timeouts.
- **System impact:** Execution stops for everyone; requires manual queue drain.

#### Mitigation: Backpressure on queue depth
- **Fix:** Reject new runs when queue waiting time exceeds a threshold (e.g., > 5 seconds).
- **Result:** Queue stays healthy; system degrades gracefully.

---

### 18.7 CORS Misconfiguration

#### Real-world incident: “App loads but nothing works”
- **What happens:** After deploying to production, the web app loads but all API calls fail in the browser console with CORS errors.
- **Why it happens:** `CORS_ORIGIN` is still set to `http://localhost:3000`.
- **User experience:** App appears broken; no data loads.
- **Impact:** Complete outage for web UI.

#### Mitigation: Set CORS_ORIGIN to deployed web URL
- **Fix:** Update `CORS_ORIGIN` env var to your production web domain.
- **Result:** API calls work; app functions normally.

---

### 18.8 Progress Lost on Device Switch

#### Real-world incident: “I finished a level on my laptop, but my phone shows no progress”
- **What happens:** A student completes problems on a laptop, then logs in on a phone and sees zero progress.
- **Why it happens:** Progress is stored only in localStorage.
- **User experience:** Frustration; perceived data loss.
- **Support impact:** Tickets about “missing progress.”

#### Mitigation: Server-side progress tracking
- **Fix:** Add a `UserProgress` model and write completion events to the API. UI reads progress from API.
- **Result:** Progress syncs across devices; support tickets drop.

---

### 18.9 Runner OOM / Timeout

#### Real-world incident: “My code fails with ‘Execution failed’ even though it’s simple”
- **What happens:** A student uploads a large image or writes a loop that allocates too much memory. The runner container OOMs or hits the 5s timeout.
- **Why it happens:** Code exceeds 128m memory or 5s timeout.
- **Error codes:** 500 (runner error), 504 (timeout).
- **User experience:** Confusing error messages; retries don’t help.

#### Mitigation: Clear error messages + reasonable limits
- **Fix:** Return clear “memory limit exceeded” or “timeout” messages. Keep limits reasonable for educational use.
- **Result:** Users understand limits; fewer retries.

---

### 18.10 Database Connection Exhaustion

#### Real-world incident: “Site slows to a crawl during peak hours”
- **What happens:** During a class, the API becomes slow and starts returning 502/504. Database connection pool is exhausted.
- **Why it happens:** Leaking connections or too many concurrent queries (e.g., uncached `/levels/:age_group` aggregation).
- **User experience:** Slow page loads; timeouts.
- **System impact:** API becomes unresponsive; requires restart.

#### Mitigation: Connection pooling + content caching
- **Fix:** Ensure DB connections are closed. Cache `/levels/:age_group` at CDN or Redis.
- **Result:** API stays responsive under load.

---

## 19) Error Code Cheat Sheet (What Users Will See)

| Code | Real-world cause | What the user sees | How to explain it |
|---|---|---|---|
| **200** | Success | Code runs/submits | Normal |
| **202** | Job queued | “Queued…” | Polling for result |
| **400** | Bad input | “Invalid code” | Fix syntax |
| **401** | Auth missing | “Login required” | Log in again |
| **403** | Rate limit | “Too many requests” | Wait |
| **404** | Job not found | “Result not found” | Retry |
| **413** | File too large | “File too big” | Reduce file size |
| **429** | Rate limit | “Too many attempts” | Wait |
| **500** | Server error | “Something went wrong” | Try again |
| **502** | API down | “Service unavailable” | Try later |
| **503** | Queue full | “System busy” | Try later |
| **504** | Timeout | “Execution timed out” | Optimize code |

---

## 20) System-Wide Failure Modes (Worst Days)

### “Execution outage”
- **What happens:** Runner crashes or Docker unavailable → queue fills → all submissions fail → 503s.
- **User impact:** No one can run or submit code.
- **Mitigation:** Runner HA (add second runner) + deterministic image.

### “Data outage”
- **What happens:** MongoDB down → auth/content fails → 500s → UI unusable.
- **User impact:** Can’t log in or view problems.
- **Mitigation:** Managed MongoDB with backups; connection retries.

### “Auth outage”
- **What happens:** JWT secret issue or Redis session store down → 401s → users can’t log in.
- **User impact:** Repeated login prompts.
- **Mitigation:** Strong secret validation; session fallback.

### “Cost spike”
- **What happens:** No quotas + abuse → runner fleet scales → surprise bill.
- **Business impact:** Budget overrun.
- **Mitigation:** Per-user quotas + backpressure.

---

## 23) Hidden Time Bombs (Potential Bugs, Cost Bombs, and Performance Bottlenecks)

Below are **latent issues** in the current codebase that can explode into production incidents, surprise bills, or performance bottlenecks.

### 23.1 Execution Cost Bomb (No Quotas)

#### Time bomb
- **File:** `apps/api/src/routes/execution.routes.ts`
- **Issue:** No per-user quotas; unlimited runs/submissions.
- **Trigger:** One abusive user or a class of 200 students each running 30 times/minute.
- **Impact:** Runner bill spikes 10–100x; queue fills; legitimate users starve.
- **Hidden cost:** Your monthly bill can jump from $100 to $5,000+ overnight.

#### Defuse
- Add per-user daily and per-minute limits.
- Reject new runs when queue wait > threshold.

---

### 23.2 Runner Image Build Failure (No Dockerfile)

#### Time bomb
- **File:** `apps/runner/src/executors/docker.executor.ts` (line ~245)
- **Issue:** Runner tries to build `python-code-runner` image that doesn’t exist.
- **Trigger:** First job after runner restart or new deploy.
- **Impact:** Runner crashes; queue fills; execution stops for everyone.
- **Hidden cost:** Support tickets and emergency redeploy.

#### Defuse
- Add a `Dockerfile` at repo root.
- Or build image in CI and have runner pull by tag.

---

### 23.3 Memory Leak in ExecutionResult TTL

#### Time bomb
- **File:** `packages/shared/src/database/models/ExecutionResult.model.ts` (line 66)
- **Issue:** TTL is 7 days, but no cleanup of indexes or large result blobs.
- **Trigger:** High volume of submissions with large outputs (e.g., plots, files).
- **Impact:** MongoDB storage grows indefinitely; index bloat slows queries.
- **Hidden cost:** Database storage and performance degradation.

#### Defuse
- Add explicit cleanup for large fields (plots, files) after TTL.
- Monitor DB size and set alerts.

---

### 23.4 Queue Backpressure Missing

#### Time bomb
- **File:** `apps/api/src/routes/execution.routes.ts` (no backpressure logic)
- **Issue:** Accept all jobs even when queue is deep.
- **Trigger:** Traffic spike or abuse.
- **Impact:** Redis memory fills; OOM; queue stalls; new jobs rejected.
- **Hidden cost:** Service outage; manual queue drain.

#### Defuse
- Check queue depth before accepting jobs.
- Reject with clear “system busy” message.

---

### 23.5 Hardcoded Runner Concurrency

#### Time bomb
- **File:** `apps/runner/src/workers/code-execution.worker.ts` (line 38) and `code-submission.worker.ts` (line 38)
- **Issue:** Concurrency is hardcoded (5 and 3).
- **Trigger:** Sudden traffic spike; queue backlog grows.
- **Impact:** Can’t scale without redeploy; poor performance under load.
- **Hidden cost:** Manual scaling delays; user frustration.

#### Defuse
- Make concurrency configurable via env vars.
- Consider autoscaling triggers.

---

### 23.6 No Graceful API Shutdown

#### Time bomb
- **File:** `apps/api/src/index.ts` (no SIGTERM handling)
- **Issue:** API crashes on unhandled errors; no graceful shutdown.
- **Trigger:** Rolling deploy or unhandled exception.
- **Impact:** In-flight requests dropped; 502/504 during deploy.
- **Hidden cost:** Downtime and user data loss.

#### Defuse
- Add SIGTERM handler to stop accepting connections and close DB.

---

### 23.7 JWT Secret Default

#### Time bomb
- **File:** `packages/shared/src/utils/jwt.utils.ts` (line 4)
- **Issue:** Falls back to default secret if env var missing.
- **Trigger:** Production deploy without `JWT_SECRET`.
- **Impact:** Tokens forgeable; accounts compromised.
- **Hidden cost:** Security breach; data exposure.

#### Defuse
- Add startup validation; crash if secret is default.

---

### 23.8 Uncached Content Aggregation

#### Time bomb
- **File:** `apps/api/src/routes/levels.routes.ts` (aggregates `Problem` docs per request)
- **Issue:** No caching for `/levels/:age_group`.
- **Trigger:** High traffic (e.g., class starts).
- **Impact:** DB load spikes; slow page loads; 504s.
- **Hidden cost:** Database throttling; provider limits.

#### Defuse
- Cache levels at CDN or Redis.
- Precompute and store derived data.

---

### 23.9 No Rate Limiting on Execution

#### Time bomb
- **File:** `apps/api/src/middleware/rateLimit.middleware.ts` (executionLimiter exists but may be too permissive)
- **Issue:** Rate limit may be too high or not enforced per-user.
- **Trigger:** Bot or abusive user.
- **Impact:** Cost spikes; queue fills; platform appears unreliable.
- **Hidden cost:** Surprise bill; support tickets.

#### Defuse
- Tighten per-user limits.
- Add daily caps.

---

### 23.10 Debug Routes Exposed

#### Time bomb
- **File:** `apps/web/src/app/api/debug/db-info/route.ts` (and others)
- **Issue:** Debug routes expose DB connection strings and internal state.
- **Trigger:** Curious user discovers endpoint.
- **Impact:** Internal data leaked; compliance breach.
- **Hidden cost:** Security incident; audit.

#### Defuse
- Remove debug routes in production.
- Or protect with admin auth.

---

### 23.11 No Structured Logging

#### Time bomb
- **File:** Throughout codebase (many `console.log` statements)
- **Issue:** No structured logs; hard to search or aggregate.
- **Trigger:** Production incident.
- **Impact:** Slow incident response; no visibility.
- **Hidden cost:** Longer outages; manual log digging.

#### Defuse
- Use a structured JSON logger.
- Add request/job IDs.

---

### 23.12 No Circuit Breakers for External Dependencies

#### Time bomb
- **File:** No explicit circuit breakers for Redis/Mongo.
- **Issue:** No fallback if Redis or MongoDB is down.
- **Trigger:** Database or Redis outage.
- **Impact:** Cascading failures; 500s everywhere.
- **Hidden cost:** Extended downtime.

#### Defuse
- Add circuit breakers.
- Return graceful degradation.

---

### 23.13 ExecutionResult Model Stores Large Blobs

#### Time bomb
- **File:** `packages/shared/src/database/models/ExecutionResult.model.ts` (result field is Schema.Types.Mixed)
- **Issue:** Can store large blobs (plots, files) without limits.
- **Trigger:** Users upload large images or generate many plots.
- **Impact:** Document size bloat; DB performance degrades.
- **Hidden cost:** Storage costs; query slowdowns.

#### Defuse
- Add size limits for result fields.
- Store large blobs externally if needed.

---

### 23.14 No Per-User Session Isolation in File Handling

#### Time bomb
- **File:** `apps/web/src/components/editor/CompilerUI.tsx` (uses `user_file_session_id` localStorage)
- **Issue:** File sessions are client-side only.
- **Trigger:** User shares session ID or clears localStorage.
- **Impact:** Cross-user file access or data loss.
- **Hidden cost:** Security risk; support tickets.

#### Defuse
- Store file session IDs server-side.
- Validate ownership per request.

---

### 23.15 No Validation on File Uploads

#### Time bomb
- **File:** `apps/web/src/components/editor/CompilerUI.tsx` (file upload handling)
- **Issue:** No strict validation of file type, size, or count.
- **Trigger:** User uploads huge files or malicious payloads.
- **Impact:** Runner OOM; crashes; queue stalls.
- **Hidden cost:** Runner downtime; queue backlog.

#### Defuse
- Add strict file validation.
- Reject oversized uploads early.

---

## 24) How to Defuse These Time Bombs (Priority Order)

### Immediate (before launch)
1. **Add quotas + backpressure** (prevents cost bomb)
2. **Add Dockerfile or prebuilt image** (prevents runner crash)
3. **Secure debug routes** (prevents data leak)
4. **Validate JWT_SECRET** (prevents security breach)
5. **Add structured logging** (improves incident response)

### Short term (first weeks)
6. **Add graceful shutdown** (smooth deploys)
7. **Cache content aggregation** (performance)
8. **Make runner concurrency configurable** (scaling)
9. **Add circuit breakers** (resilience)
10. **Add per-user session isolation** (security)

### Long term (ongoing)
11. **Server-side progress tracking** (multi-device)
12. **Versioned sandbox images** (reproducibility)
13. **Add alerts and dashboards** (observability)
14. **Implement request/job IDs** (traceability)
15. **Add rate limit per user** (abuse prevention)

---

## 26) Skeptical Architectural Review: Wrong Patterns & Mistakes

Below are the **architectural anti-patterns** you’ve introduced that a production code-execution platform should avoid. For each, I explain why it’s wrong, the risks, and how to fix it.

### 26.1 Two Execution Systems in One Codebase (Anti-Pattern)

#### What you did
- Kept both Next-local execution (`/api/run`, `/api/submit`) and queue-based execution (`/execution/*`).

#### Why it’s wrong for a code-execution platform
- **Inconsistent results**: Users get different behavior depending on which path is hit.
- **Ops complexity**: You must maintain two sandboxes, two Docker setups, two timeout policies.
- **Testing nightmare**: Can’t reliably test “production behavior” locally.
- **Scaling confusion**: Which path do you scale? Both?

#### Risks
- “Works locally” incidents in production.
- Support tickets for “same code, different result.”
- Security surface area doubled.

#### How to improve
- **Choose one execution path for production** (queue-based recommended for HA and cost control).
- **Remove or block** the other in production builds.
- Update `apps/web/src/lib/api-client.ts` to always use the chosen path.
- Add a feature flag if you need both for development.

---

### 26.2 Runner Builds Docker Image at Runtime (Anti-Pattern)

#### What you did
- Runner tries to `docker build` the `python-code-runner` image on startup.

#### Why it’s wrong
- **Non-deterministic**: Build can fail due to missing files, network, or Docker daemon issues.
- **Slow cold starts**: Every runner restart rebuilds the image.
- **Security risk**: Build context may include unintended files.
- **No version control**: Can’t pin or rollback a bad image.

#### Risks
- Runner crashes on first job after deploy.
- Queue fills; execution stops for everyone.
- Emergency redeploy required.

#### How to improve
- **Build the image in CI** and push to a registry.
- Runner pulls a versioned image by tag (e.g., `python-runner:v1.2.3`).
- No runtime builds.
- Add health check that verifies the image exists before accepting jobs.

---

### 26.3 No Quotas or Backpressure (Critical Anti-Pattern for Code Execution)

#### What you did
- Execution is unlimited; no per-user limits; queue can grow without bound.

#### Why it’s wrong
- **Cost explosion**: One abusive user can 10–100x your bill.
- **Service degradation**: Queue fills Redis; legitimate users starve.
- **No safety net**: No protection against traffic spikes or bugs.
- **Poor UX**: Users see “system busy” without explanation.

#### Risks
- Surprise bills.
- Platform appears unreliable.
- Queue OOM; Redis crashes.

#### How to improve
- **Per-user daily and per-minute run limits** (store in Redis with expiration).
- **Reject new runs when queue wait time > threshold** (e.g., 5 seconds).
- Return clear “system busy” message with retry time.
- Add admin overrides for trusted users.

---

### 26.4 Progress Stored Only in LocalStorage (Anti-Pattern for Multi-Device)

#### What you did
- Progress is client-side only; no server source of truth.

#### Why it’s wrong
- **Data loss**: Clearing localStorage or switching devices loses progress.
- **No admin visibility**: Can’t report on usage or completion rates.
- **No analytics**: Can’t build features like “most missed problems”.
- **Compliance risk**: Can’t audit progress for educational reporting.

#### Risks
- Support tickets for “missing progress.”
- No business insights.
- Can’t implement progress-based features.

#### How to improve
- Add a `UserProgress` model (userId, problemId, completedAt, attempts).
- Write completion events to the API.
- UI reads progress from API (localStorage can be cache).
- Add progress sync on login.

---

### 26.5 Hardcoded Runner Concurrency (Anti-Pattern for Scaling)

#### What you did
- Workers hardcode concurrency (5 for execution, 3 for submissions).

#### Why it’s wrong
- **Can’t react to load**: Must redeploy to change capacity.
- **Wasted resources**: Fixed concurrency may be over- or under-provisioned.
- **No autoscaling**: Can’t scale up during spikes.
- **Ops friction**: Every capacity change requires a deploy.

#### Risks
- Manual scaling delays.
- Poor performance under load.
- Overpaying for idle capacity.

#### How to improve
- Make concurrency configurable via environment variables (`WORKER_CONCURRENCY_EXECUTION`, `WORKER_CONCURRENCY_SUBMISSION`).
- Consider autoscaling triggers (queue depth, latency).
- Add metrics for queue wait time and worker utilization.

---

### 26.6 No Structured Logging (Anti-Pattern for Ops)

#### What you did
- Use `console.log` throughout the codebase.

#### Why it’s wrong
- **No searchability**: Hard to filter by service or error type.
- **No aggregation**: Can’t build dashboards or alerts.
- **No context**: No correlation IDs across services.
- **High noise**: Unstructured logs drown important signals.

#### Risks
- Slow incident response.
- Can’t measure health or performance.
- Manual log digging during outages.

#### How to improve
- Use a structured JSON logger (e.g., pino, winston).
- Add request/job IDs to logs.
- Ship logs to a centralized service (or at least structured files).
- Add log levels (error, warn, info, debug).

---

### 26.7 Exposed Debug Routes in Production (Anti-Pattern for Security)

#### What you did
- `/api/debug/*` routes expose DB connection strings and internal state.

#### Why it’s wrong
- **Information disclosure**: Internal configs leak.
- **Compliance risk**: Data breach.
- **Attack surface**: Unauthenticated introspection.
- **Operational risk**: Accidental exposure by users.

#### Risks
- Security incident.
- Audit failures.
- Internal data leaks.

#### How to improve
- Remove debug routes in production builds.
- Or protect them with admin auth.
- Add a feature flag (`ENABLE_DEBUG_ROUTES=false` in production).

---

### 26.8 No Graceful Shutdown for API (Anti-Pattern for Zero-Downtime)

#### What you did
- API exits on unhandled errors but doesn’t stop accepting connections gracefully.

#### Why it’s wrong
- **Dropped requests**: Rolling deploys return 502/504.
- **Data loss**: In-flight operations may be aborted.
- **Poor user experience**: Brief outages on every deploy.
- **Health check noise**: Load balancer marks instances unhealthy prematurely.

#### Risks
- Downtime on every deploy.
- User data loss.
- Poor reliability perception.

#### How to improve
- Handle SIGTERM: stop accepting new connections, close DB, then exit.
- Use a shutdown timeout (e.g., 30 seconds).
- Ensure health checks fail after shutdown starts.

---

### 26.9 Content Aggregation on Every Request (Anti-Pattern for Performance)

#### What you did
- `/levels/:age_group` aggregates `Problem` documents per request.

#### Why it’s wrong
- **DB load spikes**: Heavy queries under traffic.
- **High latency**: Users wait for aggregation.
- **No caching**: Same work repeated many times.
- **Scaling cost**: DB becomes bottleneck.

#### Risks
- Slow page loads.
- 504s under load.
- Database throttling.

#### How to improve
- Cache levels at CDN or Redis (short TTL, e.g., 5 minutes).
- Precompute and store derived data in a `Levels` collection.
- Invalidate cache on content updates.

---

### 26.10 No Validation of Critical Environment Variables (Anti-Pattern for Reliability)

#### What you did
- No startup validation; services may run with defaults.

#### Why it’s wrong
- **Silent failures**: Services start but fail at runtime.
- **Security risk**: Default JWT secret in production.
- **Debugging pain**: Hard to spot missing config.
- **Deploy fragility**: A missing env var causes runtime crashes.

#### Risks
- Runtime failures.
- Security breaches.
- Slow debugging.

#### How to improve
- Add startup validation for required env vars (`MONGODB_URI`, `JWT_SECRET`, `REDIS_URL`).
- Crash fast if critical config is missing.
- Log all loaded env vars at startup (without secrets).

---

### 26.11 No Alerting or Monitoring (Anti-Pattern for Ops)

#### What you did
- No alerts for queue depth, runner failures, or API health.

#### Why it’s wrong
- **Blind to failures**: You only know when users report issues.
- **Slow response**: Incidents last longer.
- **No visibility**: Can’t measure health or performance.
- **No SLA**: Can’t guarantee uptime.

#### Risks
- Extended outages.
- Poor user experience.
- No business metrics.

#### How to improve
- Set up basic alerts (API health, queue depth, runner errors).
- Use a metrics dashboard (even simple health checks).
- Add SLA metrics (uptime, error rate, latency).

---

### 26.12 Mixed Concerns in Next API Routes (Anti-Pattern for Clarity)

#### What you did
- Next app has both UI pages and execution API routes.

#### Why it’s wrong
- **Blurs boundaries**: Web tier becomes compute tier.
- **Scaling complexity**: You must scale Next for both UI and execution.
- **Security risk**: Execution code runs in the same process as UI.
- **Testing complexity**: Can’t test UI and execution independently.

#### Risks
- Scaling inefficiency.
- Security surface area increased.
- Hard to maintain.

#### How to improve
- Keep Next as pure UI.
- Move all execution logic to the API service.
- Use API calls from Next to the API service.

---

### 26.13 No Deterministic Sandbox Versioning (Anti-Pattern for Reproducibility)

#### What you did
- No versioned sandbox image; builds may drift.

#### Why it’s wrong
- **Non-reproducible bugs**: Different environments run different images.
- **Rollback risk**: Can’t quickly revert a bad sandbox.
- **Compliance**: Hard to audit which code ran.
- **Debugging**: Can’t pin issues to an image version.

#### Risks
- Hard to debug.
- Slow rollbacks.
- Compliance issues.

#### How to improve
- Version sandbox images (e.g., `python-runner:v1.2.3`).
- Pin image tags in runner config.
- Store image version in job metadata.

---

### 26.14 No Circuit Breakers for External Dependencies (Anti-Pattern for Resilience)

#### What you did
- No fallback if Redis or MongoDB is down.

#### Why it’s wrong
- **Cascading failures**: One service down takes down everything.
- **Poor UX**: Users see generic 500s.
- **Long outages**: Must wait for manual recovery.
- **No graceful degradation**: Can’t serve cached content when DB is down.

#### Risks
- Extended downtime.
- Poor user experience.
- No resilience.

#### How to improve
- Add circuit breakers for Redis/Mongo.
- Return graceful degradation when dependencies are down.
- Cache critical content locally.

---

### 26.15 ExecutionResult Model Stores Large Blobs (Anti-Pattern for Performance)

#### What you did
- `ExecutionResult.result` is `Schema.Types.Mixed` with no size limits.

#### Why it’s wrong
- **Document bloat**: Large outputs (plots, files) inflate storage.
- **Query slowdowns**: Large documents slow DB scans.
- **Cost spikes**: Storage costs grow with output size.
- **TTL inefficiency**: Large fields linger until TTL.

#### Risks
- Storage cost spikes.
- Query performance degradation.
- DB size bloat.

#### How to improve
- Add size limits for result fields.
- Store large blobs externally (e.g., S3) and keep references.
- Compress large text outputs.

---

## 27) How to Improve (Actionable Plan)

### Phase 1: Critical Fixes (Before Launch)
1. **Choose one execution path** and remove the other.
2. **Add a Dockerfile** or switch to prebuilt image.
3. **Add quotas + backpressure**.
4. **Secure debug routes**.
5. **Validate critical env vars**.

### Phase 2: Architectural Hygiene (First Weeks)
6. **Add structured logging**.
7. **Add graceful shutdown**.
8. **Cache content aggregation**.
9. **Make runner concurrency configurable**.
10. **Add circuit breakers**.

### Phase 3: Production Readiness (Ongoing)
11. **Server-side progress tracking**.
12. **Versioned sandbox images**.
13. **Add alerts and dashboards**.
14. **Separate UI and compute concerns**.
15. **Add request/job IDs for traceability**.

---

## 28) Next Steps

- **Priority 1**: Choose execution path and fix endpoint mismatches.
- **Priority 2**: Add quotas + backpressure.
- **Priority 3**: Add structured logs and alerts.
- **Priority 4**: Implement server-side progress tracking.

---

**Status:** Draft ready for review. Mark items as done and proceed to launch when all critical items are complete.
