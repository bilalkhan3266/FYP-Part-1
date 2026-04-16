// Test: Check if Pending Requests Have Data

// Run this in browser console (F12 -> Console tab)
// To verify student names and dates are coming from backend

console.log("🧪 TESTING PENDING DATA...\n");

fetch('/api/clearance/department', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
  }
})
.then(r => r.json())
.then(data => {
  console.log("✅ API Response received");
  console.log("📊 Pending requests:", data.pending?.length || 0);
  
  if (data.pending && data.pending.length > 0) {
    console.log("\n📋 First Pending Request Data:");
    console.log({
      _id: data.pending[0]._id,
      studentName: data.pending[0].studentName,
      sapid: data.pending[0].sapid,
      program: data.pending[0].program,
      submittedAt: data.pending[0].submittedAt,
      overallStatus: data.pending[0].overallStatus,
      currentPhase: data.pending[0].currentPhase,
      phaseStatus: data.pending[0].phaseStatus,
    });
    
    console.log("\n📝 All Field Names Present:");
    console.log(Object.keys(data.pending[0]));
  }
  
  console.log("\n✨ Check frontend console logs for mapped data");
})
.catch(e => console.error("❌ Error:", e));
