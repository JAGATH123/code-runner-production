# Security and OWASP Analysis

**Repository:** `code-runner-production-main`  

---

## OWASP Top 10 Issues Found

| Category | Issue | Risk | Mitigation |
|---|---|---|---|
| **A01** | Debug routes exposed | High | Remove/protect debug routes |
| **A02** | Default JWT secret fallback | Critical | Enforce strong secrets |
| **A03** | Docker command injection | High | Use Docker SDK, sanitize inputs |
| **A04** | No execution quotas | High | Add per-user limits |
| **A05** | CORS misconfiguration | Medium | Tighten CORS to web domain |
| **A06** | Outdated dependencies | Medium | Update and scan deps |
| **A07** | Weak rate limiting | Medium | Per-user rate limits |
| **A08** | No sandbox image verification | Medium | Sign images, verify checksums |
| **A09** | No structured logs/alerts | Medium | Add pino + Sentry |
| **A10** | Runner can access internal network | High | Network isolation, no internet |

---

## Detailed Issues

### 1) Broken Access Control
- **Debug routes** (`/api/debug/*`) leak DB connection strings.
- **Fix:** Remove in production or add admin auth.

### 2) Cryptographic Failures
- **JWT secret** fallback to default.
- **Fix:** Crash if secret is default; use 256-bit secret.

### 3) Injection
- **Docker CLI** injection in runner.
- **Fix:** Use Docker SDK; whitelist commands.
- **MongoDB** injection in aggregation.
- **Fix:** Use Mongoose sanitization.

### 4) Insecure Design
- **No quotas** → unlimited execution.
- **Fix:** Per-user daily/minute limits; queue backpressure.

### 5) Security Misconfiguration
- **CORS** may allow any origin.
- **Fix:** Set `CORS_ORIGIN` to deployed web URL.
- **Env vars** not validated.
- **Fix:** Startup validation for required vars.

### 6) Vulnerable Components
- **Outdated deps** may have known CVEs.
- **Fix:** `npm audit fix`;定期 scan.

### 7) Authentication Failures
- **Rate limiting** per IP, not per user.
- **Fix:** Prioritize per-user limits.
- **No session management**.
- **Fix:** Use secure HTTP-only cookies.

### 8) Software/Data Integrity
- **Sandbox image** not verified.
- **Fix:** Sign images; verify checksums.
- **No integrity checks** on results.
- **Fix:** Hash results; detect tampering.

### 9) Logging/Monitoring
- **No structured logs**; hard to search.
- **Fix:** Use pino JSON logger.
- **No alerts** for failures.
- **Fix:** Sentry + UptimeRobot.

### 10) SSRF
- **Runner** can access internal network.
- **Fix:** `--network none`; block internet.

---

## Additional Risks

### File Upload
- **Risk:** Malicious files, oversized uploads.
- **Fix:** Validate type/size; store in isolated bucket.

### Pygame Execution
- **Risk:** Infinite loops, resource exhaustion.
- **Fix:** Strict timeouts; kill container.

### Test Case Exposure
- **Risk:** Hidden tests visible via API.
- **Fix:** Only runner can fetch all tests.

### Job Retry
- **Risk:** Duplicate executions.
- **Fix:** Disable retries for user jobs.

---

## Mitigation Checklist

- [ ] Remove/protect debug routes.
- [ ] Enforce strong JWT secret.
- [ ] Use Docker SDK; sanitize inputs.
- [ ] Add execution quotas.
- [ ] Tighten CORS.
- [ ] Update dependencies.
- [ ] Per-user rate limits.
- [ ] Sign sandbox images.
- [ ] Add structured logs + alerts.
- [ ] Isolate runner network.

---

## Success Criteria

- No debug routes in production.
- JWT secret is strong and validated.
- Runner cannot access internal network.
- Per-user quotas enforced.
- All requests are rate-limited per user.
- Logs are structured and searchable.
- Alerts configured for failures.

---

**Status:** Security analysis complete. Address mitigations before launch.
