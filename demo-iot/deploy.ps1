# Deploy Nexus IoT Demo
# This script deploys both the backend (CDK) and frontend (UI)

$ErrorActionPreference = "Stop"

Write-Host "🌡️ Deploying Nexus IoT Demo..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Install dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
npm install

# Step 2: Build lambdas
Write-Host "🔨 Building Lambda functions..." -ForegroundColor Yellow
npm run build

# Step 3: Deploy CDK stack
Write-Host "☁️ Deploying CDK stack..." -ForegroundColor Yellow
npx cdk deploy --require-approval never

# Step 4: Get API URL from stack outputs
Write-Host "🔍 Getting API URL..." -ForegroundColor Yellow
$stackOutput = aws cloudformation describe-stacks --stack-name NexusIoTDemoStack --query "Stacks[0].Outputs" --output json | ConvertFrom-Json
$apiUrl = ($stackOutput | Where-Object { $_.OutputKey -eq "ApiUrl" }).OutputValue
$uiUrl = ($stackOutput | Where-Object { $_.OutputKey -eq "UIUrl" }).OutputValue

if (-not $apiUrl) {
    Write-Host "❌ Could not get API URL from stack outputs" -ForegroundColor Red
    exit 1
}

Write-Host "📡 API URL: $apiUrl" -ForegroundColor Green

# Step 5: Update UI with API URL
Write-Host "🔧 Updating UI with API URL..." -ForegroundColor Yellow
$appFile = "ui/src/App.tsx"
$content = Get-Content $appFile -Raw
$content = $content -replace "const API_URL = '.*'", "const API_URL = '$($apiUrl.TrimEnd('/'))'"
Set-Content $appFile $content

# Step 6: Build and deploy UI
Write-Host "🎨 Building UI..." -ForegroundColor Yellow
Set-Location ui
npm install
npm run build

# Extract bucket name from URL
$bucketName = $uiUrl -replace "http://", "" -replace ".s3-website.*", ""

Write-Host "☁️ Uploading UI to S3: $bucketName" -ForegroundColor Yellow
aws s3 sync dist/ s3://$bucketName/ --delete

Set-Location ..

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 IoT Demo UI: $uiUrl" -ForegroundColor Cyan
Write-Host "📡 API Endpoint: $apiUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Available endpoints:" -ForegroundColor White
Write-Host "  POST $($apiUrl)commands  - Execute commands" -ForegroundColor Gray
Write-Host "  GET  $($apiUrl)queries   - Get dashboard summary" -ForegroundColor Gray
Write-Host "  GET  $($apiUrl)sensors   - List sensors" -ForegroundColor Gray
Write-Host "  GET  $($apiUrl)readings  - Get readings" -ForegroundColor Gray
Write-Host "  GET  $($apiUrl)alerts    - Get alerts" -ForegroundColor Gray
Write-Host "  GET  $($apiUrl)events    - Get event stream" -ForegroundColor Gray
