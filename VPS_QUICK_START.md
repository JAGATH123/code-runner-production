# VPS Quick Start Guide

Simple step-by-step guide to get your VPS ready and deploy the backend.

## What You Need

- Ubuntu 20.04+ VPS (4GB RAM minimum, 8GB recommended)
- SSH access (root or sudo user)
- MongoDB Atlas connection string
- 20-30 minutes

---

## Part 1: Install Prerequisites (5 minutes)

This installs Docker, Node.js, Redis, Nginx, and PM2.

### Step 1: SSH into your VPS

```bash
ssh root@YOUR_VPS_IP
```

Or if using a regular user with sudo:
```bash
ssh yourusername@YOUR_VPS_IP
```

### Step 2: Download the prerequisites script

```bash
# Download from your repository
wget https://raw.githubusercontent.com/your-username/code-runner-production/main/vps-setup-prerequisites.sh

# Or create it manually
nano vps-setup-prerequisites.sh
# (paste the script content and save with Ctrl+X, Y, Enter)
```

### Step 3: Run the script

```bash
chmod +x vps-setup-prerequisites.sh
sudo bash vps-setup-prerequisites.sh
```

**This will install:**
- ✅ Docker (for running code containers)
- ✅ Node.js 18 (for running API and Runner)
- ✅ Redis (for job queue)
- ✅ Nginx (for load balancing)
- ✅ PM2 (for process management)
- ✅ Firewall (UFW with ports 22, 80, 443 open)

**At the end, you'll see:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Redis Password: abc123xyz789... (random string)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**🔴 IMPORTANT: Copy and save this Redis password!** You'll need it in the next steps.

---

## Part 2: Verify Installation (2 minutes)

Check that everything is running:

```bash
# Check Docker
docker --version
docker ps

# Check Node.js
node --version
npm --version

# Check Redis
redis-cli -a YOUR_REDIS_PASSWORD ping
# Should respond: PONG

# Check Nginx
systemctl status nginx

# Check PM2
pm2 --version
```

All should be working! ✅

---

## Part 3: Deploy Backend Code (10 minutes)

### Step 1: Create project directory

```bash
mkdir -p /var/www/code-runner
cd /var/www/code-runner
```

### Step 2: Clone your repository

```bash
# If using HTTPS
git clone https://github.com/your-username/code-runner-production.git .

# If using SSH (need to set up SSH key first)
git clone git@github.com:your-username/code-runner-production.git .
```

### Step 3: Install Node dependencies

```bash
# Install root dependencies
npm install

# Install and build shared package
cd packages/shared
npm install
npm run build
cd ../..

# Install and build API
cd apps/api
npm install
npm run build
cd ../..

# Install and build Runner
cd apps/runner
npm install
npm run build
cd ../..
```

### Step 4: Build Docker sandbox image

```bash
cd apps/runner/sandbox
docker build -t python-code-runner .
cd ../../..

# Verify image was built
docker images | grep python-code-runner
```

### Step 5: Configure environment variables

**Create API .env file:**

```bash
nano apps/api/.env
```

Paste this and fill in your values:

```bash
NODE_ENV=production
PORT=4000

# MongoDB Atlas (get from Atlas dashboard)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/code-runner?retryWrites=true&w=majority

# Redis (use password from Part 1)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<paste_redis_password_from_part_1>

# JWT Secret (generate new one)
# Run: openssl rand -base64 32
JWT_SECRET=<generate_new_secret>

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

Save with `Ctrl+X`, `Y`, `Enter`

**Create Runner .env file:**

```bash
nano apps/runner/.env
```

Paste this:

```bash
NODE_ENV=production

# MongoDB Atlas (same as API)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/code-runner?retryWrites=true&w=majority

# Redis (same password as API)
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

Save with `Ctrl+X`, `Y`, `Enter`

### Step 6: Configure Nginx

```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/code-runner

# Enable the site
sudo ln -sf /etc/nginx/sites-available/code-runner /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Edit the config to add your VPS IP or domain
sudo nano /etc/nginx/sites-available/code-runner
# Change 'your-domain.com' to your VPS IP or domain

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 7: Start services with PM2

```bash
# Make sure you're in the project root
cd /var/www/code-runner

# Start all services
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Run the command it outputs (usually starts with 'sudo env...')

