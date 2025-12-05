# Deploy IoT Demo UI to S3
# Run this after deploying the CDK stack

$ErrorActionPreference = "Stop"

Write-Host "🌡️ Deploying Nexus IoT Demo UI..." -ForegroundColor Cyan

# Get the S3 bucket name from CDK outputs
$stackOutput = aws cloudformation describe-stacks --stack-name NexusIoTDemoStack --query "Stacks[0].Outputs" --output json | ConvertFrom-Json
$uiBucket = ($stackOutput | Where-Object { $_.OutputKey -eq "UIUrl" }).OutputValue

if (-not $uiBucket) {
    Write-Host "❌ Could not find UI bucket. Make sure the CDK stack is deployed." -ForegroundColor Red
    exit 1
}

# Extract bucket name from URL
$bucketName = $uiBucket -replace "http://", "" -replace ".s3-website.*", ""

Write-Host "📦 Building UI..." -ForegroundColor Yellow
Set-Location ui
npm install
npm run build

Write-Host "☁️ Uploading to S3 bucket: $bucketName" -ForegroundColor Yellow
aws s3 sync dist/ s3://$bucketName/ --delete

Write-Host ""
Write-Host "✅ IoT Demo UI deployed successfully!" -ForegroundColor Green
Write-Host "🌐 Open: $uiBucket" -ForegroundColor Cyan
