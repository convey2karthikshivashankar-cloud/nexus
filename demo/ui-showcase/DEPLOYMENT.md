# Deployment Guide - Nexus Blueprint 3.0 Demo UI

This guide covers multiple deployment options for the VC-pitch demo UI.

## 🚀 Quick Start - AWS Free Tier (Recommended)

**Deploy to AWS S3 in 3 commands:**

```powershell
cd demo/ui-showcase
npm run build
.\deploy-to-aws.ps1 -BucketName "your-unique-bucket-name"
```

**✨ Complete AWS deployment guide:** [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)

The automated script handles:
- ✅ Bucket creation and configuration
- ✅ Static website hosting setup
- ✅ Public access policy
- ✅ File upload with proper caching
- ✅ Content type configuration

**Cost:** $0-2/month (within AWS free tier)

---

## 🎯 Deployment Options

### Option 1: AWS S3 + CloudFront (Recommended for Production)

#### Prerequisites
- AWS CLI configured with appropriate credentials
- S3 bucket created
- CloudFront distribution (optional, for CDN)

#### Steps

1. **Build the application**
```bash
npm run build
```

2. **Create S3 bucket** (if not exists)
```bash
aws s3 mb s3://nexus-demo-ui --region us-east-1
```

3. **Configure bucket for static website hosting**
```bash
aws s3 website s3://nexus-demo-ui \
  --index-document index.html \
  --error-document index.html
```

4. **Set bucket policy for public access**
```bash
cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::nexus-demo-ui/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket nexus-demo-ui \
  --policy file://bucket-policy.json
```

5. **Deploy**
```bash
npm run deploy
```

6. **Create CloudFront distribution** (optional)
```bash
aws cloudfront create-distribution \
  --origin-domain-name nexus-demo-ui.s3-website-us-east-1.amazonaws.com \
  --default-root-object index.html
```

#### Custom Domain Setup

1. **Request SSL certificate in ACM**
```bash
aws acm request-certificate \
  --domain-name demo.nexusblueprint.com \
  --validation-method DNS \
  --region us-east-1
```

2. **Update CloudFront distribution with custom domain**
3. **Create Route53 record pointing to CloudFront**

---

### Option 2: Vercel (Fastest Deployment)

#### Prerequisites
- Vercel account
- Vercel CLI installed

#### Steps

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel --prod
```

4. **Custom domain** (optional)
```bash
vercel domains add demo.nexusblueprint.com
```

#### Configuration
Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

### Option 3: Netlify

#### Prerequisites
- Netlify account
- Netlify CLI installed

#### Steps

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Login to Netlify**
```bash
netlify login
```

3. **Initialize site**
```bash
netlify init
```

4. **Deploy**
```bash
netlify deploy --prod --dir=dist
```

#### Configuration
Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### Option 4: Docker + Any Cloud Provider

#### Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### Build and run
```bash
# Build image
docker build -t nexus-demo-ui .

# Run locally
docker run -p 8080:80 nexus-demo-ui

# Push to registry
docker tag nexus-demo-ui:latest your-registry/nexus-demo-ui:latest
docker push your-registry/nexus-demo-ui:latest
```

#### Deploy to AWS ECS
```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name nexus-demo-cluster

# Create task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster nexus-demo-cluster \
  --service-name nexus-demo-ui \
  --task-definition nexus-demo-ui \
  --desired-count 2 \
  --launch-type FARGATE
```

---

### Option 5: GitHub Pages

#### Steps

1. **Update `vite.config.ts`**
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/nexus-blueprint-demo/', // Your repo name
  build: {
    outDir: 'dist',
  }
});
```

2. **Create deployment workflow**
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        working-directory: ./demo/ui-showcase
        
      - name: Build
        run: npm run build
        working-directory: ./demo/ui-showcase
        
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./demo/ui-showcase/dist
```

3. **Enable GitHub Pages in repository settings**

---

## 🔒 Security Considerations

### Environment Variables
Never commit sensitive data. Use environment variables:

```bash
# .env.production
VITE_API_ENDPOINT=https://api.nexusblueprint.com
VITE_WS_ENDPOINT=wss://ws.nexusblueprint.com
```

### CORS Configuration
Ensure your API allows requests from the demo domain:
```javascript
{
  "AllowedOrigins": ["https://demo.nexusblueprint.com"],
  "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
  "AllowedHeaders": ["*"]
}
```

### Content Security Policy
Add CSP headers in your hosting configuration:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
```

---

## 📊 Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
npm run build -- --mode analyze

# Enable compression
npm install -D vite-plugin-compression
```

### CDN Configuration
- Enable CloudFront compression
- Set appropriate cache headers
- Use CloudFront functions for edge optimization

### Monitoring
- Set up CloudWatch alarms for S3/CloudFront
- Monitor Core Web Vitals
- Track user engagement metrics

---

## 🚀 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy Demo UI

on:
  push:
    branches: [ main ]
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
          cache: 'npm'
          cache-dependency-path: demo/ui-showcase/package-lock.json
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./demo/ui-showcase
      
      - name: Build
        run: npm run build
        working-directory: ./demo/ui-showcase
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy to S3
        run: |
          aws s3 sync dist/ s3://nexus-demo-ui --delete
        working-directory: ./demo/ui-showcase
      
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

---

## 🎯 Post-Deployment Checklist

- [ ] Verify all pages load correctly
- [ ] Test auto-play functionality
- [ ] Check all animations work smoothly
- [ ] Verify real-time metrics update
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices
- [ ] Verify custom domain (if configured)
- [ ] Check SSL certificate
- [ ] Test performance (Lighthouse score > 90)
- [ ] Verify analytics tracking (if configured)

---

## 📞 Troubleshooting

### Issue: Blank page after deployment
**Solution**: Check browser console for errors. Likely a base path issue in vite.config.ts

### Issue: Assets not loading
**Solution**: Verify S3 bucket policy allows public read access

### Issue: Slow load times
**Solution**: Enable CloudFront CDN and compression

### Issue: 404 on refresh
**Solution**: Configure server to serve index.html for all routes

---

## 📈 Monitoring & Analytics

### Google Analytics Setup
```typescript
// Add to src/main.tsx
import ReactGA from 'react-ga4';

ReactGA.initialize('G-XXXXXXXXXX');
```

### AWS CloudWatch
Monitor:
- S3 bucket requests
- CloudFront cache hit ratio
- Error rates
- Geographic distribution

---

**Ready to impress? Deploy now and wow your audience! 🚀**
