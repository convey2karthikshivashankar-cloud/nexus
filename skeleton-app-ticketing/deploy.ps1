# Skeleton Ticketing App Deployment
# UNIQUE stack - will NOT affect existing demos

Write-Host "=== Skeleton Ticketing App Deployment ===" -ForegroundColor Magenta
Write-Host "Stack: SkeletonTicketingStack (UNIQUE - no conflicts)" -ForegroundColor Green

# Build shared package first
Write-Host "`nBuilding @nexus/shared..." -ForegroundColor Yellow
Push-Location ../packages/shared
npm install 2>$null
npm run build 2>$null
Pop-Location

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
npm install

# Build lambdas
Write-Host "`nBuilding lambdas..." -ForegroundColor Yellow
node scripts/build-lambdas.js

# Deploy CDK stack
Write-Host "`nDeploying CDK stack..." -ForegroundColor Yellow
npx cdk deploy --require-approval never

Write-Host "`n=== Deployment Complete ===" -ForegroundColor Green
