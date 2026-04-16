# Complete Project Deployment Guide

## Project Structure
```
FYP-Part-1/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── .env (create this)
├── frontend/
│   ├── package.json
│   ├── src/
│   ├── public/
│   ├── build/ (generated after build)
│   └── .env.local (create this)
└── docs/
```

---

## PART 1: LOCAL DEVELOPMENT SETUP

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Git
- npm or yarn

### Step 1: Install Dependencies

#### Backend Setup
```bash
cd backend
npm install
```

#### Frontend Setup
```bash
cd frontend
npm install
```

### Step 2: Environment Configuration

#### Backend `.env` file (backend/.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fypproject
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
CORS_ORIGIN=http://localhost:3000
```

#### Frontend `.env.local` file (frontend/.env.local)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

### Step 3: MongoDB Setup

#### Option A: Local MongoDB
```bash
# Start MongoDB service (Windows)
net start MongoDB

# Or macOS
brew services start mongodb-community

# Or Linux
sudo systemctl start mongod
```

#### Option B: Cloud MongoDB (Atlas)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create account and cluster
3. Get connection string
4. Replace MONGODB_URI in `.env` with your Atlas URI

### Step 4: Run Development Servers

#### Terminal 1 - Backend
```bash
cd backend
npm start
# or
npm run dev  # if you have nodemon setup
```

Backend runs on: `http://localhost:5000`

#### Terminal 2 - Frontend
```bash
cd frontend
npm start
```

Frontend runs on: `http://localhost:3000`

---

## PART 2: BUILD FOR PRODUCTION

### Step 1: Build Frontend

```bash
cd frontend
npm run build
```

This creates `frontend/build/` folder with optimized production files.

### Step 2: Configure Backend to Serve Frontend

Add this to your `backend/server.js`:

```javascript
const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Your API routes
app.use('/api', require('./routes/api'));

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Step 3: Create Production `.env`

```
PORT=5000
MONGODB_URI=your_production_mongodb_uri
NODE_ENV=production
JWT_SECRET=your_production_jwt_secret
CORS_ORIGIN=https://yourdomain.com
```

---

## PART 3: DEPLOYMENT OPTIONS

### Option A: Deploy to Heroku (Free Tier)

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku app**
   ```bash
   heroku create your-app-name
   ```

4. **Create Procfile** (root directory)
   ```
   web: cd backend && npm start
   ```

5. **Set environment variables**
   ```bash
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set JWT_SECRET=your_secret
   heroku config:set NODE_ENV=production
   ```

6. **Deploy**
   ```bash
   git push heroku master
   ```

### Option B: Deploy to Vercel (Frontend) + Railway/Render (Backend)

**Frontend to Vercel:**
```bash
npm install -g vercel
vercel
```

**Backend to Railway:**
1. Go to https://railway.app
2. Connect GitHub repo
3. Deploy from root with environment variables

### Option C: Deploy to AWS

1. **EC2 Instance Setup**
   ```bash
   # SSH into EC2
   ssh -i key.pem ec2-user@your-instance
   
   # Install Node.js
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   
   # Install MongoDB
   sudo yum install mongodb-org
   ```

2. **Deploy Project**
   ```bash
   git clone your-repo
   cd FYP-Part-1
   
   # Backend
   cd backend
   npm install
   npm start &
   
   # Or use PM2 for process management
   npm install -g pm2
   pm2 start server.js
   ```

### Option D: Docker Deployment

**Create `Dockerfile` (root)**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy project
COPY . .

# Build frontend
WORKDIR /app/frontend
RUN npm run build

# Run backend
WORKDIR /app/backend
EXPOSE 5000

CMD ["npm", "start"]
```

**Create `docker-compose.yml`**
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:5
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      MONGODB_URI: mongodb://admin:password@mongodb:27017/fypproject
      NODE_ENV: production
    depends_on:
      - mongodb

volumes:
  mongo-data:
```

**Run with Docker**
```bash
docker-compose up
```

---

## PART 4: TESTING THE DEPLOYMENT

### 1. Test Backend API
```bash
curl http://localhost:5000/api/health
```

### 2. Test Frontend
Open `http://localhost:5000` in browser

### 3. Check Database Connection
```bash
# MongoDB shell
mongosh
> use fypproject
> db.collections()
```

### 4. Verify Environment Variables
```bash
# Backend
node -e "console.log(process.env.MONGODB_URI)"
```

---

## PART 5: TROUBLESHOOTING

### Issue: Cannot Connect to MongoDB
**Solution:**
```bash
# Check MongoDB is running
net start MongoDB  # Windows
# Verify connection string in .env
# Check firewall/network settings
```

### Issue: Frontend Build Fails
**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: CORS Errors
**Solution:**
```javascript
// backend/server.js
const cors = require('cors');
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
```

### Issue: Port Already in Use
**Solution:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

---

## PART 6: PRODUCTION CHECKLIST

- [ ] All environment variables set correctly
- [ ] Database backups configured
- [ ] SSL/HTTPS certificate installed
- [ ] Error logging configured (Sentry, LogRocket)
- [ ] Monitoring set up (PM2, New Relic)
- [ ] API rate limiting implemented
- [ ] Security headers added (helmet.js)
- [ ] CORS properly configured
- [ ] Database indexes optimized
- [ ] Frontend built and minified
- [ ] Environment-specific configs loaded
- [ ] Health check endpoints working
- [ ] Error pages configured
- [ ] Documentation updated

---

## PART 7: QUICK START (All-in-One)

### Complete Local Setup (Copy & Paste)
```bash
# Clone and setup
git clone https://github.com/bilalkhan3266/FYP-Part-1.git
cd FYP-Part-1

# Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Create .env files
echo "PORT=5000
MONGODB_URI=mongodb://localhost:27017/fypproject
NODE_ENV=development
JWT_SECRET=dev_secret" > backend/.env

echo "REACT_APP_API_URL=http://localhost:5000/api" > frontend/.env.local

# Start MongoDB (if local)
# net start MongoDB  # Windows
# brew services start mongodb-community  # macOS

# Run backend (Terminal 1)
cd backend && npm start

# Run frontend (Terminal 2)
cd frontend && npm start
```

Open: `http://localhost:3000`

---

## Support & Additional Resources

- **MongoDB Docs**: https://docs.mongodb.com/
- **Express.js Docs**: https://expressjs.com/
- **React Docs**: https://react.dev/
- **Deployment Guides**: https://www.freecodecamp.org/news/how-to-deploy-mern/

---

**Last Updated**: April 16, 2026
