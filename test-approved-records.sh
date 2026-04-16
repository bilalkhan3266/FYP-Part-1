#!/bin/bash
# Quick test script for approved records functionality

echo "=================================================="
echo "Testing Approved Records Feature"
echo "=================================================="
echo ""
echo "Make sure backend is running: cd backend && npm start"
echo ""

# Test endpoint 1: Check if completed records exist (no auth needed)
echo "🧪 Test 1: Checking if completed clearances exist in database..."
echo ""
curl -s http://localhost:5000/api/clearance/test/approved | jq . 2>/dev/null || {
  echo "❌ Cannot reach backend at http://localhost:5000"
  echo "Please start the backend first: cd backend && npm start"
  exit 1
}

echo ""
echo "=================================================="
echo "To test the full flow with authentication:"
echo "=================================================="
echo ""
echo "1. Start backend:   cd backend && npm start"
echo "2. Start frontend:  cd frontend && npm start"
echo "3. Open browser:    http://localhost:3000"
echo "4. Login as:        library@example.com / password123"
echo "5. Click 'Approved' tab"
echo "6. Open F12 DevTools -> Console"
echo "7. You should see logs like:"
echo "   📥 Received approved records: X"
echo ""
echo "If you see 0 records but test endpoint shows records:"
echo "   - Check if you're logged in as a department staff user"
echo "   - Check browser console for errors"
echo "   - Check backend logs for department matching issues"
echo ""
