# Nexus Blueprint UI - AWS Free-Tier Deployment Script
# Deploys the UI showcase to S3 with static website hosting

param(
    [Parameter(Mandatory=$false)]
    [string]$BucketName = "nexus-blueprint-demo-ui",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║         NEXUS BLUEPRINT 3.0 - AWS DEPLOYMENT                ║
║                                                              ║
║         Deploying UI Showcase to AWS Free Tier              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# Verify AWS CLI is installed
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow
try {
    $awsVersion = aws --version 2>&1
    Write-Host "   ✓ AWS CLI installed: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ AWS CLI not found! Please install AWS CLI first." -ForegroundColor Red
    Write-Host "   Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Verify AWS credentials
Write-Host "`n🔐 Verifying AWS credentials..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity 2>&1 | ConvertFrom-Json
    Write-Host "   ✓ Authenticated as: $($identity.Arn)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ AWS credentials not configured!" -ForegroundColor Red
    Write-Host "   Run: aws configure" -ForegroundColor Yellow
    exit 1
}

# Build the application
if (-not $SkipBuild) {
    Write-Host "`n📦 Building application..." -ForegroundColor Yellow
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✓ Build completed successfully" -ForegroundColor Green
} else {
    Write-Host "`n⏭️  Skipping build (using existing dist/)..." -ForegroundColor Yellow
}

# Verify dist folder exists
if (-not (Test-Path "dist")) {
    Write-Host "   ❌ dist/ folder not found! Run without -SkipBuild" -ForegroundColor Red
    exit 1
}

# Check if bucket exists
Write-Host "`n🪣 Checking S3 bucket..." -ForegroundColor Yellow
$bucketExists = $false
try {
    aws s3 ls "s3://$BucketName" 2>&1 | Out-Null
    $bucketExists = $LASTEXITCODE -eq 0
} catch {
    $bucketExists = $false
}

if (-not $bucketExists) {
    Write-Host "   Creating bucket: $BucketName" -ForegroundColor Yellow
    
    # Create bucket
    aws s3 mb "s3://$BucketName" --region $Region
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Failed to create bucket!" -ForegroundColor Red
        Write-Host "   Bucket name might be taken. Try a different name." -ForegroundColor Yellow
        exit 1
    }
    
    # Enable static website hosting
    Write-Host "   Configuring static website hosting..." -ForegroundColor Yellow
    aws s3 website "s3://$BucketName" --index-document index.html --error-document index.html
    
    # Create bucket policy for public read access
    Write-Host "   Setting bucket policy for public access..." -ForegroundColor Yellow
    $policy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BucketName/*"
    }
  ]
}
"@
    
    $policyFile = "temp-bucket-policy.json"
    $policy | Out-File -FilePath $policyFile -Encoding utf8
    aws s3api put-bucket-policy --bucket $BucketName --policy file://$policyFile
    Remove-Item $policyFile
    
    Write-Host "   ✓ Bucket created and configured" -ForegroundColor Green
} else {
    Write-Host "   ✓ Bucket exists: $BucketName" -ForegroundColor Green
}

# Sync files to S3
Write-Host "`n📤 Uploading files to S3..." -ForegroundColor Yellow
Write-Host "   This may take a minute..." -ForegroundColor Gray

# Upload with cache control
aws s3 sync dist/ "s3://$BucketName" --delete --cache-control "max-age=31536000" --exclude "*.html"

# Upload HTML files with no-cache
aws s3 sync dist/ "s3://$BucketName" --exclude "*" --include "*.html" --cache-control "no-cache, no-store, must-revalidate"

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Upload failed!" -ForegroundColor Red
    exit 1
}

Write-Host "   ✓ Files uploaded successfully" -ForegroundColor Green

# Set correct content types
Write-Host "`n🔧 Setting content types..." -ForegroundColor Yellow
aws s3 cp "s3://$BucketName" "s3://$BucketName" --recursive --exclude "*" --include "*.html" --content-type "text/html" --metadata-directive REPLACE --cache-control "no-cache" 2>&1 | Out-Null
aws s3 cp "s3://$BucketName" "s3://$BucketName" --recursive --exclude "*" --include "*.css" --content-type "text/css" --metadata-directive REPLACE 2>&1 | Out-Null
aws s3 cp "s3://$BucketName" "s3://$BucketName" --recursive --exclude "*" --include "*.js" --content-type "application/javascript" --metadata-directive REPLACE 2>&1 | Out-Null
Write-Host "   ✓ Content types configured" -ForegroundColor Green

# Get website URL
$websiteUrl = "http://$BucketName.s3-website-$Region.amazonaws.com"

# Display success message
Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                  ✅ DEPLOYMENT SUCCESSFUL! ✅                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green

Write-Host "🌐 Your demo is now live at:" -ForegroundColor Cyan
Write-Host "   $websiteUrl" -ForegroundColor White -BackgroundColor DarkBlue

Write-Host "`n📊 Deployment Details:" -ForegroundColor Yellow
Write-Host "   Bucket:  $BucketName" -ForegroundColor Gray
Write-Host "   Region:  $Region" -ForegroundColor Gray
Write-Host "   Files:   $(Get-ChildItem -Path dist -Recurse -File | Measure-Object).Count uploaded" -ForegroundColor Gray

Write-Host "`n💡 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Open the URL above in your browser" -ForegroundColor Gray
Write-Host "   2. Test all features and navigation" -ForegroundColor Gray
Write-Host "   3. Consider adding CloudFront for HTTPS" -ForegroundColor Gray
Write-Host "   4. Set up billing alerts to stay in free tier" -ForegroundColor Gray

Write-Host "`n📚 Documentation:" -ForegroundColor Yellow
Write-Host "   See AWS_DEPLOYMENT_GUIDE.md for:" -ForegroundColor Gray
Write-Host "   - CloudFront setup (HTTPS + CDN)" -ForegroundColor Gray
Write-Host "   - Custom domain configuration" -ForegroundColor Gray
Write-Host "   - Cost optimization tips" -ForegroundColor Gray
Write-Host "   - Troubleshooting guide" -ForegroundColor Gray

Write-Host "`n🎉 Happy demoing!" -ForegroundColor Cyan
Write-Host ""
