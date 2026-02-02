# AWS Deployment Guide (Production-Grade, Cost-Optimized)

**Repository:** `code-runner-production-main`  
**Goal:** Deploy the proposed architecture on AWS with predictable costs and high availability. Includes pitfalls to avoid and cost/performance tradeoffs.

---

## 1) Target Monthly Budget: < $150

| Component | AWS Service | Monthly Cost | Why |
|---|---|---|---|
| **Web** | S3 + CloudFront | $0–$5 | Static hosting, CDN |
| **API** | ECS Fargate (2 replicas) | $30–$50 | Managed, scalable |
| **Queue** | ElastiCache Redis (micro) | $15–$25 | Managed, HA |
| **Runner** | EC2 t3.medium (1x) | $15–$20 | Docker guaranteed |
| **DB** | MongoDB Atlas M10 | $57 | Managed, backups |
| **Logs** | CloudWatch Logs | $5–$10 | Structured logs |
| **Monitoring** | CloudWatch Alarms | $0 | Basic alerts |
| **Total** | | **$122–$167** | Predictable, HA |

---

## 2) Architecture Diagram (AWS)

```
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│   CloudFront│          │   S3 Bucket │          │   API GW    │
│   (CDN)     │◄────►    │ (Static)    │◄────►    │ (ECS Fargate)│
└─────▲───────┘          └─────▲───────┘          └─────▲───────┘
      │ HTTPS                   │ HTTPS                │ HTTPS
      │                         │                      │
      ▼                         ▼                      ▼
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│   Web App   │          │   API Svc   │          │  ElastiCache │
│ (Next.js)   │◄────►    │ (Express)   │◄────►    │   Redis     │
└─────▲───────┘          └─────▲───────┘          └─────▲───────┘
      │ API/HTTPS               │ API/HTTPS              │ Redis
      │                         │                      │
      ▼                         ▼                      ▼
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│   IAM Role  │          │  Runner EC2 │          │   MongoDB   │
│ (Permissions)│         │ (Docker)    │◄────►    │   Atlas     │
└─────────────┘          └─────▲───────┘          └─────────────┘
                                │ Docker
                                ▼
                         ┌─────────────┐
                         │  Sandbox    │
                         │ (Prebuilt)  │
                         └─────────────┘
```

---

## 3) Deployment Steps

### 3.1 Prerequisites
- AWS CLI installed and configured.
- Docker installed locally.
- Domain name (optional, for CloudFront).

### 3.2 S3 + CloudFront (Web)
1. **Create S3 bucket**
   ```bash
   aws s3 mb s3://your-app-web --region us-east-1
   aws s3api put-bucket-website-configuration \
     --bucket your-app-web \
     --website-configuration '{
       "IndexDocument":{"Suffix":"index.html"},
       "ErrorDocument":{"Key":"error.html"}
     }'
   ```

2. **Build and upload web app**
   ```bash
   cd apps/web
   npm run build
   aws s3 sync out/ s3://your-app-web --delete
   ```

3. **Create CloudFront distribution**
   - Origin: S3 bucket (static website).
   - Viewer protocol policy: Redirect HTTP to HTTPS.
   - Custom error responses: 403→200, /index.html.

4. **Set env vars in Next build**
   - `NEXT_PUBLIC_API_URL`: CloudFront or API GW URL.

### 3.3 ECS Fargate (API)
1. **Create ECR repository**
   ```bash
   aws ecr create-repository --repository-name code-runner-api
   ```

2. **Build and push API image**
   ```bash
   cd apps/api
   docker build -t code-runner-api .
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
   docker tag code-runner-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/code-runner-api:latest
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/code-runner-api:latest
   ```

3. **Create ECS cluster and task definition**
   - Cluster: `code-runner-api`.
   - Task definition: 2 vCPU, 4GB RAM, 2 replicas.
   - Environment variables: `MONGODB_URI`, `REDIS_URL`, `JWT_SECRET`, `CORS_ORIGIN`.

4. **Create Application Load Balancer**
   - Target group: ECS service.
   - Health check: `/health`.

5. **Deploy service**
   - Desired count: 2.
   - Deployment configuration: Rolling update.

### 3.4 ElastiCache Redis (Queue)
1. **Create subnet group**
   ```bash
   aws elasticache create-cache-subnet-group \
     --cache-subnet-group-name code-runner-redis \
     --cache-subnet-group-description "Redis for code runner" \
     --subnet-ids subnet-xxx subnet-yyy
   ```

2. **Create Redis cluster**
   ```bash
   aws elasticache create-replication-group \
     --replication-group-id code-runner-redis \
     --description "Redis for code runner" \
     --num-cache-clusters 1 \
     --cache-node-type cache.t3.micro \
     --engine redis \
     --cache-subnet-group-name code-runner-redis
   ```

3. **Get Redis endpoint and set `REDIS_URL` in ECS task definition.**

### 3.5 EC2 (Runner)
1. **Launch EC2 instance**
   - AMI: Amazon Linux 2.
   - Instance type: t3.medium (2 vCPU, 4GB).
   - Security group: Allow SSH (22) and outbound HTTP/HTTPS.
   - IAM role: S3 read (for sandbox image), CloudWatch logs.

2. **Install dependencies**
   ```bash
   sudo yum update -y
   sudo yum install -y docker git
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -a -G docker ec2-user
   ```

