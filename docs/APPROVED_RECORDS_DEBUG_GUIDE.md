# Debugging Guide: Approved Records Not Showing

## Step 1: Check Backend Data
The completed clearances EXIST in the database (verified by seed test):
- ✅ 4 completed clearances found
- ✅ 3 in-progress with partial approvals found

## Step 2: Verify Backend Endpoint Returns Data

1. Start the backend:
```bash
cd backend
npm start
```

2. Watch the console for logs like:
```
📋 Department Library (library@example.com):
   📌 Pending: 1 | 🚫 Rejected: 0 | ✅ Approved: 4
   ├─ Completed clearances: 4
   └─ This phase approved: 0
   📦 Sample approved records:
      • SAP: 443545 | Status: Completed
      • SAP: 4839777 | Status: Completed
```

If you see this, the backend is working correctly!

## Step 3: Check Frontend Receives Data

1. Start the frontend:
```bash
cd frontend
npm start
```

2. Open browser DevTools (F12)
3. Go to Console tab
4. Login as library@example.com / password123
5. Click on "Approved" tab
6. Look for console logs like:
```
📥 Received approved records: 4
   Data: [Array(4)]
```

If you see this with a count > 0, frontend is receiving the data!

## Step 4: If Data Shows But Not Displayed

Check if there's a rendering issue:
1. Press F12 -> Console
2. Run this command:
```javascript
// Find the requests in React state
const libraryComponent = document.querySelector('[class*="LibraryDashboard"]');
console.log(libraryComponent);
```

3. Check "Network" tab in DevTools:
   - Make sure the API call to `/api/clearance/department` returns a response
   - Look for the "approved" array in the Response

## Step 5: Verify Tab Classes

The "Approved" tab might be hidden. Check by running in Console:
```javascript
// Check if Approved tab exists and is visible
const approvedTab = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Approved'));
console.log("Approved Tab:", approvedTab);
console.log("Is Hidden:", approvedTab?.style.display === 'none');
```

## Testing Checklist

- [ ] Backend started with `npm start` in backend folder
- [ ] Frontend started with `npm start` in frontend folder
- [ ] Logged in as library@example.com
- [ ] Clicked "Approved" tab
- [ ] Checked browser console (F12) for logs
- [ ] No console errors shown
- [ ] Network tab shows API response with approved array

## Common Issues

### Issue: 404 Error on /api/clearance/department
**Fix:** Make sure backend is running on port 5000

### Issue: Unauthorized Error
**Fix:** Make sure you're logged in with a valid department staff token

### Issue: Empty Approved Tab but Console Shows Data
**Fix:** Check for rendering/CSS issues - the data exists but isn't displayed

### Issue: Backend Not Logging Department Fetch
**Fix:** Make sure the backend has the latest code with console.log statements
