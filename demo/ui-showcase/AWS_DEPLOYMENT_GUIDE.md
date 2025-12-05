# AWS Free-Tier Deployment Guide - UI Showcase

## 🎯 Overview

Deploy the Nexus Blueprint 3.0 UI Showcase to AWS using **free-tier eligible services**:
- **S3** - Static website hosting (free tier: 5GB storage, 20K GET requests)
- **CloudFront** - CDN for global distribution (free tier: 1TB data transfer out)
- **Route 53** - Optional custom domain (not free, but cheap: ~$0.50/month)

**Estimated Cost**: $0-2/month (within free tier limits)

---

## 📋 Prerequisites

### 1. AWS Account
- Active AWS account with free-tier eligibility
- AWS CLI installed and configured
- IAM user with appropriate permissions

### 2. Local Setup
```powershell
# Verify AWS CLI is installed
aws --version

# Configure AWS credentials (if not already done)
aws configure
```

You'll need:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format (e.g., `json`)

---

## 🚀 Deployment Steps

### Step 1: Build the Application

```powershell
# Navigate to the showcase directory
cd demo/ui-showcase

# Install dependencies (if not already done)
npm install

# Build for production
npm run build
```

This creates an optimized build in the `dist/` directory.

### Step 2: Create S3 Bucket

```powershell
# Set your bucket name (must be globally unique)
$BUCKET_NAME = "nexus-blueprint-demo-ui"

# Create the bucket
aws s3 mb s3://$BUCKET_NAME --region us-east-1

# Enable static website hosting
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html
```

### Step 3: Configure Bucket Policy

Create a file `bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::nexus-blueprint-demo-ui/*"
    }
  ]
}
```

Apply the policy:

```powershell
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json
```

### Step 4: Upload Build Files

```powershell
# Sync the dist folder to S3
aws s3 sync dist/ s3://$BUCKET_NAME --delete

# Set proper content types
aws s3 cp s3://$BUCKET_NAME s3://$BUCKET_NAME --recursive --exclude "*" --include "*.html" --content-type "text/html" --metadata-directive REPLACE
aws s3 cp s3://$BUCKET_NAME s3://$BUCKET_NAME --recursive --exclude "*" --include "*.css" --content-type "text/css" --metadata-directive REPLACE
aws s3 cp s3://$BUCKET_NAME s3://$BUCKET_NAME --recursive --exclude "*" --include "*.js" --content-type "application/javascript" --metadata-directive REPLACE
```

### Step 5: Get Website URL

```powershell
# Your website is now available at:
echo "http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"
```

---

## 🌐 Optional: Add CloudFront CDN

CloudFront provides:
- HTTPS support
- Global CDN distribution
- Better performance
- Custom domain support

### Create CloudFront Distribution

```powershell
# Create distribution configuration
$DISTRIBUTION_CONFIG = @"
{
  "CallerReference": "nexus-ui-$(Get-Date -Format 'yyyyMMddHHmmss')",
  "Comment": "Nexus Blueprint UI Showcase",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-$BUCKET_NAME",
        "DomainName": "$BUCKET_NAME.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultRootObject": "index.html",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-$BUCKET_NAME",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  }
}
"@

# Create the distribution
aws cloudfront create-distribution --distribution-config $DISTRIBUTION_CONFIG
```

**Note**: CloudFront distribution takes 15-20 minutes to deploy.

---

## 🔧 Automated Deployment Script

Create `deploy-to-aws.ps1`:

```powershell
# Nexus Blueprint UI - AWS Deployment Script

param(
    [Parameter(Mandatory=$true)]
    [string]$BucketName,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1"
)

Write-Host "🚀 Deploying Nexus Blueprint UI to AWS..." -ForegroundColor Cyan

# Step 1: Build
Write-Host "`n📦 Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Check if bucket exists
Write-Host "`n🪣 Checking S3 bucket..." -ForegroundColor Yellow
$bucketExists = aws s3 ls "s3://$BucketName" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating bucket $BucketName..." -ForegroundColor Yellow
    aws s3 mb "s3://$BucketName" --region $Region
    
    # Enable static website hosting
    aws s3 website "s3://$BucketName" --index-document index.html --error-document index.html
    
    # Create and apply bucket policy
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
    
    $policy | Out-File -FilePath "temp-policy.json" -Encoding utf8
    aws s3api put-bucket-policy --bucket $BucketName --policy file://temp-policy.json
    Remove-Item "temp-policy.json"
}

