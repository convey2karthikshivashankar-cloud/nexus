# Nexus Command Service - Deployment Script
# Skeleton Crew App #1

Write-Host "🔵 Deploying Nexus Command Service..." -ForegroundColor Blue
Write-Host ""

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install

# Deploy CDK stack
Write-Host ""
Write-Host "🚀 Deploying CDK stack..." -ForegroundColor Cyan
npx cdk deploy --require-approval never

# Get outputs
Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Stack Outputs:" -ForegroundColor Yellow
aws cloudformation describe-stacks --stack-name NexusCommandServiceStack --query "Stacks[0].Outputs" --output table

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Magenta
Write-Host "1. Copy the API URL from the outputs above"
Write-Host "2. Update app-command-service/ui/src/App.tsx with the API URL"
Write-Host "3. Build and deploy the UI:"
Write-Host "   cd ui && npm install && npm run build"
Write-Host "   aws s3 sync dist/ s3://nexus-command-ui-YOUR_ACCOUNT_ID"
