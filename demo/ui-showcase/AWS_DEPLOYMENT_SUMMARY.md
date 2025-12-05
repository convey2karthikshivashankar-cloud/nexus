# 🚀 AWS Free-Tier Deployment - Quick Summary

## One-Command Deployment

```powershell
.\deploy-to-aws.ps1 -BucketName "nexus-blueprint-demo-ui"
```

That's it! Your demo will be live in ~2 minutes.

---

## 📋 What You Need

### Before Running
1. **AWS Account** - Free tier eligible
2. **AWS CLI** - Installed and configured
3. **Credentials** - Run `aws configure` first

### Quick Setup
```powershell
# Install AWS CLI (if needed)
# Download from: https://aws.amazon.com/cli/

# Configure credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1), Format (json)

# Verify
aws sts get-caller-identity
```

---

## 🎯 Deployment Steps

### Step 1: Navigate to Directory
```powershell
cd demo/ui-showcase
```

### Step 2: Run Deployment Script
```powershell
.\deploy-to-aws.ps1 -BucketName "your-unique-bucket-name"
```

**Note:** Bucket name must be globally unique. Try:
- `nexus-demo-yourname`
- `nexus-blueprint-demo-2024`
- `yourcompany-nexus-demo`

### Step 3: Access Your Demo
The script will output your URL:
```
http://your-bucket-name.s3-website-us-east-1.amazonaws.com
```

---

## 💰 Cost Breakdown

### AWS Free Tier (12 months)
- **S3 Storage**: 5GB free
- **S3 Requests**: 20,000 GET, 2,000 PUT free/month
- **Data Transfer**: 100GB out free/month
- **CloudFront**: 1TB transfer, 10M requests free/month

### Your Demo
- **Size**: ~500KB (well within limits)
- **Expected Cost**: $0/month for typical demo usage
- **Max Cost**: ~$2/month if heavily used

### Stay in Free Tier
- ✅ Demo is optimized (~500KB)
- ✅ Caching configured (reduces requests)
- ✅ Compression enabled
- ✅ Set up billing alerts (recommended)

---

## 🔧 Script Options

### Basic Deployment
```powershell
.\deploy-to-aws.ps1 -BucketName "my-demo"
```

### Specify Region
```powershell
.\deploy-to-aws.ps1 -BucketName "my-demo" -Region "us-west-2"
```

### Skip Build (Use Existing)
```powershell
.\deploy-to-aws.ps1 -BucketName "my-demo" -SkipBuild
```

---

## ✅ What the Script Does

### Automatically Handles
1. ✅ Checks AWS CLI installation
2. ✅ Verifies credentials
3. ✅ Builds the application
4. ✅ Creates S3 bucket (if needed)
5. ✅ Configures static website hosting
6. ✅ Sets public access policy
7. ✅ Uploads all files
8. ✅ Sets proper content types
9. ✅ Configures caching
10. ✅ Provides access URL

### Output Example
```
╔══════════════════════════════════════════════════════════════╗
║                  ✅ DEPLOYMENT SUCCESSFUL! ✅                ║
╚══════════════════════════════════════════════════════════════╝

🌐 Your demo is now live at:
   http://nexus-blueprint-demo-ui.s3-website-us-east-1.amazonaws.com

📊 Deployment Details:
   Bucket:  nexus-blueprint-demo-ui
   Region:  us-east-1
   Files:   42 uploaded
```

---

## 🌐 Optional: Add HTTPS with CloudFront

### Why CloudFront?
- ✅ HTTPS support (required for production)
- ✅ Global CDN (faster worldwide)
- ✅ Custom domain support
- ✅ Still free tier eligible

### Quick Setup
```powershell
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name your-bucket.s3.amazonaws.com \
  --default-root-object index.html
```

**See [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md) for complete CloudFront setup.**

---

## 🐛 Troubleshooting

### "AWS CLI not found"
**Solution:**
```powershell
# Download and install AWS CLI
# https://aws.amazon.com/cli/

# Verify installation
aws --version
```

### "Credentials not configured"
**Solution:**
```powershell
aws configure
# Enter your credentials when prompted
```

### "Bucket name already taken"
**Solution:**
```powershell
# Try a different bucket name
.\deploy-to-aws.ps1 -BucketName "nexus-demo-yourname-2024"
```

### "403 Forbidden" when accessing
**Solution:**
```powershell
# Bucket policy might not be applied
# Re-run the script, it will fix it
.\deploy-to-aws.ps1 -BucketName "your-bucket" -SkipBuild
```

### "404 Not Found" on page refresh
**Solution:**
This is already handled by the script (error document = index.html).
If still occurring, check:
```powershell
aws s3api get-bucket-website --bucket your-bucket-name
```

---

## 📊 Monitoring Your Deployment

### Check Bucket Size
```powershell
aws s3 ls s3://your-bucket-name --recursive --summarize
```

### View Recent Uploads
```powershell
aws s3 ls s3://your-bucket-name --recursive
```

### Check Website Configuration
```powershell
aws s3api get-bucket-website --bucket your-bucket-name
```

### Set Up Billing Alert
```powershell
# Create SNS topic
aws sns create-topic --name billing-alerts

# Subscribe your email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:billing-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com
```

---

## 🔄 Updating Your Deployment

### Quick Update
```powershell
# Make changes to your code
# Then redeploy
npm run build
.\deploy-to-aws.ps1 -BucketName "your-bucket-name"
```

### Update Without Rebuilding
```powershell
# If you already have a fresh build
.\deploy-to-aws.ps1 -BucketName "your-bucket-name" -SkipBuild
```

---

## 🎯 Next Steps

### After Deployment
1. ✅ Open the URL in your browser
2. ✅ Test all 5 components
3. ✅ Verify animations work
4. ✅ Check mobile responsiveness
5. ✅ Share with your team

### Production Readiness
1. Add CloudFront for HTTPS
2. Configure custom domain
3. Set up CI/CD pipeline
4. Enable monitoring
5. Configure backups

### For VC Presentations
1. Test on presentation hardware
2. Ensure stable internet
3. Have backup screenshots
4. Practice demo flow
5. Prepare for questions

---

## 📚 Additional Resources

### Documentation
- **[AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)** - Complete deployment guide
- **[VC_PITCH_GUIDE.md](VC_PITCH_GUIDE.md)** - Pitch strategy
- **[DEMO_GUIDE.md](DEMO_GUIDE.md)** - Usage instructions

### AWS Resources
- [S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [AWS Free Tier](https://aws.amazon.com/free/)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)

---

## 🎉 Success!

Your Nexus Blueprint 3.0 demo is now:
- ✅ Deployed to AWS
- ✅ Accessible worldwide
- ✅ Running on free tier
- ✅ Ready for VC presentations
- ✅ Production-quality hosting

**Now go wow your audience! 🚀**

---

## 💡 Pro Tips

### For Demos
- Test the URL before presentations
- Have the URL bookmarked
- Check internet connectivity
- Have backup slides ready

### For Cost Control
- Monitor usage monthly
- Set up billing alerts
- Use CloudFront for caching
- Delete unused buckets

### For Performance
- CloudFront for global users
- Enable compression
- Optimize images (already done)
- Use long cache times (configured)

---

**Questions? Check [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md) for detailed troubleshooting!**