# Step 3: Sync files
Write-Host "`n📤 Uploading files to S3..." -ForegroundColor Yellow
aws s3 sync dist/ "s3://$BucketName" --delete --cache-control "max-age=31536000"

# Step 4: Set correct content types
Write-Host "`n🔧 Setting content types..." -ForegroundColor Yellow
aws s3 cp "s3://$BucketName" "s3://$BucketName" --recursive --exclude "*" --include "*.html" --content-type "text/html" --metadata-directive REPLACE --cache-control "no-cache"
aws s3 cp "s3://$BucketName" "s3://$BucketName" --recursive --exclude "*" --include "*.css" --content-type "text/css" --metadata-directive REPLACE
aws s3 cp "s3://$BucketName" "s3://$BucketName" --recursive --exclude "*" --include "*.js" --content-type "application/javascript" --metadata-directive REPLACE

# Step 5: Get URL
$websiteUrl = "http://$BucketName.s3-website-$Region.amazonaws.com"

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "`n🌐 Your demo is available at:" -ForegroundColor Cyan
Write-Host "   $websiteUrl" -ForegroundColor White
Write-Host "`n💡 Tip: Add CloudFront for HTTPS and better performance" -ForegroundColor Yellow
```

### Usage

```powershell
# Deploy to AWS
.\deploy-to-aws.ps1 -BucketName "nexus-blueprint-demo-ui"

# Deploy to specific region
.\deploy-to-aws.ps1 -BucketName "nexus-blueprint-demo-ui" -Region "us-west-2"
```

---

## 🔒 Security Best Practices

### 1. Enable Bucket Versioning
```powershell
aws s3api put-bucket-versioning --bucket $BUCKET_NAME --versioning-configuration Status=Enabled
```

### 2. Enable Server-Side Encryption
```powershell
aws s3api put-bucket-encryption --bucket $BUCKET_NAME --server-side-encryption-configuration '{
  "Rules": [{
    "ApplyServerSideEncryptionByDefault": {
      "SSEAlgorithm": "AES256"
    }
  }]
}'
```

### 3. Block Public Access (except for website hosting)
```powershell
aws s3api put-public-access-block --bucket $BUCKET_NAME --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

---

## 💰 Cost Optimization

### Free Tier Limits
- **S3**: 5GB storage, 20,000 GET requests, 2,000 PUT requests/month
- **CloudFront**: 1TB data transfer out, 10M HTTP/HTTPS requests/month
- **Data Transfer**: First 100GB out to internet free

### Staying Within Free Tier
1. **Optimize Assets**: The build is already optimized (~500KB)
2. **Enable Compression**: CloudFront automatically compresses
3. **Cache Aggressively**: Set long cache times for static assets
4. **Monitor Usage**: Set up billing alerts

### Set Up Billing Alert
```powershell
# Create SNS topic for alerts
aws sns create-topic --name billing-alerts

# Subscribe your email
aws sns subscribe --topic-arn arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:billing-alerts --protocol email --notification-endpoint your-email@example.com

# Create billing alarm (requires CloudWatch)
aws cloudwatch put-metric-alarm --alarm-name "BillingAlert" --alarm-description "Alert when charges exceed $5" --metric-name EstimatedCharges --namespace AWS/Billing --statistic Maximum --period 21600 --evaluation-periods 1 --threshold 5 --comparison-operator GreaterThanThreshold --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:billing-alerts
```

---

## 🔄 Continuous Deployment

### GitHub Actions Workflow

Create `.github/workflows/deploy-ui.yml`:

