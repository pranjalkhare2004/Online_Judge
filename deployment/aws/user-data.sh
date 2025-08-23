#!/bin/bash

# User Data script for EC2 instance
# This script runs when the instance first boots

# Update system
apt-get update -y
apt-get upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install Docker
apt-get install -y docker.io
systemctl start docker
systemctl enable docker
usermod -aG docker ubuntu

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install AWS CLI
apt-get install -y awscli

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt-get update
apt-get install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# Install PM2 globally
npm install -g pm2

# Install Nginx
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx

# Create application directory
mkdir -p /home/ubuntu/online-judge
chown ubuntu:ubuntu /home/ubuntu/online-judge

# Create nginx configuration for reverse proxy
cat > /etc/nginx/sites-available/online-judge << 'EOF'
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
ln -s /etc/nginx/sites-available/online-judge /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Create deployment script
cat > /home/ubuntu/deploy-app.sh << 'EOF'
#!/bin/bash

cd /home/ubuntu/online-judge

# Clone or update repository
if [ ! -d ".git" ]; then
    git clone https://github.com/your-username/online-judge.git .
else
    git pull origin main
fi

# Deploy Backend
cd Backend
npm ci --only=production
pm2 stop online-judge-backend || true
pm2 start ecosystem.config.js
pm2 save

# Deploy Frontend
cd ../ONLINE-JUDGE-FRONTEND
npm ci --only=production
npm run build
pm2 stop online-judge-frontend || true
pm2 start npm --name "online-judge-frontend" -- start
pm2 save

echo "Deployment completed!"
EOF

chmod +x /home/ubuntu/deploy-app.sh
chown ubuntu:ubuntu /home/ubuntu/deploy-app.sh

# Create log rotation
cat > /etc/logrotate.d/online-judge << 'EOF'
/home/ubuntu/online-judge/Backend/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 0644 ubuntu ubuntu
    postrotate
        pm2 reload online-judge-backend
    endscript
}
EOF

# Set up automatic security updates
echo 'Unattended-Upgrade::Automatic-Reboot "false";' >> /etc/apt/apt.conf.d/50unattended-upgrades
systemctl enable unattended-upgrades

# Create startup script to ensure services start on boot
cat > /etc/systemd/system/online-judge.service << 'EOF'
[Unit]
Description=Online Judge Platform
After=network.target mongod.service

[Service]
Type=forking
User=ubuntu
WorkingDirectory=/home/ubuntu/online-judge
ExecStart=/usr/bin/pm2 resurrect
ExecReload=/usr/bin/pm2 reload all
ExecStop=/usr/bin/pm2 kill

[Install]
WantedBy=multi-user.target
EOF

systemctl enable online-judge.service

# Install fail2ban for security
apt-get install -y fail2ban
systemctl start fail2ban
systemctl enable fail2ban

# Configure firewall
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

echo "Server setup completed!" > /var/log/user-data.log
