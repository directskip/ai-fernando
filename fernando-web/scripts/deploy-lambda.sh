#!/bin/bash

# Deploy Claude Code Runner Lambda Function
# Usage: ./scripts/deploy-lambda.sh

set -e

echo "Building Lambda function..."

# Navigate to lambda directory
cd lambda/claude-code-runner

# Install dependencies
echo "Installing dependencies..."
npm install --production

# Create deployment package
echo "Creating deployment package..."
zip -r function.zip . -x "*.git*" -x "node_modules/@aws-sdk/*"

# Deploy to AWS Lambda
echo "Deploying to AWS Lambda..."
FUNCTION_NAME="claude-code-runner"
REGION="us-east-1"

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>/dev/null; then
  echo "Updating existing function..."
  aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://function.zip \
    --region $REGION
else
  echo "Creating new function..."
  aws lambda create-function \
    --function-name $FUNCTION_NAME \
    --runtime nodejs18.x \
    --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
    --handler index.handler \
    --zip-file fileb://function.zip \
    --region $REGION \
    --timeout 30 \
    --memory-size 512 \
    --environment Variables="{SESSIONS_TABLE=claude-code-sessions,MESSAGES_TABLE=claude-code-messages}"
fi

# Clean up
echo "Cleaning up..."
rm function.zip

echo "Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Configure API Gateway to trigger this Lambda function"
echo "2. Set the ANTHROPIC_API_KEY environment variable"
echo "3. Update the frontend API URL to point to the API Gateway endpoint"