```yaml
name: Deploy UI to AWS

on:
  push:
    branches: [main]
    paths:
      - 'demo/ui-showcase/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        working-directory: demo/ui-showcase
        run: npm ci
        
      - name: Build
        working-directory: demo/ui-showcase
        run: npm run build
        
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
          
      - name: Deploy to S3
        working-directory: demo/ui-showcase
        run: |
          aws s3 sync dist/ s3://nexus-blueprint-demo-ui --delete
          
      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
```

---

## 🐛 Troubleshooting

### Issue: 403 Forbidden
**Cause**: Bucket policy not applied correctly
**Solution**:
```powershell
# Verify bucket policy
aws s3api get-bucket-policy --bucket $BUCKET_NAME

# Reapply if needed
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json
```

### Issue: 404 Not Found on Refresh
**Cause**: SPA routing not configured
**Solution**: Already handled in error document configuration. Verify:
```powershell
aws s3api get-bucket-website --bucket $BUCKET_NAME
```

### Issue: Slow Loading
**Cause**: Not using CloudFront
**Solution**: Add CloudFront distribution (see above)

### Issue: CORS Errors
**Cause**: Missing CORS configuration
**Solution**:
```powershell
aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration '{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }]
}'
```

---

## 📊 Monitoring

### CloudWatch Metrics

Monitor your deployment:

```powershell
# S3 bucket metrics
aws cloudwatch get-metric-statistics --namespace AWS/S3 --metric-name BucketSizeBytes --dimensions Name=BucketName,Value=$BUCKET_NAME Name=StorageType,Value=StandardStorage --start-time 2024-01-01T00:00:00Z --end-time 2024-01-31T23:59:59Z --period 86400 --statistics Average

# CloudFront metrics (if using)
aws cloudwatch get-metric-statistics --namespace AWS/CloudFront --metric-name Requests --dimensions Name=DistributionId,Value=YOUR_DISTRIBUTION_ID --start-time 2024-01-01T00:00:00Z --end-time 2024-01-31T23:59:59Z --period 3600 --statistics Sum
```

---

## 🎯 Quick Reference

### Essential Commands

```powershell
# Build
npm run build

# Deploy
aws s3 sync dist/ s3://nexus-blueprint-demo-ui --delete

# Get URL
echo "http://nexus-blueprint-demo-ui.s3-website-us-east-1.amazonaws.com"

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"

# Check bucket size
aws s3 ls s3://nexus-blueprint-demo-ui --recursive --summarize
```

### Useful AWS CLI Commands

```powershell
# List all buckets
aws s3 ls

# Check bucket policy
aws s3api get-bucket-policy --bucket $BUCKET_NAME

# Check website configuration
aws s3api get-bucket-website --bucket $BUCKET_NAME

# List CloudFront distributions
aws cloudfront list-distributions

# Get distribution details
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID
```

---

## ✅ Deployment Checklist

Before deploying:
- [ ] AWS CLI installed and configured
- [ ] AWS credentials set up
- [ ] Bucket name chosen (globally unique)
- [ ] Application built successfully
- [ ] Bucket policy created

After deploying:
- [ ] Website accessible via S3 URL
- [ ] All assets loading correctly
- [ ] Navigation working (SPA routing)
- [ ] CloudFront distribution created (optional)
- [ ] Custom domain configured (optional)
- [ ] Billing alerts set up
- [ ] Monitoring enabled

---

## 🚀 Next Steps

1. **Deploy Now**: Run the deployment script
2. **Add HTTPS**: Set up CloudFront
3. **Custom Domain**: Configure Route 53
4. **CI/CD**: Set up GitHub Actions
5. **Monitor**: Enable CloudWatch metrics

---

## 📞 Support

### AWS Resources
- [S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [AWS Free Tier](https://aws.amazon.com/free/)

### Common Issues
- Check AWS CLI version: `aws --version`
- Verify credentials: `aws sts get-caller-identity`
- Check region: `aws configure get region`

---

**Ready to deploy? Run the script and your demo will be live in minutes! 🎉**
