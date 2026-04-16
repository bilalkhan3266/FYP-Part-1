# IMMEDIATE FIX: Bulk Auto-Approval

The manual approve endpoint is returning 404, but the **bulk auto-approval endpoint** queries the database directly without relying on ID matching, so it should work.

## Run This Command in Browser Console:

```javascript
const token = localStorage.getItem('token');
console.log('🚀 Starting bulk auto-approval of 61 pending requests...');

fetch('http://localhost:5000/api/clearance/bulk-auto-approve', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
})
.then(r => {
  console.log('Response status:', r.status);
  return r.json();
})
.then(data => {
  console.log('=== ✅ BULK AUTO-APPROVAL RESULTS ===');
  console.log('Approved:', data.approved);
  console.log('Failed:', data.failed);
  console.log('Total:', data.approved + data.failed);
  
  if (data.failed > 0 && data.results) {
    console.log('\n❌ Failures:');
    data.results
      .filter(r => r.status === 'failed')
      .slice(0, 5)
      .forEach(r => {
        console.log(`  • ${r.workflowId}: ${r.error}`);
      });
  }
})
.catch(e => console.error('❌ Error:', e))
```

## Steps:

1. Open http://localhost:3001 in browser
2. Press `F12` → **Console** tab
3. Copy-paste the command above
4. Press **Enter**

## Expected Output:
```
Approved: 61
Failed: 0
Total: 61
```

## After Completion:

1. **Hard refresh page**: `Ctrl+Shift+R`
2. Check **Pending tab**: Should show 0 requests
3. Check **Approved tab**: Should show 61+ completed records

---

## If Still Getting 404 Errors

Run this diagnostic in console to see the actual data structure:

```javascript
fetch('http://localhost:5000/api/clearance/department', {
  headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')}
})
.then(r => r.json())
.then(d => {
  if (d.pending && d.pending.length > 0) {
    const first = d.pending[0];
    console.log('=== FIRST RECORD ===');
    console.log('Keys:', Object.keys(first));
    console.log('_id:', first._id);
    console.log('Full:', JSON.stringify(first, null, 2));
  }
})
```

---

**Try bulk auto-approval first - it's the fastest way to clear the 61 pending requests.**
