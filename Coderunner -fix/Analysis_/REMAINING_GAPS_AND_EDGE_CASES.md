# Remaining Gaps and Edge Cases (Production Readiness)

**Repository:** `code-runner-production-main`  
**Purpose:** Consolidate all remaining gaps, edge cases, and missed items that must be addressed for full production readiness.

---

## 1) File Handling (Pygame/Uploads)

### Current Issue
- File sessions are stored only in `localStorage` (`user_file_session_id`).
- No server-side validation of ownership.

### Risks
- Cross-user file access if session ID is shared.
- Data loss if localStorage is cleared.
- Security risk: malicious file uploads.

### Fix
- Store file session IDs server-side with `userId`.
- Validate ownership on every file request.
- Add file type, size, and count validation.
- Store files in a dedicated bucket (S3/Upstash) with expiration.

### Files to Update
- `apps/web/src/components/editor/CompilerUI.tsx`
- `apps/web/src/app/api/files/route.ts`
- New: `packages/shared/src/models/FileSession.model.ts`

---

## 2) Pygame/Headless Execution

### Current Issue
- Runner may hang on pygame event loops (no display).
- No virtual display for graphical code.

### Risks
- Infinite execution; runner OOM.
- Jobs stuck in queue; queue fills.

### Fix
- Install `xvfb` (virtual display) on runner host.
- Add `DISPLAY=:99` environment variable.
- Use stricter timeouts for graphical code (e.g., 10s).
- Return clear “graphical code not supported” if needed.

### Files to Update
- `apps/runner/src/executors/docker.executor.ts`
- Runner host setup scripts.

---

## 3) Test Case Visibility

### Current Issue
- No clear separation of public vs hidden test cases.
- API may expose hidden tests.

### Risks
- Students can see hidden test cases via API.
- Academic integrity issues.

### Fix
- Add `isVisible` field to `TestCase` model.
- Ensure only runner can fetch all test cases (`/test-cases/all`).
- UI fetches only visible test cases (`/test-cases`).

### Files to Update
- `packages/shared/src/database/models/TestCase.model.ts`
- `apps/api/src/routes/problems.routes.ts`

---

## 4) Job Retry Policy

### Current Issue
- BullMQ retries failed jobs by default.
- User-triggered jobs may be retried unexpectedly.

### Risks
- Users see duplicate results.
- Costs increase due to repeated executions.
- Confusing UX.

### Fix
- Disable retries for user-triggered jobs (`attempts: 1`).
- Retry only on infrastructure errors (e.g., Redis down).
- Add job deduplication to prevent duplicate submissions.

### Files to Update
- `apps/api/src/queue/queue.config.ts`
- `apps/runner/src/workers/*.ts`

---

## 5) Result Size Limits

### Current Issue
- `ExecutionResult.result` is `Schema.Types.Mixed` with no size limits.
- Can store large outputs (plots, files).

### Risks
- Document bloat; storage costs.
- Query slowdowns.
- TTL inefficiency.

### Fix
- Add size limits for result fields (e.g., 64KB).
- Store large blobs externally (S3/Upstash) and keep references.
- Compress large text outputs.

### Files to Update
- `packages/shared/src/database/models/ExecutionResult.model.ts`
- New: External storage service for large blobs.

---

## 6) Multi-Region Deployment

### Current Issue
- No guidance on cross-region latency.
- Single-region deployment may be slow for global users.

### Risks
- High latency for distant users.
- Poor user experience.

### Fix
- Deploy API/runner in region closest to users.
- Use CDN (CloudFront) for web assets.
- Consider regional runners for low latency.

### Files to Update
- Deployment guides (AWS, low-cost).
- Environment configuration.

---

## 7) Backup and Disaster Recovery

### Current Issue
- No explicit backup plan beyond Atlas.
- Critical data (problems, user progress) not backed up.

### Risks
- Data loss beyond 7-day TTL.
- No recovery point for accidental deletes.

### Fix
- Export problems and user progress daily to S3.
- Enable Atlas continuous backups.
- Document restore process.

### Files to Update
- New: Backup scripts (cron/lambda).
- Ops runbook.

---

## 8) Compliance (Age Gating, Data Retention)

### Current Issue
- No enforcement for minors.
- Data retention policy not enforced.

### Risks
- Legal issues in some regions.
- Compliance violations.

### Fix
- Add age verification during registration.
- Enforce stricter data retention for minors (e.g., 30 days).
- Add privacy policy and terms links.

### Files to Update
- `apps/web/src/app/(auth)/register/page.tsx`
- `packages/shared/src/database/models/User.model.ts`
- Legal pages in web app.

---

## 9) Rate Limiting per IP vs Per User

### Current Issue
- Rate limiting may block shared IPs (e.g., classrooms).
- No per-user prioritization.

### Risks
- Legitimate users blocked.
- Poor classroom experience.

