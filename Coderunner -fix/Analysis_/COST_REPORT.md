# Code Runner Platform — Scenario-Based Cost, Scaling, and Improvement Plan (DevOps Report)

**Repository:** `code-runner-production-main`

This report provides **end-to-end, scenario-based monthly billing estimates**, **best/base/worst-case scenarios**, a **per-user cost model**, and a **prioritized improvement plan** to reduce downtime and cost while improving scalability.

> IMPORTANT CONTEXT: Your current codebase contains two execution approaches (queue-based runner vs Next.js-local execution). For predictable ops and cost control, this report assumes **production uses the microservice path**:
>
>- **Web (Next.js)** → **API (Express)** → **Redis (BullMQ)** → **Runner (Docker sandbox)** → **MongoDB**
>
If you choose to run execution inside Next.js (`/api/run`), costs become harder to control and downtime risk increases because web servers become compute servers.

---

## 0) What you get from this report

- **Provider-by-provider cost templates** (AWS / Azure / GCP + low-cost providers + PaaS)
- **Best/Base/Worst-case scenarios**
- **Per-user cost model** (simple formulas you can paste into Product/Finance docs)
- **Breakpoints**: when you need a second runner, bigger DB tier, or replication
- **Cost reduction levers** with estimated impact
- **High-availability plan** with low-maintenance operational practices

---

## 1) Architecture baseline (recommended for low downtime + cost control)

### Services
- **Web**: `apps/web` (Next.js)
- **API**: `apps/api` (Express)
- **Runner**: `apps/runner` (BullMQ workers + Docker execution)
- **Redis**: BullMQ queue + rate/quotas counters
- **MongoDB**: content + users + execution/submission results

### HA target
- **Web**: 2 replicas (rolling deploy / zero downtime)
- **API**: 2 replicas (rolling deploy / zero downtime)
- **Runner**: 1 replica initially (buffered by queue) → scale to 2+ as needed
- **Redis/MongoDB**: managed preferred; if self-hosted, HA becomes your responsibility

---

## 2) Key cost drivers (what actually creates the bill)

### 2.1 Fixed-ish baseline costs
- **Always-on replicas**: web + api
- **Managed data stores**: Redis + Mongo
- **Ingress/CDN**: Cloudflare / LB
- **Observability**: logs + error reporting

### 2.2 Variable costs (dominant at scale)
- **Code execution compute** (Runner CPU/RAM)
- **Queue throughput** (Redis ops / memory)
- **Database read amplification** (levels/session aggregation if uncached)
- **Egress** (images/assets/downloads)

> In practice, **Runner compute** becomes the #1 cost driver once user activity increases.

---

## 3) Inputs (tune these to your real workload)

Define:

- **MAU**: Monthly Active Users
- **DAU**: Daily Active Users
- **Peak concurrency**: users simultaneously active (critical for web/api sizing)

Execution:
- `R` = average **Run** operations per active user per day
- `S` = average **Submit/Grade** operations per active user per day
- `t_run` = average runtime seconds for Run (bounded by timeout)
- `t_submit` = average runtime seconds for a submission (includes test cases)
- `OverheadFactor` = 2–5 (container startup, IO, scheduler overhead)

### Base scenario assumptions (used for concrete numbers below)
- **MAU**: 20,000
- **DAU**: 3,000 (15% of MAU)
- **Peak concurrency**: ~500
- `R = 10`, `S = 2`
- `t_run = 2.5s`, `t_submit = 12s`
- `OverheadFactor = 3`
- **Regions**: India + US (CDN in front)

---

## 4) Per-user cost model (execution is the main variable)

### 4.1 Compute seconds per active user per day
```
ExecSecondsPerUserDay = (R * t_run) + (S * t_submit)
```

### 4.2 Effective vCPU-hours per active user per day
```
vCPUHoursPerUserDay ≈ (ExecSecondsPerUserDay / 3600) * OverheadFactor
```

### 4.3 Execution cost per active user per month
Let `C_vCPU_hour` be your cost per vCPU-hour on runners.

Examples of `C_vCPU_hour` (rough):
- **VPS $12/mo with 2 vCPU**: $12 / (2 * 720h) ≈ **$0.0083 per vCPU-hour**
- **VPS $24/mo with 4 vCPU**: $24 / (4 * 720h) ≈ **$0.0083 per vCPU-hour**