# Check status
pm2 status
```

**You should see 4 processes running:**
```
┌─────┬──────────┬─────────┬─────────┐
│ id  │ name     │ status  │ cpu     │
├─────┼──────────┼─────────┼─────────┤
│ 0   │ api-1    │ online  │ 0%      │
│ 1   │ api-2    │ online  │ 0%      │
│ 2   │ runner-1 │ online  │ 0%      │
│ 3   │ runner-2 │ online  │ 0%      │
└─────┴──────────┴─────────┴─────────┘
```

### Step 8: Verify everything is working

```bash
# Check PM2 logs
pm2 logs --lines 20

# Check Docker containers (should see pool containers)
docker ps

# Test API endpoint
curl http://localhost/api/health
# Should return some health status

# Test from outside
curl http://YOUR_VPS_IP/api/health
```

---

## Part 4: Deploy Frontend to Railway (5 minutes)

Now that backend is running on VPS, deploy frontend to Railway:

### Step 1: Go to Railway

1. Visit [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your `code-runner-production` repository

### Step 2: Configure environment variables

In Railway dashboard, go to "Variables" and add:

```
NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP/api
NODE_ENV=production
```

### Step 3: Deploy

Railway will automatically build and deploy. Wait 2-3 minutes.

You'll get a URL like: `https://code-runner-abc123.railway.app`

### Step 4: Update CORS on VPS

Back on your VPS, update the API to allow Railway domain:

```bash
cd /var/www/code-runner/apps/api

# Edit the index.ts source file
nano src/index.ts
```

Find the CORS section and update it:

```typescript
app.use(cors({
  origin: [
    'https://code-runner-abc123.railway.app',  // Your Railway URL
    'http://localhost:3000'                      // Keep for local dev
  ],
  credentials: true
}));
```

Save, then rebuild and restart:

```bash
npm run build
cd ../..
pm2 restart api-1 api-2
```

---

## Testing the Full Stack

### Test 1: Frontend loads
Open: `https://code-runner-abc123.railway.app`

Should see your web interface. ✅

### Test 2: API connection
Open browser console on Railway URL and run:

```javascript
fetch('http://YOUR_VPS_IP/api/health')
  .then(r => r.text())
  .then(console.log)
```

Should see response. ✅

### Test 3: Code execution
1. Go to the compiler page on Railway frontend
2. Write some Python code: `print("Hello from VPS!")`
3. Click Run
4. Should see output

On VPS, check logs:
```bash
pm2 logs runner-1 --lines 50
```

Should see execution logs. ✅

---

## Common Issues

### Issue: "Connection refused" when testing API

**Fix:**
```bash
# Check if Nginx is running
sudo systemctl status nginx

# Check if API instances are running
pm2 status

# Check firewall
sudo ufw status
# Should show port 80 allowed
```

### Issue: "Container pool not initializing"

**Fix:**
```bash
# Check Docker is running
docker ps

# Rebuild sandbox image
cd /var/www/code-runner/apps/runner/sandbox
docker build -t python-code-runner .

# Restart runners
pm2 restart runner-1 runner-2
```

### Issue: "Redis connection failed"

**Fix:**
```bash
# Check Redis is running
systemctl status redis-server

# Test Redis with password
redis-cli -a YOUR_REDIS_PASSWORD ping

# Check .env files have correct REDIS_PASSWORD
cat apps/api/.env | grep REDIS_PASSWORD
cat apps/runner/.env | grep REDIS_PASSWORD
```

---

## Quick Commands Reference

### PM2 Commands
```bash
pm2 status              # Show all processes
pm2 logs                # Show all logs
pm2 logs api-1          # Show logs for specific process
pm2 restart all         # Restart all
pm2 restart api-1       # Restart specific process
pm2 monit               # Real-time monitoring
```

### Docker Commands
```bash
docker ps                           # Show running containers
docker ps | grep pool-              # Show pool containers
docker stats                        # Resource usage
docker logs <container-id>          # Container logs
```

### System Commands
```bash
htop                    # CPU/Memory usage
df -h                   # Disk space
netstat -tulpn          # Open ports
```

---

## What's Next?

- ✅ Set up SSL certificate with Let's Encrypt (optional but recommended)
- ✅ Set up monitoring and alerting
- ✅ Configure automated backups
- ✅ Add custom domain

---

**Deployment complete!** 🎉

Your architecture:
- **Frontend**: Railway (https://code-runner-abc123.railway.app)
- **Backend**: VPS (http://YOUR_VPS_IP/api)
- **Database**: MongoDB Atlas
- **Queue**: Redis on VPS
- **Containers**: Docker pool on VPS

**Total cost: ~$12-40/month** (VPS only, Railway free tier)
