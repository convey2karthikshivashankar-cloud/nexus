# Nexus Blueprint UI Deployment Script

Write-Host "🚀 Deploying Nexus Blueprint Demo UI" -ForegroundColor Cyan
Write-Host ""

# Configuration
$S3_BUCKET = "nexus-demo-ui-557810226161"
$UI_PATH = "ui"

# Step 1: Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
Set-Location $UI_PATH
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Step 2: Build the UI
Write-Host ""
Write-Host "🔨 Building production bundle..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# Step 3: Deploy to S3
Write-Host ""
Write-Host "☁️  Deploying to S3..." -ForegroundColor Yellow
aws s3 sync dist/ s3://$S3_BUCKET/ --delete
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

# Step 4: Success!
Write-Host ""
Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your demo is live at:" -ForegroundColor Cyan
Write-Host "   http://$S3_BUCKET.s3-website.us-east-2.amazonaws.com" -ForegroundColor White
Write-Host ""
Write-Host "📊 Features:" -ForegroundColor Cyan
Write-Host "   • Order Dashboard - Place and manage orders" -ForegroundColor White
Write-Host "   • Event Timeline - View complete event history" -ForegroundColor White
Write-Host "   • Performance Metrics - Real-time monitoring" -ForegroundColor White
Write-Host "   • Load Tester - Burst testing with configurable requests" -ForegroundColor White
Write-Host "   • Architecture Diagram - System visualization" -ForegroundColor White
Write-Host ""

# Return to demo directory
Set-Location ..