#### Base scenario per-user execution cost
Using the base assumptions:
```
ExecSecondsPerUserDay = (10 * 2.5) + (2 * 12) = 25 + 24 = 49s
vCPUHoursPerUserDay ≈ (49 / 3600) * 3 ≈ 0.0408 vCPU-hours
CostPerUserMonth_execution ≈ 0.0408 * 30 * 0.0083 ≈ $0.0102 ≈ 1 cent/month
```

For 3,000 DAU:
- **Daily execution compute**: 3,000 * 0.0408 ≈ 122.4 vCPU-hours ≈ 5.1 vCPU-hours/day
- **Monthly execution compute**: ~153 vCPU-hours ≈ **~1.3 vCPU-hours/day average**
- **Runner sizing**: 1x 2 vCPU/4GB VPS is sufficient for base scenario; add a second runner when queue wait > 2–5s.

Then:
```
CostPerUserMonth_execution ≈ vCPUHoursPerUserDay * 30 * C_vCPU_hour
```

### Example (base)
- `R=10`, `t_run=2s`, `S=2`, `t_submit=10s` → 40 sec/day
- overhead 3x → 120 sec/day → 0.033 vCPU-hours/day
- with $0.01/vCPU-hour:
  - per user per month ≈ 0.033 * 30 * 0.01 = **$0.0099 ≈ 1 cent/month** (execution only)

**This looks tiny, but scales fast**:
- 100,000 active users/month → ~$1,000 execution compute/month (plus platform + data)
- Worst-case (timeouts, abuse, high R) can be 10–100x.

---

## 5) Scenario-based billing (Best / Base / Worst)

These scenarios include:
- Web (2 replicas)
- API (2 replicas)
- Redis managed
- MongoDB Atlas managed
- Runner (1+ instances)
- Cloudflare (optional)
- Observability (Sentry)

> All amounts below are **ranges** (pricing changes and depends on sizing). Use them for planning; finalize with provider calculators once you have exact instance sizes.

### Scenario A — BEST CASE (low execution, strong caching, strict quotas)
Assumptions:
- MAU: 10k
- DAU: 1k
- R=5, S=1
- tight timeouts + quotas + CDN caching for content

Expected shape:
- Runner: 1 small VPS often enough
- Redis: small managed plan
- Mongo: low tier

Estimated monthly cost:
- **Total**: **$40 – $180**

### Scenario B — BASE CASE (moderate execution)
Assumptions:
- MAU: 20k
- DAU: 3k
- R=10, S=2
- moderate caching, moderate quotas

Estimated monthly cost:
- **Total**: **$120 – $600**

### Scenario C — WORST CASE (execution-heavy + abuse + weak quotas)
Assumptions:
- MAU: 50k
- DAU: 5k
- R=30, S=5
- long timeouts, high retry rates, many submissions

Estimated monthly cost:
- **Total**: **$400 – $3,000+**

Where worst-case money goes:
- Runner fleet grows quickly
- Redis throughput tier increases
- Logs/observability ingestion grows

---

## 6) Provider-by-provider cost templates (end-to-end)

Each template lists common ways to host:
- Web + API
- Runner
- Redis
- Mongo
- CDN
- Monitoring

### 6.1 Lowest-maintenance balanced plan (recommended): PaaS + VPS runner
**Use case:** fastest path to zero-downtime for web/api + reliable Docker for runner.

**Web + API (PaaS):** Railway / Render / Fly.io
- Web: 2 replicas
- API: 2 replicas

**Runner:** VPS (Docker guaranteed)
- Start: 1x 2vCPU/4GB
- Scale: 2x 2vCPU/4GB

**Redis:** Upstash / Railway Redis plugin
**Mongo:** MongoDB Atlas
**CDN:** Cloudflare
**Monitoring:** Sentry (free → paid)

#### Base scenario monthly bill (MAU 20k, DAU 3k)
| Component | Approx. monthly cost |
|---|---:|
| **Web (2 replicas)** | $20–$60 |
| **API (2 replicas)** | $20–$60 |
| **Runner (1x 2vCPU/4GB VPS)** | $6–$15 |
| **Redis (managed small)** | $5–$20 |
| **MongoDB Atlas (M5/M10)** | $25–$80 |
| **Cloudflare** | $0–$20 |
| **Sentry** | $0–$29 |
| **Total** | **$76–$284** |

If you need a second runner (queue wait > 2–5s): add another $6–$15.

