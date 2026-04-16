# Browser Diagnostic: Check Actual API Response IDs

Run this command in your browser console (F12 → Console tab) to see what the API is actually returning:

```javascript
// Step 1: Fetch and compare IDs
fetch('http://localhost:5000/api/clearance/department', {
  headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')}
})
.then(r => r.json())
.then(data => {
  console.log('=== API RESPONSE DEBUG ===\n');
  
  // Check pending records
  if (data.pending && data.pending.length > 0) {
    console.log(`📌 PENDING RECORDS: ${data.pending.length}\n`);
    const first3 = data.pending.slice(0, 3);
    first3.forEach((req, i) => {
      console.log(`Record ${i+1}:`);
      console.log(`  _id: ${req._id}`);
      console.log(`  sapid: ${req.sapid}`);
      console.log(`  studentName: ${req.studentName}`);
      console.log('');
    });
  } else {
    console.log('❌ No pending records in response!');
  }
  
  // Check approved records
  if (data.approved && data.approved.length > 0) {
    console.log(`\n📌 APPROVED RECORDS: ${data.approved.length}\n`);
    const first3 = data.approved.slice(0, 3);
    first3.forEach((req, i) => {
      console.log(`Record ${i+1}:`);
      console.log(`  _id: ${req._id}`);
      console.log(`  sapid: ${req.sapid}`);
      console.log(`  overallStatus: ${req.overallStatus}`);
      console.log('');
    });
  }
  
  // Check if ID you tried to approve exists
  const problemId = '69ce83d1ad4173faf2c7da90';
  console.log(`\n🔍 Looking for ID: ${problemId}`);
  const found = [
    ...(data.pending || []),
    ...(data.approved || []),
    ...(data.rejected || [])
  ].find(r => r._id === problemId);
  
  console.log(found ? '✅ FOUND!' : '❌ NOT FOUND in API response!');
  
  // Show all response keys
  console.log('\nResponse keys:', Object.keys(data));
})
.catch(e => console.error('Error:', e))
```

---

## What This Will Show:

1. **How many pending/approved/rejected records the API actually returns**
2. **What the actual `_id` values are** for the first 3 records
3. **Whether the problematic ID `69ce83d1ad4173faf2c7da90` exists in the API response**

---

## Then Run This to Check Database State:

```javascript
// Step 2: Count all records
(async () => {
  const response = await fetch('http://localhost:5000/api/clearance/department', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')}
  });
  const data = await response.json();
  
  console.log('\n📊 TOTALS:');
  console.log('Pending:', (data.pending || []).length);
  console.log('Approved:', (data.approved || []).length);
  console.log('Rejected:', (data.rejected || []).length);
  console.log('TOTAL:', (data.pending || []).length + (data.approved || []).length + (data.rejected || []).length);
})();
```

---

## Run These Now and Share:

1. Output from Step 1 (first few record IDs)
2. Output from Step 2 (total counts)

This will show me:
- ✅ If the API is returning 61 records (matching your logs)
- ✅ What the actual IDs look like
- ✅ Why the approve endpoint returns 404

**Running this will help me fix the ID mismatch issue!**
