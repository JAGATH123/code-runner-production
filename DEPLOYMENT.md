# Code Runner - Railway Deployment Guide

This guide walks you through deploying the Code Runner platform to Railway with the microservices architecture.

---

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ Railway account ([railway.app](https://railway.app))
- ✅ GitHub account
- ✅ MongoDB Atlas account with cluster set up
- ✅ All code in a clean GitHub repository
- ✅ Strong JWT secret generated

---

## 🏗️ Architecture Overview

Your deployment will consist of:

```
Railway Project:
├── Web App Service (Next.js)     → Port 3000
├── API Service (Express)         → Port 4000
├── Runner Service (Workers)      → No exposed port
└── Redis Plugin                  → Managed by Railway

External:
└── MongoDB Atlas                 → Cloud database
```

---

## 🚀 Deployment Steps

### Step 1: Prepare MongoDB Atlas

1. **Log in to MongoDB Atlas** ([cloud.mongodb.com](https://cloud.mongodb.com))

2. **Get your connection string:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://username:<password>@cluster.mongodb.net/`

3. **Important:** URL-encode special characters in password
   - `@` becomes `%40`
   - `#` becomes `%23`
   - `$` becomes `%24`
   - Example: `Lof@123` → `Lof%40123`

4. **Final connection string:**
   ```
   mongodb+srv://code-runner-admin:Lof%40123@code-runner-db.62kbtjj.mongodb.net/code-runner?retryWrites=true&w=majority
   ```

### Step 2: Generate JWT Secret

Run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save the output - you'll need it for Railway environment variables.

Example output:
```
4f8a7b2c9e1d3f6a8b4c7e2f9a1b5c8d3e6f9a2b5c8d1e4f7a9b2c5d8e1f4a7b
```

### Step 3: Push Code to GitHub

1. **Create new GitHub repository:**
   - Go to github.com
   - Click "New repository"
   - Name: `code-runner-production`
   - Make it **private** (contains sensitive architecture)
   - Don't initialize with README (you already have one)

2. **Push your code:**
   ```bash
   cd D:\LOF\PROJECTS\LOF\code-runner-production
   git init
   git add .
   git commit -m "Initial production deployment"
   git remote add origin https://github.com/YOUR_USERNAME/code-runner-production.git
   git push -u origin main
   ```

### Step 4: Create Railway Project

1. **Log in to Railway** ([railway.app](https://railway.app))

2. **Create new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize Railway to access your GitHub
   - Select `code-runner-production` repository

3. **Railway will auto-detect your monorepo** but won't deploy yet

### Step 5: Add Redis Plugin

1. **In your Railway project:**
   - Click "+ New"
   - Select "Database"
   - Choose "Redis"
   - Railway will provision a Redis instance

2. **Note:** Railway automatically injects `REDIS_URL` environment variable to all services

### Step 6: Deploy Web App Service

1. **Click "+ New" → "Empty Service"**
2. **Name it:** `web-app`
3. **Connect to GitHub repo**
4. **Configure service:**
   - **Settings → Service:**
     - Root Directory: `apps/web`
     - Build Command: `npm run build`
     - Start Command: `npm run start`

5. **Add environment variables:**
   ```
   NEXT_PUBLIC_API_URL=https://${{API_SERVICE_URL}}
   MONGODB_URI=mongodb+srv://code-runner-admin:Lof%40123@cluster.mongodb.net/code-runner
   NODE_ENV=production
   ```

   **Note:** Replace `${{API_SERVICE_URL}}` with actual API URL after deploying API service

6. **Generate domain:**
   - Settings → Networking
   - Click "Generate Domain"
   - Save this URL (e.g., `code-runner-web.up.railway.app`)

7. **Deploy:** Click "Deploy"

### Step 7: Deploy API Service

1. **Click "+ New" → "Empty Service"**
2. **Name it:** `api-service`
3. **Connect to GitHub repo**
4. **Configure service:**
   - **Settings → Service:**
     - Root Directory: `apps/api`
     - Build Command: `npm run build`
     - Start Command: `npm run start`

5. **Add environment variables:**
   ```
   PORT=4000
   NODE_ENV=production

   # MongoDB Atlas (URL-encode special characters!)
   MONGODB_URI=mongodb+srv://code-runner-admin:Lof%40123@cluster.mongodb.net/code-runner?retryWrites=true&w=majority

   # Redis (Railway injects this automatically, but you can also use these)
   REDIS_HOST=${{Redis.RAILWAY_PRIVATE_DOMAIN}}
   REDIS_PORT=${{Redis.REDIS_PORT}}

   # JWT Secret (use the one you generated)
   JWT_SECRET=4f8a7b2c9e1d3f6a8b4c7e2f9a1b5c8d3e6f9a2b5c8d1e4f7a9b2c5d8e1f4a7b

   # CORS (use your web app URL)
   CORS_ORIGIN=https://code-runner-web.up.railway.app
   ```

6. **Generate domain:**
   - Settings → Networking
   - Click "Generate Domain"
   - Copy the URL (e.g., `code-runner-api.up.railway.app`)

7. **Update Web App's NEXT_PUBLIC_API_URL:**
   - Go back to web-app service
   - Update `NEXT_PUBLIC_API_URL` to your API URL
   - Web app will auto-redeploy

8. **Deploy:** Click "Deploy"

### Step 8: Deploy Runner Service

**⚠️ CRITICAL: Docker-in-Docker Issue**

The Runner service uses Docker to execute code. This may or may not work on Railway.

**Option A: Try deploying on Railway (Recommended first)**

1. **Click "+ New" → "Empty Service"**
2. **Name it:** `runner-service`
3. **Connect to GitHub repo**
4. **Configure service:**
   - **Settings → Service:**
     - Root Directory: `apps/runner`
     - Build Command: `npm run build`
     - Start Command: `npm run start`

5. **Add environment variables:**
   ```
   NODE_ENV=production

   # MongoDB Atlas (same as API service)
   MONGODB_URI=mongodb+srv://code-runner-admin:Lof%40123@cluster.mongodb.net/code-runner?retryWrites=true&w=majority

   # Redis (Railway auto-injects)
   REDIS_HOST=${{Redis.RAILWAY_PRIVATE_DOMAIN}}
   REDIS_PORT=${{Redis.REDIS_PORT}}

   # Worker Configuration
   WORKER_CONCURRENCY_EXECUTION=5
   WORKER_CONCURRENCY_SUBMISSION=3
   ```

6. **Deploy and test:**
   - Click "Deploy"
   - Watch the logs
   - Try submitting code through the web app
   - **If it fails with Docker errors** → Go to Option B

**Option B: Deploy Runner on VPS (if Railway fails)**

If Railway doesn't support Docker-in-Docker:

1. **Get a cheap VPS:**
   - DigitalOcean Droplet ($6/month)
   - Hetzner Cloud ($5/month)
   - Vultr ($6/month)

2. **Install Docker on VPS:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

3. **Clone repo and run runner:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/code-runner-production.git
   cd code-runner-production/apps/runner
   npm install

   # Create .env.local with Railway Redis URL
   npm run build
   npm run start
   ```

4. **Cost:** Railway ($8-15/month) + VPS ($5-6/month) = **$13-21/month**

---

## ✅ Post-Deployment Checklist

### 1. Test Web App
- Visit your web app URL
- Can you see the homepage?
- Does login/register work?

### 2. Test API Service
- Visit `https://your-api.railway.app/health`
- Should return: `{"status":"ok"}`

### 3. Test Code Execution
- Log in to web app
- Go to any problem
- Write simple code: `print("Hello World")`
- Click "Run Code"
- **If it works:** ✅ Runner is working!
- **If it fails:** Check runner service logs

### 4. Test Full Flow
- Complete a problem
- Submit for grading
- Check if score is saved
- Verify progress is tracked

### 5. Monitor Services
- Railway Dashboard → View Logs
- Check for any errors
- Monitor memory/CPU usage

---

## 🔧 Environment Variables Reference

### Web App (`apps/web`)
```bash
NEXT_PUBLIC_API_URL=https://your-api.up.railway.app
MONGODB_URI=mongodb+srv://...  # Only if using web app's /api routes
NODE_ENV=production
```

### API Service (`apps/api`)
```bash
PORT=4000
NODE_ENV=production
MONGODB_URI=mongodb+srv://code-runner-admin:Password%40123@cluster.mongodb.net/code-runner
REDIS_HOST=${{Redis.RAILWAY_PRIVATE_DOMAIN}}
REDIS_PORT=${{Redis.REDIS_PORT}}
JWT_SECRET=your-generated-secret
CORS_ORIGIN=https://your-web-app.up.railway.app
```

### Runner Service (`apps/runner`)
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://...  # Same as API
REDIS_HOST=${{Redis.RAILWAY_PRIVATE_DOMAIN}}
REDIS_PORT=${{Redis.REDIS_PORT}}
WORKER_CONCURRENCY_EXECUTION=5
WORKER_CONCURRENCY_SUBMISSION=3
```

---

## 💰 Cost Estimate

### Railway Pricing

**Hobby Plan:** $5/month (includes $5 usage credit)

| Service | Estimated Cost |
|---------|----------------|
| Web App | $2-5/month |
| API Service | $3-7/month |
| Runner Service | $3-8/month |
| Redis Plugin | $1-3/month |
| **Total (Railway)** | **$9-23/month** |

**MongoDB Atlas:** Free (M0 tier) or $9/month (M10 tier)

**Total Cost:** $9-32/month (depending on usage)

---

## 🐛 Troubleshooting

### Issue: Web app can't connect to API

**Solution:**
- Check `NEXT_PUBLIC_API_URL` in web app service
- Verify API service is running (check logs)
- Ensure CORS_ORIGIN in API includes web app URL

### Issue: API can't connect to MongoDB

**Solution:**
- Verify MongoDB Atlas connection string
- Check if password is URL-encoded (`@` → `%40`)
- Ensure MongoDB Atlas allows connections from anywhere (IP: `0.0.0.0/0`)

### Issue: Redis connection failed

**Solution:**
- Ensure Redis plugin is added to project
- Check if `REDIS_URL` is injected (Railway does this automatically)
- Verify services can access Redis via private network

### Issue: Runner service fails with Docker errors

**Solution:**
- Railway likely doesn't support Docker-in-Docker
- Deploy runner on VPS instead (see Option B above)
- Cost: ~$5-6/month extra for VPS

### Issue: Code execution timeouts

**Solution:**
- Increase `WORKER_CONCURRENCY` values
- Upgrade Railway resources
- Check Docker image size and optimize

---

## 📊 Monitoring

### View Logs
```
Railway Dashboard → Select Service → Logs
```

### Check Queue Status
```
https://your-api.up.railway.app/execution/queue/stats
```

Returns:
```json
{
  "execution": {
    "waiting": 0,
    "active": 2,
    "completed": 1523,
    "failed": 5
  },
  "submission": {
    "waiting": 0,
    "active": 1,
    "completed": 847,
    "failed": 2
  }
}
```

---

## 🔐 Security Checklist

- ✅ JWT_SECRET is strong and unique
- ✅ MongoDB password is URL-encoded
- ✅ .env.local files are NOT in Git
- ✅ GitHub repo is private
- ✅ CORS is set to your web app URL only
- ✅ MongoDB Atlas IP whitelist allows Railway IPs
- ✅ Redis has password protection (Railway handles this)

---

## 🚀 Next Steps After Deployment

1. **Set up custom domain** (optional)
   - Buy domain from Namecheap/GoDaddy
   - Point to Railway app via CNAME
   - Configure in Railway → Settings → Networking

2. **Add monitoring** (optional)
   - Set up Sentry for error tracking
   - Use Railway metrics
   - Configure alerts

3. **Optimize performance**
   - Enable caching
   - Add CDN for static assets
   - Optimize Docker images

4. **Scale as needed**
   - Increase worker concurrency
   - Add more runner replicas
   - Upgrade Railway plan

---

## 📞 Support

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **MongoDB Atlas:** https://www.mongodb.com/docs/atlas/

---

## ✨ Success!

Your Code Runner platform should now be live! 🎉

**Your URLs:**
- Web App: `https://your-web-app.up.railway.app`
- API: `https://your-api.up.railway.app`

Share the web app URL with students and start teaching! 🚀
