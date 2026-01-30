#!/bin/bash
# VPS Deployment Script for Code Runner Platform

set -e  # Exit on any error

echo "🚀 Starting Code Runner VPS Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on VPS (Linux)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo -e "${RED}❌ This script is for Linux VPS deployment only${NC}"
    echo "Run this on your VPS server, not on Windows"
    exit 1
fi

echo -e "${YELLOW}📦 Step 1: Installing system dependencies...${NC}"
sudo apt-get update
sudo apt-get install -y docker.io docker-compose nginx redis-server

echo -e "${YELLOW}🐳 Step 2: Setting up Docker...${NC}"
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

echo -e "${YELLOW}🔧 Step 3: Building Docker sandbox image...${NC}"
cd apps/runner/sandbox
docker build -t python-code-runner .
cd ../../..

echo -e "${YELLOW}📦 Step 4: Installing Node.js dependencies...${NC}"
npm install
cd apps/api && npm install && cd ../..
cd apps/runner && npm install && cd ../..
cd apps/web && npm install && cd ../..

echo -e "${YELLOW}🏗️  Step 5: Building TypeScript applications...${NC}"
npm run build

echo -e "${YELLOW}🔐 Step 6: Setting up Redis...${NC}"
sudo systemctl start redis-server
sudo systemctl enable redis-server
# Set Redis password
sudo redis-cli CONFIG SET requirepass "$(openssl rand -base64 32)"
echo -e "${GREEN}✅ Redis password set (check /etc/redis/redis.conf)${NC}"

echo -e "${YELLOW}🌐 Step 7: Configuring Nginx...${NC}"
sudo cp nginx.conf /etc/nginx/sites-available/code-runner
sudo ln -sf /etc/nginx/sites-available/code-runner /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

echo -e "${YELLOW}📋 Step 8: Installing PM2 globally...${NC}"
sudo npm install -g pm2

echo -e "${YELLOW}🚀 Step 9: Starting applications with PM2...${NC}"
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo -e "${YELLOW}📊 Step 10: Setting up PM2 monitoring...${NC}"
pm2 install pm2-logrotate

echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "1. Configure .env file with production values"
echo "2. Update nginx.conf with your domain name"
echo "3. Set up SSL with: sudo certbot --nginx -d your-domain.com"
echo "4. Check status: pm2 status"
echo "5. View logs: pm2 logs"
echo "6. Monitor: pm2 monit"
echo ""
echo "🔗 Your API will be available at: http://your-vps-ip"
