# 🗄️ MongoDB Atlas Setup Guide (Free Tier)

## 📋 What is MongoDB Atlas?

MongoDB Atlas is MongoDB's cloud database service. The free M0 tier gives you:
- ✅ 512MB storage
- ✅ Unlimited requests
- ✅ Automatic backups
- ✅ No credit card required
- 💰 **Completely FREE**

---

## 🎯 Step 1: Create MongoDB Atlas Account (2 minutes)

1. Go to **https://www.mongodb.com/cloud/atlas**
2. Click **"Try Free"** or **"Sign Up"**
3. Choose: **"Sign up with Email"** (or Google/GitHub)
4. Fill in:
   - First Name: Your first name
   - Last Name: Your last name
   - Email: Your email
   - Password: Strong password (8+ characters)
5. Check **"I agree to the Atlas Terms of Service"**
6. Click **"Create your Atlas account"**
7. Verify your email (check inbox)
8. Accept the Terms of Service
9. Click **"Continue"**

---

## 🎯 Step 2: Create Free M0 Cluster (5 minutes)

1. You're now in MongoDB Atlas dashboard
2. Click **"Build a Database"** or **"+ Create"**
3. Choose **"M0 Free"** (it's highlighted)
4. Click **"Create Deployment"**
5. Select deployment settings:
   - **Cloud Provider**: AWS (or your preference)
   - **Region**: Choose closest to you (or any)
   - Click **"Create Deployment"**
6. Wait 2-3 minutes for cluster to be created
7. You'll see notification: **"Your Atlas cluster has been created"**

---

## 🎯 Step 3: Create Database User (2 minutes)

1. In Dashboard, go to **"Security"** → **"Database Access"**
2. Click **"+ Add New Database User"**
3. Choose **"Password"** (not X.509 Certificate)
4. Fill in:
   - **Username**: `admin`
   - **Password**: `Password123` (or your preferred password)
   - **Confirm Password**: Same as above
5. In "Database User Privileges", keep **"Built-in Role"** → **"Atlas admin"**
6. Click **"Add User"**
7. User created successfully! ✅

---

## 🎯 Step 4: Configure IP Whitelist (1 minute)

1. Go to **"Security"** → **"Network Access"**
2. Click **"+ Add IP Address"**
3. Click **"Allow Access from Anywhere"**
   - This adds `0.0.0.0/0` (all IPs)
4. Click **"Confirm"**
5. ⚠️ **Note:** This is OK for development. For production, restrict to your app's IP.

---

## 🎯 Step 5: Get Connection String (2 minutes)

1. Go to **"Deployment"** → **"Databases"**
2. Click your cluster (e.g., "Cluster0")
3. Click **"Connect"**
4. Choose **"Drivers"** tab
5. Select **"Node.js"** and version **"4.x"**
6. Copy the connection string:
   ```
   mongodb+srv://admin:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
   ```
7. **Replace `<password>` with your password** (e.g., `Password123`)
   
   **Result:**
   ```
   mongodb+srv://admin:Password123@cluster0.mongodb.net/?retryWrites=true&w=majority
   ```

---

## 🎯 Step 6: Create Database & Collection (Optional but recommended)

1. Go to **"Deployment"** → **"Databases"**
2. Click your cluster
3. Go to **"Collections"** tab
4. Click **"Create Database"**
5. Fill in:
   - **Database name**: `fypproject`
   - **Collection name**: `clearanceworkflows`
   - Click **"Create"**
6. Your database is ready! ✅

---

## 📋 Your Connection Details

Save these for later use:

```yaml
# Connection String
mongodb+srv://admin:Password123@cluster0.mongodb.net/fypproject

# Components:
- Host: cluster0.mongodb.net (your cluster)
- Username: admin
- Password: Password123
- Database: fypproject
- Collection: clearanceworkflows
```

---

## 🔗 Add Connection String to Environment

### For Railway Backend:

1. Go to Railway dashboard
2. Select your backend service
3. Go to **"Variables"**
4. Add:
   - **Variable Name**: `MONGODB_URI`
   - **Value**: `mongodb+srv://admin:Password123@cluster0.mongodb.net/fypproject`
5. Click **"Save"**

### For Local Development:

1. Create/Edit `my-app/backend/.env.local`:
   ```
   MONGODB_URI=mongodb+srv://admin:Password123@cluster0.mongodb.net/fypproject
   ```

---

## 🧪 Test Connection

### From MongoDB Atlas UI:
1. Go to **"Deployment"** → **"Databases"**
2. Click your cluster
3. Click **"Collections"** tab
4. You should see your database and collections

### From Backend Code:
The backend will log when connected:
```
✅ MongoDB connected successfully!
```

### From MongoDB Compass (Optional):
1. Download MongoDB Compass: https://www.mongodb.com/products/compass
2. Open Compass
3. Paste connection string
4. Click "Connect"
5. Browse your data

---

## 📊 Free Tier Limits

| Feature | Limit | Status |
|---------|-------|--------|
| Storage | 512 MB | Enough for dev/test |
| Connections | 100 concurrent | Plenty for startup |
| API Calls | Unlimited | ✅ |
| Backups | Automatic | ✅ |
| Database Users | Unlimited | ✅ |
| Databases | Unlimited | ✅ |
| Collections | Unlimited | ✅ |
| **Cost** | **FREE** | ✅ |

---

## ⚠️ Important Notes

1. **Password**: Don't commit real passwords to GitHub
   - Use environment variables instead
   - Store in `.env` files (not committed)

2. **Security**: 
   - Change `0.0.0.0/0` to specific IPs for production
   - Use strong passwords
   - Rotate credentials periodically

3. **Backups**:
   - Atlas auto-backs up to 30 days
   - Free tier retains 8 snapshots

---

## 🆘 Troubleshooting

### "Authentication failed"
- Check username and password in connection string
- Ensure IP address is whitelisted
- Verify database user exists in Atlas

### "Connection timeout"
- Check if MongoDB Atlas cluster is running
- Verify network connectivity
- Check firewall settings

### "Database not found"
- The database is created automatically when you insert data
- No need to manually create it unless you want to

---

## ✅ Checklist

- [ ] MongoDB Atlas account created
- [ ] M0 cluster created
- [ ] Database user created (admin / Password123)
- [ ] IP whitelist configured (0.0.0.0/0)
- [ ] Connection string obtained
- [ ] Connection string added to Railway variables
- [ ] Database created (fypproject)
- [ ] Collections created (clearanceworkflows)
- [ ] Test connection successful

---

## 🔗 Useful Links

- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- Connection Methods: https://docs.mongodb.com/atlas/driver-connection
- IP Whitelist: https://docs.mongodb.com/atlas/security/ip-access-list
- Pricing: https://www.mongodb.com/cloud/atlas/pricing

---

**Status:** Ready for database deployment  
**Cost:** FREE (M0 Tier)  
**Last Updated:** April 17, 2026
