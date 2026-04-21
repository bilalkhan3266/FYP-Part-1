// Manual Test Script for Clearance Flow
// Run this in browser console on the Production Frontend

async function testClearanceFlow() {
  console.clear();
  console.log("🔍 TESTING CLEARANCE FLOW - Manual Test");
  console.log("=".repeat(60));

  try {
    // Step 1: Get current user
    console.log("\n1️⃣ GET CURRENT USER");
    const authResponse = await api.get("/api/auth/profile");
    const student = authResponse.data;
    console.log("✅ Current user:", {
      id: student._id,
      name: student.full_name,
      sap: student.sap,
      email: student.email
    });

    // Step 2: Check existing clearance
    console.log("\n2️⃣ CHECK EXISTING CLEARANCE STATUS");
    try {
      const statusResponse = await api.get("/api/clearance-status");
      console.log("✅ Existing status:", {
        hasRecord: statusResponse.data.data !== null,
        overallStatus: statusResponse.data.data?.overallStatus,
        departmentCount: statusResponse.data.departmentStatuses?.length || 0,
        summary: statusResponse.data.summary
      });
    } catch (e) {
      console.log("⚠️ No existing record");
    }

    // Step 3: Check if can submit
    console.log("\n3️⃣ CHECKING IF CAN SUBMIT NEW REQUEST");
    try {
      const historyResponse = await api.get("/api/clearance-requests");
      console.log("✅ Clearance history:", {
        totalRequests: historyResponse.data.data?.length || 0,
        latestStatus: historyResponse.data.data?.[0]?.status,
        latestDate: historyResponse.data.data?.[0]?.createdAt
      });
    } catch (e) {
      console.log("⚠️ No clearance history");
    }

    // Step 4: Show expected vs actual
    console.log("\n4️⃣ FRONTEND DEPARTMENTS");
    const frontendDepts = [
      "Coordination", "Transport", "Library", 
      "Fee Department", "Student Service"
    ];
    console.log("Expected departments:", frontendDepts);

    console.log("\n" + "=".repeat(60));
    console.log("📝 TEST COMPLETE - Check steps above for any issues");
    console.log("\nNext: Submit a form and check logs:");
    console.log("- Should see 'Clearance request submitted successfully!'");
    console.log("- Should show departmentStatuses array with 5 items");
    console.log("- Should redirect to Dashboard");
    console.log("- Dashboard should show 'Fetching clearance status...'");
    console.log("- Should display department cards with statuses");

  } catch (err) {
    console.error("❌ Test failed:", err.message);
    console.error("Error details:", err);
  }
}

// Run the test
testClearanceFlow();

// Log instructions
console.log("\n💡 HOW TO USE:");
console.log("1. Make sure you're logged in as a student");
console.log("2. Copy and paste the code above into browser console");
console.log("3. Press Enter to run the test");
console.log("4. Check for any errors or unexpected values");
console.log("5. Then submit a form and check the logs");
