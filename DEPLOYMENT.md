# Ethiopian Payroll Backend - Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5.0 or higher)
- npm or yarn

### Installation Steps

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd payroll-backend
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**
   ```bash
   # Make sure MongoDB is running
   npm run setup
   ```

4. **Start the Server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Test the API**
   ```bash
   npm run test:api
   ```

## 📋 Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/payroll_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# Ethiopian Tax Configuration
TAX_BRACKET_1=600
TAX_BRACKET_2=1650
TAX_BRACKET_3=3200
TAX_BRACKET_4=5250
TAX_BRACKET_5=7800
TAX_BRACKET_6=10900

TAX_RATE_1=0
TAX_RATE_2=0.10
TAX_RATE_3=0.15
TAX_RATE_4=0.20
TAX_RATE_5=0.25
TAX_RATE_6=0.30
TAX_RATE_7=0.35

# Pension Configuration
EMPLOYEE_PENSION_RATE=0.07
EMPLOYER_PENSION_RATE=0.11

# Overtime Configuration
OVERTIME_MULTIPLIER=1.5

# Logging Configuration
LOG_LEVEL=info
```

## 🏗️ Production Deployment

### Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   
   EXPOSE 3000
   
   CMD ["npm", "start"]
   ```

2. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - MONGODB_URI=mongodb://mongo:27017/payroll_db
       depends_on:
         - mongo
       restart: unless-stopped
   
     mongo:
       image: mongo:5.0
       ports:
         - "27017:27017"
       volumes:
         - mongo_data:/data/db
       restart: unless-stopped
   
   volumes:
     mongo_data:
   ```

3. **Deploy**
   ```bash
   docker-compose up -d
   ```

### Cloud Deployment (AWS/Azure/GCP)

1. **Prepare for Cloud**
   - Set up MongoDB Atlas or cloud database
   - Configure environment variables
   - Set up logging and monitoring

2. **Deploy to Cloud Platform**
   - Use platform-specific deployment tools
   - Configure load balancers and auto-scaling
   - Set up SSL certificates

## 🔒 Security Considerations

### Production Security Checklist

- [ ] Change default passwords
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Database access controls
- [ ] Environment variable security

### Security Headers
The application includes security headers via Helmet.js:
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy
- And more...

## 📊 Monitoring and Logging

### Log Files Location
```
logs/
├── error.log          # Error logs
├── combined.log       # All logs
├── audit.log         # Audit trail
├── exceptions.log    # Unhandled exceptions
└── rejections.log    # Unhandled promise rejections
```

### Health Check Endpoint
```
GET /health
```

### Monitoring Recommendations
- Set up log aggregation (ELK Stack, Splunk)
- Monitor database performance
- Set up alerts for errors and failures
- Track API response times
- Monitor system resources

## 🔧 Maintenance

### Database Maintenance
```bash
# Backup database
mongodump --uri="mongodb://localhost:27017/payroll_db" --out=backup/

# Restore database
mongorestore --uri="mongodb://localhost:27017/payroll_db" backup/payroll_db/
```

### Log Rotation
Configure log rotation to prevent disk space issues:
```bash
# Add to crontab
0 0 * * * /usr/sbin/logrotate /path/to/logrotate.conf
```

### Updates and Patches
```bash
# Update dependencies
npm audit
npm update

# Apply security patches
npm audit fix
```

## 🧪 Testing

### API Testing
```bash
# Run comprehensive API tests
npm run test:api

# Manual testing with curl
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hr@company.com","password":"password123"}'
```

### Load Testing
Use tools like Apache Bench or Artillery for load testing:
```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery quick --count 10 --num 100 http://localhost:3000/health
```

## 📈 Performance Optimization

### Database Optimization
- Create appropriate indexes
- Use MongoDB aggregation pipelines
- Implement connection pooling
- Monitor query performance

### Application Optimization
- Enable gzip compression
- Implement caching strategies
- Optimize API response sizes
- Use pagination for large datasets

### Scaling Strategies
- Horizontal scaling with load balancers
- Database sharding for large datasets
- Microservices architecture for complex systems
- CDN for static assets

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check MongoDB status
   systemctl status mongod
   
   # Check connection string
   echo $MONGODB_URI
   ```

2. **JWT Token Issues**
   ```bash
   # Verify JWT secret is set
   echo $JWT_SECRET
   
   # Check token expiration
   # Tokens expire based on JWT_EXPIRES_IN setting
   ```

3. **Permission Errors**
   ```bash
   # Check file permissions
   ls -la logs/
   
   # Fix permissions if needed
   chmod 755 logs/
   ```

4. **Port Already in Use**
   ```bash
   # Find process using port 3000
   lsof -i :3000
   
   # Kill process if needed
   kill -9 <PID>
   ```

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development LOG_LEVEL=debug npm run dev
```

## 📞 Support

For technical support:
1. Check the logs in `logs/` directory
2. Review the API documentation
3. Run the test suite to identify issues
4. Check database connectivity and status

## 🔄 Backup and Recovery

### Automated Backup Script
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/payroll_$DATE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/db"

# Backup application files
tar -czf "$BACKUP_DIR/app.tar.gz" /path/to/app

# Cleanup old backups (keep last 7 days)
find /backups -name "payroll_*" -mtime +7 -exec rm -rf {} \;

echo "Backup completed: $BACKUP_DIR"
```

### Recovery Process
1. Stop the application
2. Restore database from backup
3. Restore application files if needed
4. Restart the application
5. Verify system functionality

This deployment guide ensures a robust, secure, and scalable deployment of the Ethiopian Payroll Backend System.