### 6.2 Cheapest predictable bill: VPS-only (microservices-lite)
**Use case:** lowest monthly bill; higher ops overhead.

- VPS1: Web + API (2 containers) behind Caddy/Traefik
- VPS2: Runner (+ optional Redis)
- MongoDB Atlas remains managed
- Cloudflare in front

#### Base scenario monthly bill (MAU 20k, DAU 3k)
| Component | Approx. monthly cost |
|---|---:|
| **VPS1 (Web+API, 2 containers)** | $5–$12 |
| **VPS2 (Runner, 2vCPU/4GB)** | $6–$15 |
| **Redis (self-hosted or managed)** | $0–$6 |
| **MongoDB Atlas (M5/M10)** | $25–$80 |
| **Cloudflare** | $0–$20 |
| **Sentry** | $0–$29 |
| **Total** | **$36–$162** |

Tradeoffs:
- You must implement rolling deploy / blue-green yourself
- VPS failures are your responsibility unless you run redundancy

---

## 7) AWS options (detailed)

### 7.1 AWS “simple and predictable” (good starting point in AWS)
**Web+API:** AWS Lightsail (or ECS on EC2 if you prefer)
- 2 instances for HA (or 1 if you accept downtime)

**Runner:** AWS Lightsail or EC2 (Docker)
- 1–2 instances

**Redis:** ElastiCache Redis (excellent, can be pricey)
**Mongo:** MongoDB Atlas (recommended) or DocumentDB (compat tradeoffs)
**CDN:** CloudFront (optional) or Cloudflare

#### Base scenario monthly bill (MAU 20k, DAU 3k)
| Component | Approx. monthly cost |
|---|---:|
| **Web+API (2x Lightsail or ECS small)** | $30–$80 |
| **Runner (1x Lightsail/EC2 2vCPU/4GB)** | $12–$30 |
| **ElastiCache Redis (small)** | $15–$40 |
| **MongoDB Atlas (M5/M10)** | $25–$80 |
| **CloudFront (optional)** | $0–$20 |
| **Sentry** | $0–$29 |
| **Total** | **$82–$279** |

Cost notes / traps:
- Avoid NAT Gateway early unless required (it can dominate cost)
- EC2 + ALB can be cost-effective if sized carefully

### 7.2 AWS “cloud-native” (more scalable, more moving parts)
**Web+API:** ECS Fargate (easy scaling)
**Runner:** ECS on EC2 (not Fargate) or EKS (later)
**Redis:** ElastiCache

This is high-availability friendly, but usually **not lowest bill** for small teams.

---

## 8) Azure options (detailed)

### 8.1 Azure “platform-managed”
**Web+API:** Azure App Service or Azure Container Apps
**Runner:** Azure VM (Docker)
**Redis:** Azure Cache for Redis
**Mongo:** MongoDB Atlas (preferred) or Cosmos DB Mongo API (watch costs)
**CDN:** Azure Front Door or Cloudflare

#### Base scenario monthly bill (MAU 20k, DAU 3k)
| Component | Approx. monthly cost |
|---|---:|
| **Web+API (2x App Service or Container Apps)** | $30–$90 |
| **Runner (1x VM 2vCPU/4GB)** | $12–$35 |
| **Azure Cache for Redis (small)** | $15–$45 |
| **MongoDB Atlas (M5/M10)** | $25–$80 |
| **Front Door (optional)** | $0–$20 |
| **Sentry** | $0–$29 |
| **Total** | **$82–$299** |

Cost notes:
- Observability (Application Insights) can grow with ingestion volume

---

## 9) GCP options (optional)

**Web+API:** Cloud Run (stateless)
**Runner:** Compute Engine (Docker)
**Redis:** Memorystore
**Mongo:** Atlas

#### Base scenario monthly bill (MAU 20k, DAU 3k)
| Component | Approx. monthly cost |
|---|---:|
| **Web+API (2x Cloud Run)** | $25–$80 |
| **Runner (1x Compute Engine 2vCPU/4GB)** | $12–$30 |
| **Memorystore Redis (small)** | $15–$45 |
| **MongoDB Atlas (M5/M10)** | $25–$80 |
| **Cloudflare** | $0–$20 |
| **Sentry** | $0–$29 |
| **Total** | **$77–$284** |

Cloud Run is excellent for stateless web/api, but runner still needs VMs.

---

## 10) Cheap providers (best value shortlist)

