# Deployment Checklist - VPS + Railway

Quick reference for deploying Code Runner with **VPS backend** + **Railway frontend**.

## Overview

| Component | Platform | Cost |
|-----------|----------|------|
| **Frontend** (Next.js Web) | Railway | $0-10/month |
| **Backend** (API + Runner) | VPS (Ubuntu) | $12-40/month |
| **Database** | MongoDB Atlas | $0 (free tier) |
| **Queue** | Redis on VPS | $0 (included in VPS) |
| **Total** | - | **$12-50/month** |

---

## Part 1: VPS Backend Deployment

### Prerequisites
- [ ] Ubuntu 20.04+ VPS with 4-8GB RAM
- [ ] SSH access to VPS
- [ ] MongoDB Atlas connection string
- [ ] Docker installed on VPS

### Files to Deploy to VPS
```
/var/www/code-runner/
├── apps/api/              ✅ Deploy
├── apps/runner/           ✅ Deploy
├── packages/shared/       ✅ Deploy
├── ecosystem.config.js    ✅ Deploy
├── nginx.conf            ✅ Deploy
└── apps/web/             ❌ Don't deploy (goes to Railway)
```

### VPS Deployment Steps

1. **SSH into VPS**
   ```bash
   ssh root@YOUR_VPS_IP
   ```

2. **Clone repository**
   ```bash
   git clone https://github.com/your-username/code-runner-production.git /var/www/code-runner
   cd /var/www/code-runner
   ```

3. **Run deployment script**
   ```bash
   chmod +x deploy-backend-only.sh
   ./deploy-backend-only.sh
   ```

4. **Configure environment variables**

   **API (.env in apps/api/):**
   ```bash
   NODE_ENV=production
   PORT=4000

   # MongoDB Atlas
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/code-runner

   # Redis (local on VPS)
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=<generated_by_deploy_script>

   # JWT Secret
   JWT_SECRET=<generate_with_openssl_rand_-base64_32>

   # CORS (add Railway domain after step 2)
   CORS_ORIGIN=https://your-app.railway.app
   ```

   **Runner (.env in apps/runner/):**
   ```bash
   NODE_ENV=production

   # MongoDB Atlas
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/code-runner

   # Redis (local on VPS)
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=<same_as_api>

   # Container Pooling
   ENABLE_CONTAINER_POOL=true
   POOL_MIN_SIZE=2
   POOL_MAX_SIZE=5
   POOL_MAX_CONTAINER_AGE_MS=1800000
   SANDBOX_IMAGE=python-code-runner

   # Worker Concurrency
   WORKER_CONCURRENCY_EXECUTION=3
   WORKER_CONCURRENCY_SUBMISSION=2
   ```

5. **Start services with PM2**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

6. **Verify backend is running**
   ```bash
   # Check PM2 processes
   pm2 status

   # Check container pool
   docker ps | grep pool-

   # Test API endpoint
   curl http://localhost/api/health
   ```

### VPS Configuration Checklist
- [ ] Docker installed and running
- [ ] Redis installed with password
- [ ] Nginx configured and running
- [ ] PM2 running 4 processes (2 API + 2 Runner)
- [ ] Container pool initialized (2-5 containers)
- [ ] Firewall allows ports 80, 443
- [ ] API health check responds: `curl http://YOUR_VPS_IP/api/health`

---

## Part 2: Railway Frontend Deployment

### Prerequisites
- [ ] Railway account (free tier)
- [ ] GitHub repository connected
- [ ] VPS backend deployed and running

### Railway Deployment Steps

1. **Create new Railway project**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure environment variables in Railway**

   Add these in Railway dashboard → Variables:
   ```bash
   # Point to your VPS API
   NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP/api

   # Or use domain if you set one up:
   # NEXT_PUBLIC_API_URL=https://api.yourdomain.com

   NODE_ENV=production
   ```

3. **Deploy**
   - Railway auto-deploys from GitHub
   - Wait 2-3 minutes for build
   - Get your URL: `your-app-name.railway.app`

4. **Update VPS CORS settings**

   Edit `apps/api/src/index.ts` on VPS:
   ```typescript
   app.use(cors({
     origin: [
       'https://your-app-name.railway.app',  // Add Railway URL
       'http://localhost:3000'
     ],
     credentials: true
   }));
   ```

   Rebuild and restart:
   ```bash
   cd /var/www/code-runner/apps/api
   npm run build
   pm2 restart api-1 api-2
   ```

