#!/bin/bash

# Cleanup script to destroy AWS resources and avoid charges

set -e

if [ ! -f "deployment-info.json" ]; then
    echo "❌ deployment-info.json not found. Cannot proceed with cleanup."
    exit 1
fi

# Read deployment info
REGION=$(cat deployment-info.json | grep -o '"region": "[^"]*' | cut -d'"' -f4)
VPC_ID=$(cat deployment-info.json | grep -o '"vpcId": "[^"]*' | cut -d'"' -f4)
SUBNET_ID=$(cat deployment-info.json | grep -o '"subnetId": "[^"]*' | cut -d'"' -f4)
SG_ID=$(cat deployment-info.json | grep -o '"securityGroupId": "[^"]*' | cut -d'"' -f4)
INSTANCE_ID=$(cat deployment-info.json | grep -o '"instanceId": "[^"]*' | cut -d'"' -f4)
KEY_NAME=$(cat deployment-info.json | grep -o '"keyName": "[^"]*' | cut -d'"' -f4)

echo "🧹 Starting cleanup of AWS resources..."
echo "Region: $REGION"

# Terminate EC2 instance
echo "🖥️ Terminating EC2 instance..."
aws ec2 terminate-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION

# Wait for instance termination
echo "⏳ Waiting for instance termination..."
aws ec2 wait instance-terminated \
    --instance-ids $INSTANCE_ID \
    --region $REGION

echo "✅ Instance terminated"

# Delete Security Group
echo "🔒 Deleting Security Group..."
aws ec2 delete-security-group \
    --group-id $SG_ID \
    --region $REGION

echo "✅ Security Group deleted"

# Get route table ID
ROUTE_TABLE_ID=$(aws ec2 describe-route-tables \
    --filters "Name=vpc-id,Values=$VPC_ID" "Name=association.main,Values=false" \
    --query 'RouteTables[0].RouteTableId' \
    --output text \
    --region $REGION)

# Disassociate and delete route table
if [ "$ROUTE_TABLE_ID" != "None" ]; then
    echo "🛤️ Deleting Route Table..."
    
    # Get association ID
    ASSOCIATION_ID=$(aws ec2 describe-route-tables \
        --route-table-ids $ROUTE_TABLE_ID \
        --query 'RouteTables[0].Associations[0].RouteTableAssociationId' \
        --output text \
        --region $REGION)
    
    if [ "$ASSOCIATION_ID" != "None" ]; then
        aws ec2 disassociate-route-table \
            --association-id $ASSOCIATION_ID \
            --region $REGION
    fi
    
    aws ec2 delete-route-table \
        --route-table-id $ROUTE_TABLE_ID \
        --region $REGION
    
    echo "✅ Route Table deleted"
fi

# Delete Subnet
echo "🏗️ Deleting Subnet..."
aws ec2 delete-subnet \
    --subnet-id $SUBNET_ID \
    --region $REGION

echo "✅ Subnet deleted"

# Detach and delete Internet Gateway
echo "🌍 Deleting Internet Gateway..."
IGW_ID=$(aws ec2 describe-internet-gateways \
    --filters "Name=attachment.vpc-id,Values=$VPC_ID" \
    --query 'InternetGateways[0].InternetGatewayId' \
    --output text \
    --region $REGION)

if [ "$IGW_ID" != "None" ]; then
    aws ec2 detach-internet-gateway \
        --internet-gateway-id $IGW_ID \
        --vpc-id $VPC_ID \
        --region $REGION
    
    aws ec2 delete-internet-gateway \
        --internet-gateway-id $IGW_ID \
        --region $REGION
    
    echo "✅ Internet Gateway deleted"
fi

# Delete VPC
echo "🌐 Deleting VPC..."
aws ec2 delete-vpc \
    --vpc-id $VPC_ID \
    --region $REGION

echo "✅ VPC deleted"

# Delete Key Pair
echo "🔑 Deleting Key Pair..."
aws ec2 delete-key-pair \
    --key-name $KEY_NAME \
    --region $REGION

if [ -f "${KEY_NAME}.pem" ]; then
    rm -f "${KEY_NAME}.pem"
    echo "✅ Local key file deleted"
fi

echo "✅ Key Pair deleted"

# Clean up ECR repositories (optional - uncomment if you want to delete them)
# echo "📦 Deleting ECR repositories..."
# aws ecr delete-repository \
#     --repository-name online-judge-backend \
#     --force \
#     --region $REGION || true
# 
# aws ecr delete-repository \
#     --repository-name online-judge-frontend \
#     --force \
#     --region $REGION || true
# 
# echo "✅ ECR repositories deleted"

# Clean up local files
rm -f deployment-info.json

echo "🎉 Cleanup completed successfully!"
echo "All AWS resources have been deleted to avoid charges."
