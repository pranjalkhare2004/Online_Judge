#!/bin/bash

# AWS Free Tier Deployment Script for Online Judge Platform
# This script sets up the complete infrastructure on AWS Free Tier

set -e

echo "🚀 Starting AWS Free Tier deployment for Online Judge Platform..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

# Variables
REGION="us-east-1"
VPC_CIDR="10.0.0.0/16"
SUBNET_CIDR="10.0.1.0/24"
KEY_NAME="online-judge-keypair"
INSTANCE_TYPE="t2.micro"  # Free tier eligible
AMI_ID="ami-0c02fb55956c7d316"  # Ubuntu 22.04 LTS (update as needed)

echo "📋 Configuration:"
echo "  Region: $REGION"
echo "  Instance Type: $INSTANCE_TYPE"
echo "  Key Name: $KEY_NAME"

# Create VPC
echo "🌐 Creating VPC..."
VPC_ID=$(aws ec2 create-vpc \
    --cidr-block $VPC_CIDR \
    --query 'Vpc.VpcId' \
    --output text \
    --region $REGION)

aws ec2 create-tags \
    --resources $VPC_ID \
    --tags Key=Name,Value=online-judge-vpc \
    --region $REGION

echo "✅ VPC created: $VPC_ID"

# Create Internet Gateway
echo "🌍 Creating Internet Gateway..."
IGW_ID=$(aws ec2 create-internet-gateway \
    --query 'InternetGateway.InternetGatewayId' \
    --output text \
    --region $REGION)

aws ec2 attach-internet-gateway \
    --vpc-id $VPC_ID \
    --internet-gateway-id $IGW_ID \
    --region $REGION

aws ec2 create-tags \
    --resources $IGW_ID \
    --tags Key=Name,Value=online-judge-igw \
    --region $REGION

echo "✅ Internet Gateway created: $IGW_ID"

# Create Subnet
echo "🏗️ Creating Subnet..."
SUBNET_ID=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block $SUBNET_CIDR \
    --availability-zone ${REGION}a \
    --query 'Subnet.SubnetId' \
    --output text \
    --region $REGION)

aws ec2 create-tags \
    --resources $SUBNET_ID \
    --tags Key=Name,Value=online-judge-subnet \
    --region $REGION

echo "✅ Subnet created: $SUBNET_ID"

# Create Route Table
echo "🛤️ Creating Route Table..."
ROUTE_TABLE_ID=$(aws ec2 create-route-table \
    --vpc-id $VPC_ID \
    --query 'RouteTable.RouteTableId' \
    --output text \
    --region $REGION)

aws ec2 create-route \
    --route-table-id $ROUTE_TABLE_ID \
    --destination-cidr-block 0.0.0.0/0 \
    --gateway-id $IGW_ID \
    --region $REGION

aws ec2 associate-route-table \
    --subnet-id $SUBNET_ID \
    --route-table-id $ROUTE_TABLE_ID \
    --region $REGION

aws ec2 create-tags \
    --resources $ROUTE_TABLE_ID \
    --tags Key=Name,Value=online-judge-rt \
    --region $REGION

echo "✅ Route Table created: $ROUTE_TABLE_ID"

# Create Security Group
echo "🔒 Creating Security Group..."
SG_ID=$(aws ec2 create-security-group \
    --group-name online-judge-sg \
    --description "Security group for Online Judge platform" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text \
    --region $REGION)

# Add security group rules
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --region $REGION

aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region $REGION

aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --region $REGION

aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 3000 \
    --cidr 0.0.0.0/0 \
    --region $REGION

aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 5000 \
    --cidr 0.0.0.0/0 \
    --region $REGION

aws ec2 create-tags \
    --resources $SG_ID \
    --tags Key=Name,Value=online-judge-sg \
    --region $REGION

echo "✅ Security Group created: $SG_ID"

# Create Key Pair
echo "🔑 Creating Key Pair..."
if aws ec2 describe-key-pairs --key-names $KEY_NAME --region $REGION &> /dev/null; then
    echo "⚠️ Key pair $KEY_NAME already exists"
else
    aws ec2 create-key-pair \
        --key-name $KEY_NAME \
        --query 'KeyMaterial' \
        --output text \
        --region $REGION > ${KEY_NAME}.pem
    
    chmod 400 ${KEY_NAME}.pem
    echo "✅ Key pair created: ${KEY_NAME}.pem"
fi

# Create ECR repositories
echo "📦 Creating ECR repositories..."
aws ecr create-repository \
    --repository-name online-judge-backend \
    --region $REGION || echo "Backend repository may already exist"

aws ecr create-repository \
    --repository-name online-judge-frontend \
    --region $REGION || echo "Frontend repository may already exist"

echo "✅ ECR repositories created"

# Launch EC2 Instance
echo "🖥️ Launching EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SG_ID \
    --subnet-id $SUBNET_ID \
    --associate-public-ip-address \
    --user-data file://user-data.sh \
    --query 'Instances[0].InstanceId' \
    --output text \
    --region $REGION)

aws ec2 create-tags \
    --resources $INSTANCE_ID \
    --tags Key=Name,Value=online-judge-server \
    --region $REGION

echo "✅ EC2 instance launched: $INSTANCE_ID"

# Wait for instance to be running
echo "⏳ Waiting for instance to be running..."
aws ec2 wait instance-running \
    --instance-ids $INSTANCE_ID \
    --region $REGION

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text \
    --region $REGION)

echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Summary:"
echo "  VPC ID: $VPC_ID"
echo "  Subnet ID: $SUBNET_ID"
echo "  Security Group ID: $SG_ID"
echo "  Instance ID: $INSTANCE_ID"
echo "  Public IP: $PUBLIC_IP"
echo ""
echo "🔗 Next steps:"
echo "  1. SSH into the instance: ssh -i ${KEY_NAME}.pem ubuntu@${PUBLIC_IP}"
echo "  2. Frontend will be available at: http://${PUBLIC_IP}:3000"
echo "  3. Backend API will be available at: http://${PUBLIC_IP}:5000"
echo ""
echo "⚠️ Important: Save the ${KEY_NAME}.pem file securely!"

# Save deployment info
cat > deployment-info.json << EOF
{
  "region": "$REGION",
  "vpcId": "$VPC_ID",
  "subnetId": "$SUBNET_ID",
  "securityGroupId": "$SG_ID",
  "instanceId": "$INSTANCE_ID",
  "publicIp": "$PUBLIC_IP",
  "keyName": "$KEY_NAME",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "💾 Deployment info saved to deployment-info.json"
