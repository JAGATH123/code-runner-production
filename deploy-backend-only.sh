#!/bin/bash
# VPS Deployment Script - Backend Only (API + Runner)
# Frontend will be deployed to Railway separately

set -e  # Exit on any error

echo "🚀 Deploying Code Runner Backend to VPS..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running on Linux
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo -e "${RED}❌ This script is for Linux VPS only${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Step 1: Installing system dependencies...${NC}"
sudo apt-get update
sudo apt-get install -y docker.io nginx redis-server curl build-essential

echo -e "${YELLOW}🐳 Step 2: Setting up Docker...${NC}"
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

echo -e "${YELLOW}🔧 Step 3: Setting up Redis...${NC}"
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Generate Redis password
REDIS_PASSWORD=$(openssl rand -base64 32)
echo "requirepass $REDIS_PASSWORD" | sudo tee -a /etc/redis/redis.conf
sudo systemctl restart redis-server

echo -e "${GREEN}✅ Redis password: $REDIS_PASSWORD${NC}"
echo -e "${YELLOW}⚠️  Save this password for .env configuration!${NC}"

echo -e "${YELLOW}🏗️  Step 4: Building backend applications...${NC}"

# Build shared package
echo "Building shared package..."
cd packages/shared
npm install
npm run build
cd ../..

# Build API
echo "Building API..."
cd apps/api
npm install
npm run build
cd ../..

# Build Runner
echo "Building Runner..."
cd apps/runner
npm install
npm run build
cd ../..

echo -e "${YELLOW}🐳 Step 5: Building Docker sandbox image...${NC}"
cd apps/runner/sandbox
docker build -t python-code-runner .
cd ../../..

echo -e "${YELLOW}📋 Step 6: Installing PM2...${NC}"
sudo npm install -g pm2

echo -e "${YELLOW}🌐 Step 7: Configuring Nginx...${NC}"
sudo cp nginx.conf /etc/nginx/sites-available/code-runner
sudo ln -sf /etc/nginx/sites-available/code-runner /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo -e "${GREEN}✅ Backend Deployment Complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "1. Create .env files for API and Runner with:"
echo "   - MONGODB_URI (from Atlas)"
echo "   - REDIS_PASSWORD: $REDIS_PASSWORD"
echo "   - JWT_SECRET (generate with: openssl rand -base64 32)"
echo ""
echo "2. Start services:"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "3. Deploy frontend to Railway with env var:"
echo "   NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP/api"
echo ""
echo "4. Check status:"
echo "   pm2 status"
echo "   pm2 logs"
