# 🚀 FYP Project - Complete Deployment Guide

## Quick Start (Choose One)

### Option 1: Local Development (Easiest)
```bash
# Double-click: START_PROJECT.bat
# Or run in terminal:
cd backend && npm start
# In another terminal:
cd frontend && npm start
```
✅ Access: http://localhost:3000

---

### Option 2: Production Build
```bash
# Double-click: BUILD_PRODUCTION.bat
# Or run in terminal:
npm run build:all
```
✅ Creates optimized frontend build
✅ Prepares backend for production

---

### Option 3: Docker Deployment (Recommended)
```bash
# Single command deployment
docker-compose up -d
```
✅ Includes MongoDB, App Server, and Nginx
✅ Auto-restart and health checks
✅ Production-ready

---

## 📋 Requirements

### For Local Development
- **Node.js** v14+ ([Download](https://nodejs.org/))
- **MongoDB** ([Download](https://www.mongodb.com/try/download/community) or use [Atlas](https://www.mongodb.com/cloud/atlas))
- **Git**
- **npm** or **yarn**

### For Docker
- **Docker** ([Download](https://www.docker.com/))
- **Docker Compose**

### For Cloud Deployment
- Heroku account (free tier available)
- Or AWS/Azure/DigitalOcean account

---

## 🏃 Quick Setup (5 Minutes)

### Step 1: Clone Repository
```bash
git clone https://github.com/bilalkhan3266/FYP-Part-1.git
cd FYP-Part-1
```

### Step 2: Setup Environment
**Backend** (`backend/.env`):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fypproject
NODE_ENV=development
JWT_SECRET=your_secret_key
CORS_ORIGIN=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):
```
REACT_APP_API_URL=http://localhost:5000/api
```

### Step 3: Install & Run
```bash
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Frontend
cd frontend
npm install
npm start
```

### Step 4: Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

---

## 🐳 Docker Deployment

### One-Command Startup
```bash
docker-compose up -d
```

### What Gets Deployed
- ✅ MongoDB (Database)
- ✅ Node.js Backend (API)
- ✅ React Frontend (Web App)
- ✅ Nginx (Reverse Proxy)

### Access
- Application: http://localhost
- Backend API: http://localhost/api

### Useful Commands
```bash
# View logs
docker-compose logs -f app

# Stop containers
docker-compose down

# Rebuild images
docker-compose up -d --build

# Check status
docker-compose ps
```

---

## ☁️ Cloud Deployment

### Deploy to Heroku

```bash
# 1. Install Heroku CLI
npm install -g heroku

# 2. Login
heroku login

# 3. Create app
heroku create your-app-name

# 4. Set environment variables
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_secret

# 5. Deploy
git push heroku master

# 6. View logs
heroku logs --tail
```

**App will be available at**: `https://your-app-name.herokuapp.com`

### Deploy to Vercel (Frontend) + Railway (Backend)

**Frontend:**
```bash
npm install -g vercel
cd frontend
vercel
```

**Backend:**
1. Go to [Railway.app](https://railway.app)
2. Connect GitHub repository
3. Set environment variables
4. Deploy

---

## 📊 Project Architecture

```
┌─────────────────────────────────────────┐
│         Client (Browser)                │
│   React App on http://localhost:3000    │
└────────────────┬────────────────────────┘
                 │ HTTP/REST
┌────────────────▼────────────────────────┐
│      Node.js Express Server             │
│   Backend API on http://localhost:5000  │
└────────────────┬────────────────────────┘
                 │ Database Connection
┌────────────────▼────────────────────────┐
│    MongoDB Database                     │
│   localhost:27017/fypproject            │
└─────────────────────────────────────────┘
```

---

## 🔧 Available Scripts

### Backend
```bash
npm start              # Start development server
npm run dev           # Start with nodemon (auto-reload)
npm run build         # Build for production
npm run test          # Run tests
```

### Frontend
```bash
npm start             # Start development server
npm run build         # Build for production
npm run test          # Run tests
npm run eject         # Eject from Create React App (irreversible)
```

---

## 🐛 Troubleshooting

### Issue: MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:**
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env
```

### Issue: Port Already in Use
```bash
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### Issue: Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Build Fails
```bash
# Clear build cache
cd frontend
rm -rf build
npm run build
```

### Issue: CORS Error
**Solution:** Update CORS_ORIGIN in backend `.env` to match your frontend URL

### Issue: 404 on Frontend Routes
**Solution:** Add this to `backend/server.js`:
```javascript
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});
```

---

## 📝 Environment Variables

### Backend Required
| Variable | Example | Purpose |
|----------|---------|---------|
| `PORT` | 5000 | Server port |
| `MONGODB_URI` | mongodb://localhost:27017/db | Database URL |
| `NODE_ENV` | development/production | Environment |
| `JWT_SECRET` | secret123 | JWT signing key |
| `CORS_ORIGIN` | http://localhost:3000 | Allowed frontend origin |

### Frontend Required
| Variable | Example | Purpose |
|----------|---------|---------|
| `REACT_APP_API_URL` | http://localhost:5000/api | Backend API URL |
| `REACT_APP_ENV` | development/production | Environment |

---

## 📦 Project Structure

```
FYP-Part-1/
├── backend/
│   ├── controllers/        # Business logic
│   ├── models/            # Database schemas
│   ├── routes/            # API endpoints
│   ├── middleware/        # Express middleware
│   ├── server.js          # Main entry point
│   ├── package.json
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom hooks
│   │   ├── context/      # Context API
│   │   └── App.js        # Main component
│   ├── public/           # Static files
│   ├── build/            # Production build (after npm run build)
│   ├── package.json
│   └── .env.local        # Frontend config
├── docs/                 # Documentation
├── Dockerfile            # Docker image config
├── docker-compose.yml    # Multi-container config
├── START_PROJECT.bat     # Quick start script
├── BUILD_PRODUCTION.bat  # Production build script
└── README.md            # This file
```

---

## ✅ Deployment Checklist

Before deploying to production:

- [ ] Backend `.env` configured with production values
- [ ] MongoDB Atlas database set up
- [ ] Frontend build optimized (`npm run build`)
- [ ] All API endpoints tested
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] CORS properly set
- [ ] Security headers added (helmet.js)
- [ ] Rate limiting configured
- [ ] Environment variables validated
- [ ] Database backups automated
- [ ] SSL/HTTPS certificate installed
- [ ] Monitoring and alerting setup
- [ ] CI/CD pipeline configured

---

## 🚀 Performance Tips

### Frontend Optimization
```bash
# Analyze bundle size
npm install -g source-map-explorer
source-map-explorer 'build/static/js/*.js'

# Enable gzip compression
# Configure in nginx or CDN

# Use lazy loading
React.lazy(() => import('./Component'))
```

### Backend Optimization
```javascript
// Enable compression
const compression = require('compression');
app.use(compression());

// Add caching headers
app.use(express.static('public', {
  maxAge: '1h'
}));

// Database indexing
db.collection.createIndex({ email: 1 });
```

---

## 📞 Support

### Common Issues
- Check DEPLOYMENT_GUIDE.md for detailed troubleshooting
- Review logs: `docker-compose logs -f`
- Check database connection: `mongosh`
- Test API: `curl http://localhost:5000/api/health`

### Documentation
- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Docker Docs](https://docs.docker.com/)

---

## 🎯 Next Steps

1. **For Development**: Run `START_PROJECT.bat`
2. **For Production**: Run `BUILD_PRODUCTION.bat` then deploy
3. **For Docker**: Run `docker-compose up`
4. **For Cloud**: Follow cloud provider guides

---

**Last Updated**: April 16, 2026
**Version**: 1.0
**Status**: ✅ Production Ready