### Fix
- Prioritize per-user limits.
- Use IP limits only for unauthenticated requests.
- Add classroom/teacher overrides.

### Files to Update
- `apps/api/src/middleware/rateLimit.middleware.ts`

---

## 10) Admin Dashboard

### Current Issue
- No admin UI for monitoring or overrides.
- All ops via CLI/API.

### Risks
- Slow incident response.
- No visibility into system state.

### Fix
- Simple admin page for queue stats, user quotas, debug flags.
- Require admin role.
- Add real-time metrics.

### Files to Update
- New: `apps/web/src/app/admin/`
- New: `apps/api/src/routes/admin.routes.ts`

---

## 11) CI/CD for Sandbox Image

### Current Issue
- No automated build/push for sandbox image.
- Manual builds cause version drift.

### Risks
- Runtime build failures.
- Inconsistent environments.

### Fix
- GitHub Actions to build and push image on merge.
- Tag images with git SHA.
- Update runner to pull by tag.

### Files to Update
- New: `.github/workflows/build-sandbox.yml`
- `apps/runner/src/executors/docker.executor.ts`

---

## 12) Environment-Specific Configs

### Current Issue
- No staging environment.
- Testing in production.

### Risks
- Production bugs.
- No safe testing ground.

### Fix
- Separate staging stack (staging.example.com).
- Promote via PR.
- Environment-specific env vars.

### Files to Update
- Deployment configs.
- CI/CD pipelines.

---

## 13) Database Migrations

### Current Issue
- No migration system for schema changes.
- Manual updates cause downtime.

### Risks
- Manual errors.
- Data loss.

### Fix
- Use `migrate-mongo` or similar.
- Versioned migration scripts.
- Run migrations on deploy.

### Files to Update
- New: `migrations/` directory.
- Deploy scripts.

---

## 14) Content Delivery for Large Assets

### Current Issue
- No plan for large problem assets (images, files).
- Served from API, causing high egress.

### Risks
- Slow page loads.
- High egress costs.

### Fix
- Store large assets in S3/CloudFront.
- Update problem model to reference asset URLs.
- Use CDN for delivery.

### Files to Update
- `packages/shared/src/database/models/Problem.model.ts`
- Asset upload pipeline.

---

## 15) Legal/Privacy Pages

### Current Issue
- No terms of service or privacy policy.
- No links in UI.

### Risks
- Compliance issues.
- User trust.

### Fix
- Add `terms.md` and `privacy.md`.
- Link in footer.
- Require acceptance on registration.

### Files to Update
- New: `apps/web/src/app/(legal)/terms/page.tsx`
- New: `apps/web/src/app/(legal)/privacy/page.tsx`
- Footer component.

---

## 16) Additional Edge Cases

### 16.1 Concurrent Submissions
- **Issue**: User submits multiple times quickly.
- **Fix**: Deduplicate by `userId` + `problemId` + `codeHash`.

### 16.2 Long-Running Jobs
- **Issue**: Jobs exceed timeout but keep runner busy.
- **Fix**: Kill container after timeout; mark job failed.

### 16.3 Unicode/Non-ASCII Code
- **Issue**: Runner fails on non-ASCII characters.
- **Fix**: Ensure UTF-8 encoding in Docker executor.

### 16.4 Memory Leaks in Runner
- **Issue**: Runner memory grows over time.
- **Fix**: Restart runner periodically; monitor memory usage.

### 16.5 Queue Priority
- **Issue**: Teachers’ submissions stuck behind student queue.
- **Fix**: Add priority queue for admin/teacher jobs.

---

## 17) Prioritization

### Immediate (Before Launch)
1. File handling and ownership.
2. Pygame/headless execution.
3. Test case visibility.
4. Job retry policy.
5. Result size limits.

### Short Term (First Weeks)
6. Admin dashboard.
7. CI/CD for sandbox image.
8. Environment-specific configs.
9. Database migrations.
10. Rate limiting per user.

### Long Term (Ongoing)
11. Multi-region deployment.
12. Backup and disaster recovery.
13. Compliance (age gating).
14. Content delivery for large assets.
15. Legal/privacy pages.

---

## 18) Success Criteria

- All file operations are server-side validated.
- Pygame code runs headlessly without hangs.
- Hidden test cases are never exposed to users.
- Jobs are not retried unnecessarily.
- Result sizes are limited and stored efficiently.
- Admin can monitor and override quotas.
- Sandbox image is built and pushed automatically.
- Staging environment exists and is used.
- Database migrations are versioned and automated.
- Large assets are served via CDN.
- Legal pages are linked and required on registration.

---

## 19) Next Steps

1. **Assign owners** for each gap.
2. **Create branches** for high-priority fixes.
3. **Implement Phase 1** (immediate).
4. **Test in staging**.
5. **Deploy to production**.
6. **Monitor and iterate**.

---

**Status:** Consolidated all remaining gaps and edge cases. Address these to achieve full production readiness.