3. **Deploy runner**
   ```bash
   git clone <repo>
   cd code-runner-production-main
   npm install
   cd apps/runner
   npm start
   ```

4. **Run as systemd service**
   ```ini
   [Unit]
   Description=Code Runner
   After=network.target

   [Service]
   Type=simple
   User=ec2-user
   WorkingDirectory=/home/ec2-user/code-runner-production-main/apps/runner
   ExecStart=/usr/bin/npm start
   Restart=always
   Environment=NODE_ENV=production
   Environment=MONGODB_URI=<your-uri>
   Environment=REDIS_URL=<your-url>

   [Install]
   WantedBy=multi-user.target
   ```

### 3.6 MongoDB Atlas (DB)
1. **Create M10 cluster** (us-east-1).
2. **Add IP whitelist**: EC2 security group, ECS security group.
3. **Create database user** with read/write permissions.
4. **Copy `MONGODB_URI` to ECS task and EC2 env.**

### 3.7 CloudWatch Logs (Structured Logs)
1. **Create log groups**
   - `/aws/ecs/code-runner-api`
   - `/aws/ec2/code-runner-runner`

2. **Configure ECS task definition**
   - `awslogs` log driver.
   - Log group: `/aws/ecs/code-runner-api`.

3. **Configure EC2**
   - Install CloudWatch agent.
   - Ship logs to `/aws/ec2/code-runner-runner`.

### 3.8 CloudWatch Alarms
1. **API health**
   - Metric: ELB 5XX count.
   - Threshold: > 0 for 1 minute.
   - Action: SNS notification.

2. **Queue depth**
   - Metric: Redis `connected_clients`.
   - Threshold: > 100 for 5 minutes.

3. **Runner CPU**
   - Metric: EC2 CPUUtilization.
   - Threshold: > 80% for 5 minutes.

---

## 4) What NOT to Do (Cost/Performance Traps)

| Pitfall | Why It’s Bad | Cost Impact |
|---|---|---|
| **Use RDS instead of Atlas** | Complex auth, no free tier | $30+/month |
| **Enable Redis Cluster** | $30+/month | Unnecessary |
| **Use large EC2 for runner** | t3.large = $40/month | 2x cost |
| **Enable detailed CloudWatch metrics** | $0.30/metric | Bill spikes |
| **Use NAT Gateway** | $45/month | Avoid with VPC endpoints |
| **Enable autoscaling for API** | Complex and costly | Manual scaling OK |
| **Use Application Load Balancer for web** | $20/month | CloudFront cheaper |

---

## 5) Cost Control Checklist

- [ ] Use S3 + CloudFront for web (not ALB).
- [ ] Use ECS Fargate with 2 replicas (not 3+).
- [ ] Use ElastiCache micro instance.
- [ ] Use EC2 t3.medium for runner (not larger).
- [ ] Use MongoDB Atlas M10 (not M20+).
- [ ] Avoid NAT Gateway; use VPC endpoints.
- [ ] Limit CloudWatch metrics to essentials.
- [ ] Enable TTL on `ExecutionResult`.

---

## 6) Performance vs Cost Tradeoffs

| Decision | Performance Impact | Cost Impact |
|---|---|---|
| **Runner: EC2 t3.medium** | Good for demo | $15/month |
| **Runner: ECS Fargate** | Slower cold starts | $30/month |
| **DB: Atlas M10** | 2GB RAM, fast reads | $57/month |
| **DB: Self-hosted EC2** | Slower but cheaper | $20/month |
| **Queue: ElastiCache micro** | 265MB RAM | $15/month |
| **Queue: Self-hosted** | Slower but cheaper | $5/month |

---

## 7) Security Hardening

- **IAM roles**: Least privilege for ECS and EC2.
- **Security groups**: Allow only necessary ports.
- **VPC**: Private subnets for ECS, public for EC2 runner.
- **TLS**: Everywhere (CloudFront, ALB, ECS).
- **Secrets**: Use AWS Secrets Manager for `JWT_SECRET`.

---

## 8) Monitoring and Alerting

- **CloudWatch Logs**: Structured JSON logs.
- **CloudWatch Alarms**: API health, queue depth, runner CPU.
- **SNS**: Email alerts for alarms.
- **Dashboard**: CloudWatch widget for key metrics.

---

## 9) Scaling Strategy

- **API**: Add more replicas manually (cost controlled).
- **Runner**: Upgrade EC2 instance or add second runner.
- **Queue**: Upgrade Redis instance if memory full.
- **DB**: Atlas scales automatically.

---

## 10) Rollback Plan

- **API**: Deploy previous task definition.
- **Runner**: Revert to previous AMI or commit.
- **Web**: Revert S3 upload.
- **Queue/DB**: No breaking changes.

---

## 11) Success Metrics

- **Cost**: < $150/month at MAU 20k.
- **Availability**: > 99.9% uptime.
- **Latency**: < 2s for runs, < 5s for submissions.
- **Error rate**: < 1% for execution.
- **Queue wait**: < 2s 95th percentile.

---

## 12) Next Steps

1. **Create AWS resources** (S3, ECS, ElastiCache, EC2).
2. **Build and push images** (API to ECR).
3. **Deploy services** (API, runner).
4. **Configure monitoring** (CloudWatch).
5. **Test end-to-end**.
6. **Go live**.

---

**Status:** AWS deployment guide ready for review. Follow the steps to deploy a production-grade, cost-optimized architecture on AWS.
