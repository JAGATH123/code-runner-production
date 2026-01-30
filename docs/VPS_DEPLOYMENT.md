# VPS Deployment Guide - Backend Only

Complete guide for deploying the Code Runner **backend** (API + Runner) on a VPS.
Frontend will be deployed to Railway separately (see [RAILWAY_WEB_DEPLOYMENT.md](./RAILWAY_WEB_DEPLOYMENT.md)).

## Architecture Overview

```
┌─────────────────────┐
│   Railway           │
│   ┌─────────────┐   │
│   │  Web (Next) │   │  ← Frontend on Railway
│   └──────┬──────┘   │
└──────────┼──────────┘
           │ HTTPS
           ↓
Internet → Nginx (Port 80/443)
            ↓
    API Load Balancer (VPS)
    ├─→ API Instance 1 (Port 4000)
    └─→ API Instance 2 (Port 4001)
            ↓
        Redis Queue (BullMQ)
            ↓
    Runner Workers (2 instances)
    ├─→ Runner 1 → Container Pool (2-5 containers)
    └─→ Runner 2 → Container Pool (2-5 containers)
            ↓
        MongoDB Atlas
```

## Prerequisites

### VPS Requirements
- **OS**: Ubuntu 20.04 LTS or newer
- **RAM**: 4-8GB minimum (8GB recommended)
- **CPU**: 2-4 cores
- **Disk**: 20GB SSD minimum
- **Docker**: Version 20.10+
- **Node.js**: Version 18+ with npm

### Services
- MongoDB Atlas account (free tier works)
- Domain name (optional but recommended)
- SSH access to VPS

## Step-by-Step Deployment

### 1. Prepare VPS Server

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Update system
apt-get update && apt-get upgrade -y

# Install required packages
apt-get install -y git curl build-essential
```

### 2. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Start Docker service
systemctl start docker
systemctl enable docker

# Add user to docker group (replace 'ubuntu' with your username)
usermod -aG docker ubuntu
```

### 3. Install Node.js

```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 4. Install Redis

```bash
# Install Redis
apt-get install -y redis-server

# Configure Redis for production
cat >> /etc/redis/redis.conf << EOF
# Performance tuning
maxmemory 256mb
maxmemory-policy allkeys-lru

# Security
requirepass YOUR_REDIS_PASSWORD_HERE
EOF

# Restart Redis
systemctl restart redis-server
systemctl enable redis-server

# Test Redis
redis-cli -a YOUR_REDIS_PASSWORD_HERE ping
# Should respond: PONG
```

### 5. Install Nginx

```bash
# Install Nginx
apt-get install -y nginx

# Start Nginx
systemctl start nginx
systemctl enable nginx
```

### 6. Clone and Build Project

```bash
# Create app directory
mkdir -p /var/www/code-runner
cd /var/www/code-runner

# Clone your repository (replace with your repo URL)
git clone https://github.com/your-username/code-runner-production.git .

# Install dependencies
npm install

# Install PM2 globally
npm install -g pm2

# Build applications
npm run build
```

### 7. Build Docker Sandbox Image

```bash
# Build Python sandbox image
cd /var/www/code-runner/apps/runner/sandbox
docker build -t python-code-runner .

# Verify image
docker images | grep python-code-runner
```

### 8. Configure Environment Variables

```bash
# Create production .env files
cd /var/www/code-runner

# API environment
cat > apps/api/.env << EOF
NODE_ENV=production
PORT=4000

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/code-runner

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD_HERE

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# Runner environment
cat > apps/runner/.env << EOF
NODE_ENV=production

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/code-runner

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD_HERE

# Container pooling
ENABLE_CONTAINER_POOL=true
POOL_MIN_SIZE=2
POOL_MAX_SIZE=5
POOL_MAX_CONTAINER_AGE_MS=1800000
SANDBOX_IMAGE=python-code-runner

# Worker concurrency
WORKER_CONCURRENCY_EXECUTION=3
WORKER_CONCURRENCY_SUBMISSION=2
EOF
```

### 9. Configure Nginx

```bash
# Update nginx.conf with your domain
nano /var/www/code-runner/nginx.conf
# Change 'your-domain.com' to your actual domain or VPS IP

# Copy to Nginx sites
cp nginx.conf /etc/nginx/sites-available/code-runner

# Enable site
ln -s /etc/nginx/sites-available/code-runner /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

### 10. Start Applications with PM2

```bash
cd /var/www/code-runner

# Start all instances
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup systemd
# Run the command it outputs

# Verify all instances are running
pm2 status
```

**Expected Output:**
```
┌─────┬──────────┬─────────┬─────────┬─────────┬──────────┐
│ id  │ name     │ mode    │ status  │ cpu     │ memory   │
├─────┼──────────┼─────────┼─────────┼─────────┼──────────┤
│ 0   │ api-1    │ fork    │ online  │ 0%      │ 45.2mb   │
│ 1   │ api-2    │ fork    │ online  │ 0%      │ 42.8mb   │
│ 2   │ runner-1 │ fork    │ online  │ 0%      │ 120.5mb  │
│ 3   │ runner-2 │ fork    │ online  │ 0%      │ 118.3mb  │
└─────┴──────────┴─────────┴─────────┴─────────┴──────────┘
```

### 11. Set Up SSL (Optional but Recommended)

