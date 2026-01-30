# Deploying Web Frontend to Railway

Quick guide for deploying the Next.js frontend to Railway.

## Prerequisites

- Railway account (free tier works)
- GitHub repository with your code
- VPS backend already deployed and running

## Step-by-Step Deployment

### 1. Connect to Railway

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your `code-runner-production` repository

### 2. Configure Build Settings

Railway should auto-detect Next.js, but verify:

**Root Directory**: `apps/web`

**Build Command**:
```bash
npm install && npm run build
```

**Start Command**:
```bash
npm run start
```

**Port**: Railway auto-detects port 3000 (from Next.js)

### 3. Set Environment Variables

In Railway dashboard, add these environment variables:

```bash
# API endpoint (replace with your VPS IP or domain)
NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP/api

# Or if you set up a domain:
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Node environment
NODE_ENV=production
```

**How to add env vars in Railway:**
1. Go to your project
2. Click "Variables" tab
3. Click "New Variable"
4. Add each variable

### 4. Deploy

Railway will automatically deploy when you:
- Push to GitHub (if auto-deploy enabled)
- Click "Deploy" in Railway dashboard

**Deployment takes 2-3 minutes**

### 5. Get Your Frontend URL

After deployment:
1. Go to "Settings" tab
2. Find "Domains" section
3. Railway provides: `your-app-name.railway.app`
4. Optionally add custom domain

## Testing Deployment

### Check if frontend is running:

```bash
curl https://your-app-name.railway.app
```

### Check if it can reach backend API:

Open browser console on your Railway URL and check:
```javascript
fetch('http://YOUR_VPS_IP/api/health')
  .then(r => r.text())
  .then(console.log)
```

## Configuration Files for Railway

Your repository already includes:

- `railway.json` - Railway build configuration
- `apps/web/package.json` - Build scripts
- `apps/web/next.config.mjs` - Next.js configuration

No changes needed!

## Common Issues

### Issue: "Cannot connect to API"

**Cause**: CORS or wrong API URL

**Fix**: Check `NEXT_PUBLIC_API_URL` in Railway env vars

Also update API CORS settings in `apps/api/src/index.ts`:

```typescript
app.use(cors({
  origin: [
    'https://your-app-name.railway.app',
    'http://localhost:3000'
  ]
}));
```

### Issue: "Build failed"

**Cause**: Missing dependencies or build errors

**Fix**: Check Railway logs for specific error

Common fixes:
```bash
# If build fails, check package.json scripts
npm run build  # Should work locally first
```

### Issue: "502 Bad Gateway"

**Cause**: Backend API not responding

**Fix**:
1. Check VPS is running: `pm2 status`
2. Check VPS firewall allows port 80/443
3. Test API directly: `curl http://YOUR_VPS_IP/api/health`

## CORS Configuration

Since frontend and backend are on different domains, configure CORS:

**On VPS** - Edit `apps/api/src/index.ts`:

```typescript
import cors from 'cors';

app.use(cors({
  origin: [
    'https://your-app-name.railway.app',  // Railway frontend
    'http://localhost:3000',               // Local development
  ],
  credentials: true,
}));
```

Rebuild and restart API:
```bash
cd apps/api
npm run build
pm2 restart api-1 api-2
```

## Environment Variables Reference

### Required on Railway (Web):

| Variable | Example | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://123.45.67.89/api` | VPS API endpoint |
| `NODE_ENV` | `production` | Environment |

### Required on VPS (API):

| Variable | Example | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB Atlas |
| `REDIS_HOST` | `localhost` | Local Redis |
| `REDIS_PASSWORD` | `abc123...` | Redis password |
| `JWT_SECRET` | `xyz789...` | JWT signing key |

### Required on VPS (Runner):

| Variable | Example | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB Atlas |
| `REDIS_HOST` | `localhost` | Local Redis |
| `REDIS_PASSWORD` | `abc123...` | Redis password |
| `ENABLE_CONTAINER_POOL` | `true` | Enable pooling |
| `POOL_MIN_SIZE` | `2` | Min containers |
| `POOL_MAX_SIZE` | `5` | Max containers |

## Custom Domain (Optional)

To use your own domain with Railway:

1. Buy domain (Namecheap, Cloudflare, etc.)
2. In Railway: Settings → Domains → Add Domain
3. Add CNAME record in your DNS:
   ```
   Type: CNAME
   Name: www (or @)
   Value: your-app-name.railway.app
   ```
4. Wait for DNS propagation (5-30 minutes)

Railway automatically provisions SSL!

## Monitoring

### View Logs:
Railway dashboard → "Deployments" → Click deployment → "View Logs"

### Check Resource Usage:
Railway dashboard → "Metrics" tab

### Restart Service:
Railway dashboard → "Deployments" → Click "Redeploy"

## Cost Estimate

**Railway Free Tier:**
- $5 free credits/month
- Next.js web app uses ~$3-4/month
- **Enough for 100-200 users**

If you exceed free tier:
- Pay-as-you-go: ~$5-10/month for web

**Total Monthly Cost:**
- VPS: $12-40
- Railway Web: $0-10
- MongoDB Atlas: $0
- **Total: $12-50/month**

## Next Steps After Deployment

1. ✅ Test all features on Railway URL
2. ✅ Update CORS on VPS API
3. ✅ Set up custom domain (optional)
4. ✅ Enable Railway auto-deploy from GitHub
5. ✅ Monitor logs for errors

## Rollback

If deployment fails:

1. Railway dashboard → "Deployments"
2. Find previous working deployment
3. Click "Redeploy"

Or rollback in git:
```bash
git revert HEAD
git push
```
Railway auto-deploys the rollback.
