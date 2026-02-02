# Immediate Easy Fixes (Non-Blocking, Small Changes)

**Repository:** `code-runner-production-main`  
**Purpose:** Quick, low-risk fixes to reduce critical security and stability issues without major refactoring.

---

## 1) Disable Debug Routes in Production

**File:** `apps/web/src/app/api/debug/db-info/route.ts`

```ts
// Add at the top of the handler
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}
```

**Why:** Prevents internal data leaks in production.

---

## 2) Enforce Strong JWT Secret

**File:** `packages/shared/src/utils/jwt.utils.ts`

```ts
// Add at the top of the file
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}
```

**Why:** Blocks weak/default secrets.

---

## 3) Add Queue Backpressure

**File:** `apps/api/src/routes/execution.routes.ts`

```ts
// Add before enqueueing
const queueSize = await codeExecutionQueue.count();
if (queueSize > 100) {
  return NextResponse.json({ error: 'System busy' }, { status: 503 });
}
```

**Why:** Prevents queue overflow and Redis OOM.

---

## 4) Limit Result Size

**File:** `packages/shared/src/database/models/ExecutionResult.model.ts`

```ts
result: {
  type: Schema.Types.Mixed,
  maxlength: 65536 // 64KB limit
}
```

**Why:** Stops large outputs from bloating DB.

---

## 5) Add Request ID for Tracing

**File:** `apps/api/src/middleware/request-id.middleware.ts` (new file)

```ts
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

export const addRequestId = (req: Request, res: Response, next: NextFunction) => {
  req.requestId = uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};
```

**Use in:** `apps/api/src/index.ts`
```ts
app.use(addRequestId);
```

**Why:** Improves log traceability.

---

## 6) Validate File Upload Size

**File:** `apps/web/src/app/api/files/route.ts`

```ts
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
if (req.headers['content-length'] > MAX_SIZE) {
  return NextResponse.json({ error: 'File too large' }, { status: 413 });
}
```

**Why:** Prevents OOM from large uploads.

---

## 7) Add CORS Origin Validation

**File:** `apps/api/src/index.ts`

```ts
const allowedOrigins = [process.env.CORS_ORIGIN];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
```

**Why:** Blocks unauthorized origins.

---

## 8) Set DB Connection Pool Limit

**File:** `packages/shared/src/database/connection.ts`

```ts
mongoose.connect(uri, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

**Why:** Prevents connection exhaustion.

---

## 9) Add Graceful Shutdown

**File:** `apps/api/src/index.ts`

```ts
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down');
  await mongoose.disconnect();
  process.exit(0);
});
```

**Why:** Enables zero-downtime deploys.

---

## 10) Disable Job Retries for User Jobs

**File:** `apps/api/src/queue/queue.config.ts`

```ts
export const codeExecutionQueue = new Queue('code-execution', redisConfig);
codeExecutionQueue.setDefaultJobOptions({
  attempts: 1, // No retries for user jobs
  removeOnComplete: 100,
  removeOnFail: 50,
});
```

**Why:** Prevents duplicate executions.

---

## 11) Add Basic Rate Limiting

**File:** `apps/api/src/middleware/rateLimit.middleware.ts`

```ts
import rateLimit from 'express-rate-limit';

export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many requests',
});
```

**Use in:** `apps/api/src/routes/execution.routes.ts`
```ts
router.use(strictLimiter);
```

**Why:** Throttles abusive requests.

---

## 12) Sanitize Log Inputs

**File:** Logger utility (new or existing)

```ts
export const sanitizeLog = (input: any) => {
  if (typeof input === 'string') {
    return input.replace(/[\n\r\t]/g, ' ').substring(0, 500);
  }
  return input;
};
```

**Why:** Prevents log injection.

---

## 13) Add Health Check Timeout

**File:** `apps/api/src/routes/health.routes.ts`

```ts
router.get('/health', async (req, res) => {
  const timeout = 5000;
  const health = await Promise.race([
    checkHealth(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
  ]);
  res.json(health);
});
```

**Why:** Prevents slow health checks.

---

## 14) Validate Environment Variables

**File:** `apps/api/src/index.ts`

```ts
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'REDIS_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required env var: ${envVar}`);
  }
}
```

**Why:** Fails fast on missing config.

---

## 15) Add Content-Type Validation

**File:** `apps/web/src/app/api/files/route.ts`

```ts
const allowedTypes = ['image/png', 'image/jpeg', 'text/plain'];
if (!allowedTypes.includes(req.headers['content-type'])) {
  return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
}
```

**Why:** Blocks malicious file uploads.

---

## How to Apply

1. **Copy each snippet** into the specified file.
2. **Test locally** to ensure no breaking changes.
3. **Deploy to staging** first.
4. **Monitor for errors** after production deploy.

---

## Success Criteria

- Debug routes return 404 in production.
- JWT secret must be 32+ chars.
- Queue rejects when > 100 jobs.
- Result size limited to 64KB.
- All requests have unique IDs.
- File uploads limited to 5MB.
- CORS locked to web domain.
- DB pool limited to 10 connections.
- API shuts down gracefully on SIGTERM.
- User jobs never retry.
- Rate limiting enforced.
- Log inputs sanitized.
- Health checks timeout after 5s.
- Required env vars validated.
- File uploads validated for type.

---

**Status:** Ready to apply. These fixes are non-blocking and reduce critical risks.