```bash
# Install Certbot
apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d your-domain.com

# Certbot will automatically update nginx.conf
# Test renewal
certbot renew --dry-run
```

## Verification

### 1. Check All Services

```bash
# PM2 processes
pm2 status

# Docker containers (should show 4-10 pooled containers)
docker ps

# Redis
redis-cli -a YOUR_REDIS_PASSWORD_HERE ping

# Nginx
systemctl status nginx

# Check logs
pm2 logs --lines 50
```

### 2. Test API Endpoints

```bash
# Health check
curl http://your-vps-ip/health

# Test API (should load balance between instances)
curl http://your-vps-ip/api/health

# Submit test execution
curl -X POST http://your-vps-ip/api/execution/run \
  -H "Content-Type: application/json" \
  -d '{"code": "print(\"Hello from VPS!\")", "input": ""}'
```

### 3. Monitor Container Pool

```bash
# Watch PM2 logs for pool statistics
pm2 logs runner-1 --lines 20

# You should see:
# Container pool initialized with 2 containers
# Container pool statistics: { total: 2, inUse: 0, available: 2 }
```

## Management Commands

### PM2 Commands

```bash
# View status
pm2 status

# View logs (all instances)
pm2 logs

# View logs (specific instance)
pm2 logs api-1

# Restart all
pm2 restart all

# Restart specific instance
pm2 restart api-1

# Stop all
pm2 stop all

# Monitor in real-time
pm2 monit

# Delete all processes
pm2 delete all
```

### Docker Commands

```bash
# List pooled containers
docker ps | grep pool-

# View container pool logs
docker logs <container-id>

# Clean up stopped containers
docker container prune -f

# View resource usage
docker stats
```

### Nginx Commands

```bash
# Test configuration
nginx -t

# Reload configuration
systemctl reload nginx

# Restart Nginx
systemctl restart nginx

# View access logs
tail -f /var/log/nginx/code-runner-access.log

# View error logs
tail -f /var/log/nginx/code-runner-error.log
```

## Scaling Up

### For Higher Load (500+ users)

**Increase Pool Size:**

Edit `ecosystem.config.js`:

```javascript
env: {
  POOL_MIN_SIZE: 5,
  POOL_MAX_SIZE: 10,
  WORKER_CONCURRENCY_EXECUTION: 5,
}
```

Restart runners:
```bash
pm2 restart runner-1 runner-2
```

**Add More Runner Instances:**

Edit `ecosystem.config.js`, add:

```javascript
{
  name: 'runner-3',
  script: './apps/runner/dist/index.js',
  // ... same config as runner-1
}
```

Then:
```bash
pm2 reload ecosystem.config.js
```

## Monitoring

### Set Up PM2 Monitoring

```bash
# Install monitoring module
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# View metrics
pm2 describe api-1
```

### Resource Monitoring

```bash
# CPU and Memory
htop

# Docker resources
docker stats

# Disk usage
df -h
```

## Troubleshooting

### Issue: API instances not starting

```bash
# Check logs
pm2 logs api-1

# Common causes:
# 1. MongoDB connection failed - check MONGODB_URI
# 2. Redis connection failed - check Redis is running
# 3. Port already in use - check: netstat -tulpn | grep :4000
```

### Issue: Runner containers failing health checks

```bash
# Check Docker
systemctl status docker

# Rebuild sandbox image
cd apps/runner/sandbox
docker build -t python-code-runner .

# Test container manually
docker run --rm python-code-runner python -c "print('HEALTH_OK')"
```

### Issue: Nginx 502 Bad Gateway

```bash
# Check if API instances are running
pm2 status

# Check Nginx error logs
tail -f /var/log/nginx/code-runner-error.log

# Test upstream manually
curl http://localhost:4000/health
curl http://localhost:4001/health
```

## Security Checklist

- [ ] Redis password set
- [ ] JWT_SECRET is strong and unique
- [ ] MongoDB uses strong password
- [ ] Firewall configured (UFW)
- [ ] SSL certificate installed
- [ ] Regular security updates enabled
- [ ] SSH key-only authentication
- [ ] Non-root user for application

## Backup Strategy

### Daily Backups

```bash
# Create backup script
cat > /usr/local/bin/backup-code-runner.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/code-runner"
DATE=$(date +%Y%m%d)

# Backup MongoDB (if using local MongoDB)
# mongodump --out $BACKUP_DIR/mongo-$DATE

# Backup Redis
redis-cli -a YOUR_PASSWORD --rdb /var/lib/redis/dump.rdb
cp /var/lib/redis/dump.rdb $BACKUP_DIR/redis-$DATE.rdb

# Backup environment files
tar -czf $BACKUP_DIR/env-$DATE.tar.gz /var/www/code-runner/.env*

# Clean old backups (keep 7 days)
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-code-runner.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-code-runner.sh") | crontab -
```

## Cost Estimate

**Monthly VPS Cost:**
- **Basic** (4GB RAM, 2 CPU): $5-12/month
- **Recommended** (8GB RAM, 4 CPU): $20-40/month

**Total Operating Cost:**
- VPS: $12-40/month
- MongoDB Atlas: $0 (free tier)
- Domain: $10/year
- **Total: ~$12-40/month**

## Next Steps

1. ✅ Deploy to VPS following this guide
2. ✅ Test with production workload
3. ✅ Set up monitoring and alerts
4. ✅ Configure automated backups
5. ✅ Document incident response procedures
