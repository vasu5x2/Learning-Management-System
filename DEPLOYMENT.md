# Deployment Guide

This guide explains how to deploy the Learning Management System (LMS) Backend API to various hosting platforms.

## Heroku Deployment

### Prerequisites
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed
- Git repository initialized
- Heroku account

### Step 1: Prepare for Deployment

1. **Create Procfile**
   Create a `Procfile` in the root directory:
   ```
   web: node server.js
   ```

2. **Update package.json**
   Ensure your package.json includes:
   ```json
   {
     "engines": {
       "node": "18.x",
       "npm": "8.x"
     }
   }
   ```

### Step 2: Deploy to Heroku

1. **Login to Heroku**
   ```bash
   heroku login
   ```

2. **Create Heroku App**
   ```bash
   heroku create your-lms-backend-name
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_super_secret_jwt_key_for_production
   heroku config:set JWT_EXPIRE=7d
   ```

4. **Setup MongoDB Atlas**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com/)
   - Create a free cluster
   - Get connection string
   - Set the MongoDB URI:
   ```bash
   heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/lms_database"
   ```

5. **Deploy the Application**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

6. **Seed the Database (Optional)**
   ```bash
   heroku run node utils/seeder.js
   ```

### Step 3: Verify Deployment

1. **Check Application**
   ```bash
   heroku open
   ```
   Visit: `https://your-app-name.herokuapp.com/api/health`

2. **View Logs**
   ```bash
   heroku logs --tail
   ```

## Railway Deployment

### Prerequisites
- Railway account
- GitHub repository

### Steps

1. **Connect GitHub Repository**
   - Go to [Railway](https://railway.app/)
   - Connect your GitHub repository

2. **Set Environment Variables**
   In Railway dashboard, set:
   ```
   NODE_ENV=production
   JWT_SECRET=your_super_secret_jwt_key_for_production
   JWT_EXPIRE=7d
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lms_database
   ```

3. **Deploy**
   Railway will automatically deploy when you push to your repository.

## Render Deployment

### Prerequisites
- Render account
- GitHub repository

### Steps

1. **Create Web Service**
   - Go to [Render](https://render.com/)
   - Create new Web Service
   - Connect your GitHub repository

2. **Configure Service**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `Node`

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   JWT_SECRET=your_super_secret_jwt_key_for_production
   JWT_EXPIRE=7d
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lms_database
   ```

## DigitalOcean App Platform

### Prerequisites
- DigitalOcean account
- GitHub repository

### Steps

1. **Create App**
   - Go to DigitalOcean App Platform
   - Connect your GitHub repository

2. **Configure App**
   - Select Node.js environment
   - Set build command: `npm install`
   - Set run command: `npm start`

3. **Set Environment Variables**
   Add the required environment variables in the app settings.

## VPS Deployment (Ubuntu/CentOS)

### Prerequisites
- VPS with Ubuntu/CentOS
- Domain name (optional)
- SSH access

### Steps

1. **Setup Server**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2
   sudo npm install -g pm2

   # Install MongoDB (optional, or use MongoDB Atlas)
   sudo apt install -y mongodb
   ```

2. **Deploy Application**
   ```bash
   # Clone repository
   git clone your-repository-url
   cd lms-backend

   # Install dependencies
   npm install

   # Create environment file
   cp .env.example .env
   # Edit .env with production values
   ```

3. **Setup PM2**
   ```bash
   # Start application with PM2
   pm2 start server.js --name "lms-backend"

   # Save PM2 configuration
   pm2 save

   # Setup PM2 to start on boot
   pm2 startup
   ```

4. **Setup Nginx (Optional)**
   ```bash
   # Install Nginx
   sudo apt install -y nginx

   # Create Nginx configuration
   sudo nano /etc/nginx/sites-available/lms-backend
   ```

   Nginx configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   # Enable site
   sudo ln -s /etc/nginx/sites-available/lms-backend /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `JWT_EXPIRE` | JWT expiration time | `7d` |

## Post-Deployment Checklist

- [ ] Health endpoint returns 200 status
- [ ] Database connection is working
- [ ] Environment variables are set correctly
- [ ] SSL certificate is configured (for production)
- [ ] Domain name is pointing to the server
- [ ] Monitoring and logging are setup
- [ ] Backup strategy is in place
- [ ] API documentation is accessible

## Monitoring and Maintenance

### Health Monitoring
Monitor these endpoints:
- `GET /api/health` - Application health
- Database connection status
- Memory and CPU usage

### Logs
- Application logs: `heroku logs --tail` (Heroku)
- PM2 logs: `pm2 logs` (VPS)
- Error tracking service (Sentry, Bugsnag)

### Backups
- Database backups (MongoDB Atlas automatic backups)
- Code repository backups
- Environment configuration backups

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check MongoDB URI format
   - Verify network access in MongoDB Atlas
   - Check username/password

2. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Validate token format

3. **Port Binding Error**
   - Ensure PORT environment variable is set
   - Check if port is already in use

4. **Memory/Performance Issues**
   - Monitor application memory usage
   - Optimize database queries
   - Consider upgrading server resources

### Debugging Commands

```bash
# Check application status
pm2 status

# View application logs
pm2 logs lms-backend

# Restart application
pm2 restart lms-backend

# Monitor resources
pm2 monit
```

## Security Considerations

### Production Security Checklist

- [ ] Use HTTPS/SSL certificates
- [ ] Set secure JWT secret (minimum 32 characters)
- [ ] Enable CORS for specific domains only
- [ ] Use environment variables for sensitive data
- [ ] Set up rate limiting
- [ ] Enable request validation
- [ ] Use secure headers (Helmet.js)
- [ ] Regular security updates
- [ ] Database access restrictions
- [ ] API rate limiting per user
- [ ] Input sanitization
- [ ] Error message filtering (don't expose stack traces)

### Environment-Specific Configurations

**Development:**
- Detailed error messages
- Hot reloading
- Debug logging
- Local database

**Production:**
- Minimal error exposure
- Performance optimization
- Production logging
- Cloud database
- SSL/HTTPS
- Security headers
- Rate limiting