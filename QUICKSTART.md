# Quick Start Guide - Authentication System Setup

## Prerequisites
- Node.js v14+
- MySQL Server running
- npm or yarn

## Installation Steps

### 1. Backend Setup

```bash
cd my-app/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your database credentials
# - DB_HOST: localhost (or your server)
# - DB_USER: root (or your user)
# - DB_PASSWORD: your_password
# - DB_NAME: role_based_system
# - JWT_SECRET: change_me_in_production (use strong secret)
```

### 2. Database Setup

```sql
-- Create database
CREATE DATABASE role_based_system;

-- Create users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  sap VARCHAR(50),
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create clearance_requests table
CREATE TABLE clearance_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  sapid VARCHAR(50),
  student_name VARCHAR(100),
  registration_no VARCHAR(50),
  father_name VARCHAR(100),
  program VARCHAR(100),
  semester VARCHAR(10),
  degree_status VARCHAR(50),
  submitted_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'Pending',
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 3. Frontend Setup

```bash
cd ../

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# .env should contain:
# REACT_APP_API_URL=http://localhost:5000
```

### 4. Start Development

**Terminal 1 - Backend:**
```bash
cd my-app/backend
npm run dev  # Uses nodemon for auto-reload
# Should see: ✓ Server running on port 5000
```

**Terminal 2 - Frontend:**
```bash
cd my-app
npm start
# Should open http://localhost:3000 in browser
```

---

## Testing the System

### 1. Create Account

1. Navigate to http://localhost:3000
2. Click "Sign Up"
3. Fill in form:
   - **Full Name**: Test User
   - **Email**: test@example.com
   - **Password**: TestPass123 (min 6 chars, at least 1 letter)
   - **Role**: Student
4. Click "Sign Up"
5. Should see success message

### 2. Login

1. On login page, enter:
   - **Email**: test@example.com
   - **Password**: TestPass123
2. Click "Login"
3. Should redirect to Student Dashboard

### 3. View Profile

1. In Student Dashboard, click "Edit Profile"
2. Should see populated form with:
   - Full Name: Test User
   - Email: test@example.com
   - SAP ID: N/A
   - Department: N/A

### 4. Update Profile

1. Change "Full Name" to "Updated User"
2. Add SAP ID: "12345"
3. Add Department: "Engineering"
4. Click "Save Changes"
5. Should see success message and redirect to dashboard

### 5. Test Logout

1. Click "Logout" button in sidebar
2. Should redirect to login page
3. All auth data cleared

---

## API Testing (with curl)

### Signup
```bash
curl -X POST http://localhost:5000/signup \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "password": "JohnPass123",
    "role": "Student",
    "sap": "2024001",
    "department": "Engineering"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "JohnPass123"
  }'
```

**Response includes token:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "Student",
  "name": "John Doe",
  ...
}
```

### Get Profile (with token)
```bash
TOKEN="your_token_from_login"

curl -X GET http://localhost:5000/get-profile \
  -H "Authorization: Bearer $TOKEN"
```

---

## Folder Structure

```
my-app/
├── backend/
│   ├── server.js           # Main server file
│   ├── utils.js            # Validation and error handling
│   ├── db.js               # Database connection
│   ├── package.json
│   └── .env.example        # Environment variables template
│
├── src/
│   ├── contexts/
│   │   └── AuthContext.js  # Auth state management (NEW)
│   ├── auth/
│   │   ├── Login.js        # Login component (UPDATED)
│   │   └── Signup.js       # Signup component (UPDATED)
│   ├── components/
│   │   └── Student/
│   │       ├── Dashboard.js      # Student dashboard (UPDATED)
│   │       └── EditProfile.js    # Edit profile (UPDATED)
│   ├── routes/
│   │   └── ProtectedRoute.js     # Route protection (UPDATED)
│   ├── services/
│   │   └── api.js          # API service with interceptors (UPDATED)
│   └── App.js              # Main app (UPDATED - wrapped with AuthProvider)
│
├── AUTHENTICATION_GUIDE.md  # Complete API documentation (NEW)
├── IMPROVEMENTS_SUMMARY.md  # Changes overview (NEW)
└── .env.example           # Frontend env template (NEW)
```

---

## Common Issues & Solutions

### Issue: "Cannot find module 'dotenv'"
**Solution:**
```bash
cd backend
npm install dotenv
```

### Issue: "Connect ECONNREFUSED - MySQL not running"
**Solution:**
- Start MySQL service:
  - **Windows**: `services.msc` → Start MySQL
  - **Mac**: `brew services start mysql`
  - **Linux**: `sudo service mysql start`

### Issue: "Email already registered" on signup
**Solution:** Use different email or clear database

### Issue: "Invalid token" error
**Solution:** 
- Token may have expired (2 hour limit)
- Login again to get new token

### Issue: CORS error in browser console
**Solution:**
- Check `.env` file has correct `CORS_ORIGIN`
- Default is `http://localhost:3000`

### Issue: "Database error" on login
**Solution:**
- Check database connection in `.env`
- Run SQL setup script to create tables
- Check MySQL is running

---

## Environment Variables

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
```

### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=role_based_system

# JWT
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRE=2h

# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

---

## Features Overview

✅ **Secure Authentication**
- JWT token-based
- Password hashing with bcrypt
- Email validation

✅ **Role-Based Access**
- 8 user roles supported
- Protected routes
- Role verification

✅ **User Management**
- Signup with validation
- Login with security
- Profile editing
- Profile viewing

✅ **Error Handling**
- Standardized error codes
- User-friendly messages
- Server logging

✅ **State Management**
- React Context for auth state
- Auto-logout on token expiration
- Profile syncing

---

## Next Steps

1. ✅ Test authentication flows
2. ✅ Review `AUTHENTICATION_GUIDE.md` for API details
3. ✅ Customize for your needs
4. ✅ Setup production environment
5. ✅ Add email verification (optional)
6. ✅ Setup rate limiting (optional)

---

## Support

For more information:
- API Documentation: See `AUTHENTICATION_GUIDE.md`
- Implementation Details: See `IMPROVEMENTS_SUMMARY.md`
- Code Comments: Check source files for inline documentation

---

## Production Checklist

Before deploying to production:

- [ ] Change JWT_SECRET to strong random value
- [ ] Set NODE_ENV=production
- [ ] Update CORS_ORIGIN to your domain
- [ ] Use environment-specific credentials
- [ ] Enable HTTPS
- [ ] Setup database backups
- [ ] Configure error monitoring
- [ ] Test all auth flows
- [ ] Review security settings
- [ ] Setup logging/audit trail

Happy coding! 🚀
