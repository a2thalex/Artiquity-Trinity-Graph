# RSL Security Platform - Deployment Guide

## 🚀 Production Deployment Options

### Option 1: Vercel (Recommended for Frontend + API)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables:**
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `JWT_SECRET`: A secure random string
   - `ENCRYPTION_KEY`: A secure encryption key
   - `STRIPE_SECRET_KEY`: Your Stripe secret key (if using payments)

### Option 2: Netlify

1. **Connect Repository:**
   - Connect your GitHub repository to Netlify
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **Set Environment Variables:**
   - Same as Vercel above

### Option 3: Docker Deployment

1. **Build and Run:**
   ```bash
   docker-compose up -d
   ```

2. **Set Environment Variables:**
   - Create `.env` file with production values
   - Update `docker-compose.yml` with your domain

### Option 4: Traditional VPS/Server

1. **Install Dependencies:**
   ```bash
   npm ci --only=production
   ```

2. **Build Application:**
   ```bash
   npm run build
   ```

3. **Set Up Nginx:**
   - Copy `nginx.conf` to your server
   - Update domain names and SSL certificates
   - Configure SSL certificates

4. **Start Application:**
   ```bash
   npm run server
   ```

## 🔧 Pre-Deployment Checklist

### ✅ Code Cleanup (Completed)
- [x] Removed debug/test files
- [x] Removed console.log statements
- [x] Optimized dependencies
- [x] Created production configuration

### 🔐 Security Configuration

1. **Environment Variables:**
   ```bash
   # Required
   GEMINI_API_KEY=your_actual_api_key
   JWT_SECRET=your_secure_jwt_secret
   ENCRYPTION_KEY=your_secure_encryption_key
   
   # Optional (for payments)
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   ```

2. **SSL Certificates:**
   - Use Let's Encrypt for free SSL
   - Or purchase commercial SSL certificate

3. **Domain Configuration:**
   - Update `CORS_ORIGIN` in environment
   - Update `LICENSE_SERVER_URL` in environment
   - Update `CONTACT_EMAIL` in environment

### 📁 File Structure
```
/rsl-platform/
├── dist/                    # Built frontend
├── server/                  # Backend API
├── landing-page/           # Landing page
├── package.json            # Dependencies
├── vercel.json            # Vercel config
├── netlify.toml           # Netlify config
├── Dockerfile             # Docker config
├── docker-compose.yml     # Docker Compose
├── nginx.conf             # Nginx config
└── DEPLOYMENT.md          # This file
```

## 🌐 Domain Setup

1. **DNS Configuration:**
   - Point your domain to your hosting provider
   - Set up CNAME records for www subdomain

2. **SSL Setup:**
   - Configure SSL certificates
   - Enable HTTPS redirects
   - Set up HSTS headers

## 📊 Monitoring & Logging

1. **Health Checks:**
   - Endpoint: `/health`
   - Monitor application status

2. **Logs:**
   - Application logs: `./logs/combined.log`
   - Error logs: `./logs/error.log`

3. **Performance:**
   - Monitor file upload sizes
   - Track API response times
   - Monitor memory usage

## 🔄 Updates & Maintenance

1. **Code Updates:**
   ```bash
   git pull origin main
   npm ci --only=production
   npm run build
   # Restart application
   ```

2. **Database Backups:**
   - Backup SQLite database regularly
   - Store backups securely

3. **Security Updates:**
   - Keep dependencies updated
   - Monitor security advisories
   - Regular security audits

## 🆘 Troubleshooting

### Common Issues:

1. **File Upload Failures:**
   - Check file size limits
   - Verify upload directory permissions
   - Check disk space

2. **API Errors:**
   - Check environment variables
   - Verify API key validity
   - Check rate limiting

3. **Database Issues:**
   - Check database file permissions
   - Verify database directory exists
   - Check disk space

### Support:
- Check logs in `./logs/` directory
- Monitor application health endpoint
- Review error messages in browser console

## 📈 Performance Optimization

1. **Frontend:**
   - Enable gzip compression
   - Use CDN for static assets
   - Optimize images

2. **Backend:**
   - Enable caching headers
   - Optimize database queries
   - Use connection pooling

3. **Infrastructure:**
   - Use load balancers for high traffic
   - Implement auto-scaling
   - Monitor resource usage