### Runner-friendly (Docker guaranteed)
- **Hetzner** (often cheapest; EU-focused)
- **Vultr**
- **DigitalOcean**
- **Linode/Akamai**

### Managed Redis at low cost
- **Upstash Redis**

### CDN/WAF low cost
- **Cloudflare**

---

## 11) How to reduce the bill (with estimated impact)

### 11.1 Fix architecture drift (reduces downtime + engineering cost)
**Action:** choose one production execution path (API+Runner). Remove Next-local execution from production.
- **Impact:** big reduction in “works locally” incidents; fewer emergency deploys.

### 11.2 Enforce quotas + backpressure (largest $$ control)
Actions:
- per-user daily runs
- per-user per-minute runs
- reject runs when queue depth is high

Estimated impact:
- **Best-case savings:** 30–90% of execution spend at scale (prevents abuse)

### 11.3 Make runner image deterministic (avoid runtime builds)
Actions:
- build sandbox image in CI
- runner pulls versioned image

Estimated impact:
- reduces downtime, reduces debugging hours
- prevents failures caused by missing Dockerfile/image drift

### 11.4 Cache content aggressively
Actions:
- Cloudflare caching for `/levels/:age_group`, `/problems/:id`
- precompute levels instead of aggregating per request

Estimated impact:
- can reduce API/DB load 50–95% for browsing-heavy traffic

### 11.5 Right-size HA
Actions:
- Web/API: 2 replicas
- Runner: 1 replica until queue wait time requires 2

Estimated impact:
- avoids paying for always-on runners you don’t need

---

## 12) Operational plan (low maintenance, low downtime)

### 12.1 Release strategy
- Rolling deploy for web/api with health checks
- Runner deploy with overlap (start new runner → stop old)

### 12.2 Health checks
- API: `/health` and `/health/redis`
- Runner: readiness based on Redis + Mongo connectivity

### 12.3 Observability
- Sentry for web + api
- Alerts on:
  - API health failing
  - Redis connectivity failing
  - queue waiting > threshold
  - job fail spikes

---

## 13) Data you should collect to make costs precise

To turn ranges into a tight budget, measure:
- DAU and peak concurrency
- average execution time distribution (p50/p95)
- submissions test case counts
- queue wait time
- runner CPU utilization

---

## 14) Final recommendations (what to ship next)

### Phase 1 (1–3 days)
- Choose production execution path = **API+Runner**
- Fix endpoint mismatches (web → `/execution/*`)
- Add env validation (fail fast on missing secrets)

### Phase 2 (3–7 days)
- 2 replicas web + 2 replicas api
- Cloudflare caching
- Basic quotas + backpressure

### Phase 3 (1–3 weeks)
- Deterministic sandbox image build in CI
- Runner autoscale policy (manual first)
- Progress/submissions as server-owned models

---

## Appendix A — Quick “bill delta” examples (what changes reduce cost)

### Example: adding quotas
If worst-case behavior allows 30 runs/day/user, reducing to 10 runs/day/user:
- Execution seconds drop ~3x
- Runner compute cost drops roughly ~3x

### Example: caching curriculum
If 80% of traffic is browsing and you cache levels/problems at CDN:
- API/Mongo load may drop 5–20x
- you can keep smaller instances longer

---

## Appendix B — Notes specific to this repo

- Your API exposes queue execution under `/execution/*`.
- Your web UI currently calls Next-local `/api/run` and `/api/submit`.
- Your web API client has mismatched execution paths; align it before switching.
- Runner expects to build `python-code-runner` image, but a `Dockerfile` was not found in repo; make the sandbox image deterministic.

---

## Appendix C — Base scenario summary (MAU 20k, DAU 3k)

| Provider | Monthly total (USD) |
|---|---:|
| **PaaS + VPS runner** | **$76–$284** |
| **VPS-only** | **$36–$162** |
| **AWS Lightsail/ECS** | **$82–$279** |
| **Azure** | **$82–$299** |
| **GCP Cloud Run** | **$77–$284** |

Per-user execution cost (base scenario): **~1 cent/month**.  
Add a second runner when queue wait > 2–5s (adds $6–$15).

---

**Next step (to finalize numbers):**
Reply with:
1) MAU (3 mo / 12 mo)
2) DAU
3) peak concurrent users
4) R and S
5) average runtime + timeout
6) average testcases/submission
7) regions
8) do you need pygame/files in prod

Then we can produce a second version of this report with **tighter, provider-calculator-aligned totals**.
