# 🚀 Quick Setup Guide

This guide will help you deploy the Online Judge Platform quickly.

## 🏠 Local Development Setup

### Prerequisites
- Node.js 18+
- MongoDB 5+
- Docker
- Git

### Quick Start (5 minutes)
```bash
# 1. Clone and setup
git clone https://github.com/your-username/online-judge.git
cd online-judge

# 2. Backend setup
cd Backend
npm install
cp .env.example .env
# Edit .env: set MONGODB_URI, JWT_SECRET
npm run dev

# 3. Frontend setup (new terminal)
cd ../ONLINE-JUDGE-FRONTEND
npm install
cp .env.example .env.local
# Edit .env.local: set NEXTAUTH_SECRET, NEXT_PUBLIC_API_URL
npm run dev
```

**Access:** http://localhost:3000

## ☁️ AWS Free Tier Deployment

### One-Command Deployment
```bash
cd deployment/aws
./deploy.sh
```

This creates:
- ✅ Complete AWS infrastructure
- ✅ EC2 t2.micro instance (free tier)
- ✅ Automatic application deployment
- ✅ Nginx reverse proxy
- ✅ SSL-ready configuration

### Manual AWS Setup

#### 1. AWS Prerequisites
```bash
# Install AWS CLI
aws configure
# Enter: Access Key, Secret Key, Region (us-east-1), Output (json)
```

#### 2. Deploy Infrastructure
```bash
cd deployment/aws
chmod +x deploy.sh
./deploy.sh
```

#### 3. Configure GitHub Secrets
Add these secrets to your GitHub repository:
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
EC2_HOST (from deployment output)
EC2_USERNAME=ubuntu
EC2_SSH_KEY (contents of .pem file)
ECR_REGISTRY (from deployment output)
MONGODB_URI=mongodb://localhost:27017/online-judge
JWT_SECRET=your-secret-key
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://your-domain.com
NEXT_PUBLIC_API_URL=http://your-domain.com/api
CORS_ORIGIN=http://your-domain.com
```

#### 4. Test Deployment
```bash
# SSH into your instance
ssh -i online-judge-keypair.pem ubuntu@YOUR_PUBLIC_IP

# Check services
pm2 status
docker ps
sudo systemctl status nginx
```

## 🔧 Configuration Options

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/online-judge
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (.env.local)
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
NEXT_PUBLIC_API_URL=http://localhost:5000/api
MONGODB_URI=mongodb://localhost:27017/online-judge
```

## 📊 Monitoring & Maintenance

### Check Application Status
```bash
# PM2 processes
pm2 status
pm2 logs

# Docker containers
docker ps
docker logs [container-id]

# System resources
htop
df -h
```

### Update Application
```bash
cd /home/ubuntu/online-judge
git pull origin main
./deploy-app.sh
```

## 🆘 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Kill process on port
sudo lsof -ti:3000 | xargs sudo kill -9
sudo lsof -ti:5000 | xargs sudo kill -9
```

#### 2. MongoDB Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod
sudo systemctl start mongod
```

#### 3. Docker Permission Issues
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### 4. Nginx Issues
```bash
# Check Nginx status
sudo systemctl status nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Clean Deployment
```bash
# Start fresh
./cleanup.sh
./deploy.sh
```

## 💰 Cost Optimization

### AWS Free Tier Limits
- ✅ EC2 t2.micro: 750 hours/month
- ✅ EBS: 30GB storage
- ✅ Data Transfer: 15GB/month
- ✅ ECR: 500MB storage

### Stay Within Free Tier
- Use t2.micro instances only
- Monitor data transfer
- Set up billing alerts
- Use cleanup script when not needed

```bash
# Stop instances to save hours
aws ec2 stop-instances --instance-ids i-1234567890abcdef0

# Start when needed
aws ec2 start-instances --instance-ids i-1234567890abcdef0
```

## 📈 Scaling Options

### Performance Optimization
1. **Database**: MongoDB Atlas (free tier)
2. **CDN**: CloudFlare (free)
3. **Monitoring**: AWS CloudWatch (free tier)
4. **SSL**: Let's Encrypt (free)

### Production Scaling
1. **Load Balancer**: Application Load Balancer
2. **Auto Scaling**: EC2 Auto Scaling Groups
3. **Database**: MongoDB replica sets
4. **Caching**: Redis/ElastiCache

## 🔗 Useful Links

- [AWS Free Tier](https://aws.amazon.com/free/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/your-username/online-judge/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-username/online-judge/discussions)
- 📧 **Email**: support@onlinejudge.com

---

⭐ **Star the repository** if this helped you!
