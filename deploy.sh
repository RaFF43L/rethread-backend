#!/bin/bash
# Usage: ./deploy.sh <EC2_USER> <EC2_HOST> <PATH_TO_PEM>
# Example: ./deploy.sh ec2-user 1.2.3.4 ~/.ssh/my-key.pem

EC2_USER=${1:?missing EC2_USER}
EC2_HOST=${2:?missing EC2_HOST}
PEM=${3:?missing PEM path}

SSH="ssh -i $PEM -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST"
SCP="scp -i $PEM -o StrictHostKeyChecking=no"

echo "→ Copying .env..."
$SCP .env $EC2_USER@$EC2_HOST:~/rethread-backend/.env

echo "→ Pulling latest code..."
$SSH "cd ~/rethread-backend && git pull"

echo "→ Restarting containers..."
$SSH "cd ~/rethread-backend && docker compose up -d --build"

echo "✓ Deploy done"