### Railway Configuration Checklist
- [ ] Repository connected to Railway
- [ ] Build completes successfully
- [ ] `NEXT_PUBLIC_API_URL` env var set
- [ ] Frontend URL accessible: `https://your-app.railway.app`
- [ ] Can make API calls to VPS
- [ ] CORS configured on VPS API

---

## Part 3: Testing Full Stack

### Test Checklist

1. **Frontend loads**
   ```
   https://your-app-name.railway.app
   ```
   - [ ] Page loads without errors
   - [ ] No console errors

2. **Frontend can reach API**

   Open browser console on Railway URL:
   ```javascript
   fetch('http://YOUR_VPS_IP/api/health')
     .then(r => r.text())
     .then(console.log)
   ```
   - [ ] Should return "healthy" or similar

3. **Code execution works**
   - [ ] Submit code through web UI
   - [ ] Check execution completes
   - [ ] Check PM2 logs on VPS: `pm2 logs runner-1`

4. **Container pool is working**

   On VPS:
   ```bash
   pm2 logs runner-1 --lines 50
   ```
   - [ ] Should see "Container pool initialized"
   - [ ] Should see container acquisition logs

---

## Monitoring

### Daily Checks

**VPS (Backend):**
```bash
# Process status
pm2 status

# Logs
pm2 logs --lines 100

# Container pool
docker ps | grep pool-

# Resource usage
docker stats
htop
```

**Railway (Frontend):**
- Check Railway dashboard → Metrics
- View deployment logs
- Check for error rates

### Weekly Checks
- [ ] Review error logs
- [ ] Check disk space on VPS: `df -h`
- [ ] Review MongoDB Atlas metrics
- [ ] Check Railway resource usage

---

## Troubleshooting

### Issue: Frontend can't reach API

**Symptoms:** CORS errors, failed fetch requests

**Fix:**
1. Check `NEXT_PUBLIC_API_URL` in Railway env vars
2. Verify VPS firewall allows port 80
3. Update CORS in API code
4. Restart API: `pm2 restart api-1 api-2`

### Issue: Code execution fails

**Symptoms:** Timeout errors, no output

**Check:**
```bash
# VPS - Check runners are running
pm2 status

# Check container pool
docker ps | grep pool-

# Check runner logs
pm2 logs runner-1

# Test container manually
docker run --rm python-code-runner python -c "print('test')"
```

### Issue: High latency

**Check:**
1. VPS location (should be near users)
2. Container pool size (increase if exhausted)
3. API response times in logs

**Fix:**
```bash
# Increase pool size
# Edit ecosystem.config.js: POOL_MAX_SIZE=10
pm2 restart runner-1 runner-2
```

---

## Scaling Up

### For 500+ users:

1. **Increase pool size**
   ```javascript
   // ecosystem.config.js
   POOL_MIN_SIZE: 5,
   POOL_MAX_SIZE: 10,
   ```

2. **Add more runner instances**
   ```javascript
   // Add runner-3, runner-4, etc.
   ```

3. **Upgrade VPS**
   - From 4GB → 8GB RAM
   - From 2 CPU → 4 CPU

---

## Cost Breakdown

| Component | Tier | Monthly Cost |
|-----------|------|--------------|
| VPS (4GB, 2 CPU) | DigitalOcean | $12 |
| VPS (8GB, 4 CPU) | DigitalOcean | $24 |
| Railway Web | Free tier | $0 |
| Railway Web | Paid | $5-10 |
| MongoDB Atlas | Free (M0) | $0 |
| Domain (optional) | Namecheap | $1 |
| **Total (Basic)** | - | **$12-13** |
| **Total (Recommended)** | - | **$25-35** |

---

## Quick Commands Reference

### VPS Commands
```bash
# Status
pm2 status
pm2 monit

# Logs
pm2 logs
pm2 logs api-1
pm2 logs runner-1

# Restart
pm2 restart all
pm2 restart api-1

# Container pool
docker ps | grep pool-
docker stats

# Nginx
sudo systemctl status nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Railway Commands
```bash
# Deploy from CLI
railway up

# View logs
railway logs

# Environment variables
railway variables
```

---

## Support Resources

- [VPS Deployment Guide](./docs/VPS_DEPLOYMENT.md)
- [Railway Deployment Guide](./docs/RAILWAY_WEB_DEPLOYMENT.md)
- [Container Pooling Docs](./docs/CONTAINER_POOLING.md)
- [Architecture Overview](./ARCHITECTURE.md)

---

**Last Updated:** January 2026
**Version:** 2.0 (VPS + Railway)
