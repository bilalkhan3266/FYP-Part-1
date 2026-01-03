# Step-by-Step Form Testing & Verification Guide

## 🎯 QUICK START TESTING

### Prerequisites:
- Backend server running on port 5000
- Frontend running on port 3000
- Admin user logged in
- Browser developer tools open (F12) for debugging

---

## 📋 TEST CASE 1: Form Navigation & Step Progression

### Test 1.1: Initial Form Display
**Steps:**
1. Go to Admin Dashboard
2. Click "User Management" in sidebar
3. Click "Create New User" button

**Expected Result:**
- ✅ Modal opens with title "Create New User Account"
- ✅ Form shows progress indicator with 3 circles (1, 2, 3)
- ✅ Circle "1" is active (purple/gradient)
- ✅ Only "Step 1: Personal Information" section is visible
- ✅ Full Name and Email fields are shown
- ✅ Cancel and Next buttons appear
- ✅ Back and Submit buttons are hidden

---

### Test 1.2: Step 1 → Step 2 Navigation
**Prerequisites:** Form is open on Step 1

**Steps:**
1. Enter Full Name: "John Doe"
2. Enter Email: "john.new@example.com" (use unique email not in database)
3. Wait for email blur validation to complete (1-2 seconds)
4. Click "Next →" button

**Expected Result:**
- ✅ If email doesn't exist: No error shown
- ✅ Form advances to Step 2: Security & Password
- ✅ Progress indicator shows step "2" as active
- ✅ Step 1 and 3 circles fade to inactive
- ✅ Password and Confirm Password fields are visible
- ✅ Eye icons appear next to password fields
- ✅ Password Strength Indicator is displayed
- ✅ "Back" button appears
- ✅ "Next →" button is visible (not "Submit")

---

### Test 1.3: Step 2 → Step 3 Navigation
**Prerequisites:** Form is on Step 2 with valid password entered

**Steps:**
1. Enter Password: "TestPass123!abc"
2. Enter Confirm Password: "TestPass123!abc"
3. Click "Next →" button

**Expected Result:**
- ✅ Form advances to Step 3: Department & Role
- ✅ Progress indicator shows step "3" as active
- ✅ Role and Department dropdowns are visible
- ✅ SAP ID optional field is shown
- ✅ "Back" button still appears
- ✅ "Next →" button is replaced with "✅ Create User" submit button

---

### Test 1.4: Back Navigation
**Prerequisites:** Form is on Step 2

**Steps:**
1. Click "← Back" button

**Expected Result:**
- ✅ Returns to Step 1: Personal Information
- ✅ All previously entered data is preserved
- ✅ Progress indicator shows step "1" as active
- ✅ Form errors are cleared

---

## ✅ TEST CASE 2: Email Validation

### Test 2.1: Email Existence Check (Email Already Exists)
**Prerequisites:** Form is on Step 1

**Steps:**
1. Enter Full Name: "Test User"
2. Enter Email: "admin@example.com" (email that exists in system)
3. Click somewhere else or Tab to trigger onBlur event
4. Wait 1-2 seconds for API call

**Expected Result:**
- ✅ Email input gets red border (input-error class)
- ✅ Error message appears below: "❌ This email is already registered"
- ✅ "Next →" button click does nothing (validation fails)
- ✅ User cannot proceed to Step 2

**Browser Console Check:**
```
POST /api/admin/check-email → Response: { success: true, exists: true }
```

---

### Test 2.2: Email Error Clears When Corrected
**Prerequisites:** Error message showing for duplicate email

**Steps:**
1. Change email to new unique email (e.g., "newuser123@example.com")
2. Start typing in email field (onChange event)

**Expected Result:**
- ✅ Error message disappears immediately
- ✅ Input border returns to normal (no red)
- ✅ onBlur validation will check new email
- ✅ If new email is unique, no error appears

---

### Test 2.3: Email Format Validation
**Prerequisites:** Form is on Step 1

**Steps:**
1. Enter Email: "invalidemail" (missing @domain.com)
2. Click Next button

**Expected Result:**
- ✅ Error shows: "❌ Please enter a valid email address"
- ✅ Email field gets red border
- ✅ Form doesn't advance

---

### Test 2.4: Required Email Field
**Prerequisites:** Form is on Step 1

**Steps:**
1. Leave email empty
2. Click Next button

**Expected Result:**
- ✅ Error shows: "❌ Email is required"
- ✅ Form doesn't advance

---

## 🔐 TEST CASE 3: Password Validation

### Test 3.1: Password Visibility Toggle
**Prerequisites:** Form is on Step 2

**Steps:**
1. Enter Password: "TestPass123!"
2. Verify password field shows dots (••••••••••••)
3. Click eye icon next to password field
4. Verify password is now visible as text
5. Click eye icon again
6. Verify password is hidden again (dots)

**Expected Result:**
- ✅ Eye icon toggles password visibility
- ✅ Input type switches between "password" and "text"
- ✅ All password characters remain intact
- ✅ Same works for "Confirm Password" field

---

### Test 3.2: Password Strength Indicator
**Prerequisites:** Form is on Step 2, Password field visible

**Steps:**
1. Type various passwords and observe strength indicator:
   - "weak" → Very Weak (red)
   - "Medium123" → Medium (yellow)
   - "Strong123!@#" → Strong (green)

**Expected Result:**
- ✅ PasswordStrengthIndicator component displays correctly
- ✅ Color changes based on password strength
- ✅ Label shows strength level

---

### Test 3.3: Password Requirements Validation
**Prerequisites:** Form is on Step 2

**Test 3.3a: Too Short (less than 8 characters)**
- Enter Password: "Test12!"
- Click Next
- Error: "❌ Password must be at least 8 characters long"

**Test 3.3b: Missing Number**
- Enter Password: "TestPassAbc!"
- Click Next
- Error: "❌ Password must contain at least one number (0-9)"

**Test 3.3c: Missing Letter**
- Enter Password: "12345678!"
- Click Next
- Error: "❌ Password must contain at least one letter (a-z, A-Z)"

**Test 3.3d: Missing Special Character**
- Enter Password: "TestPass123"
- Click Next
- Error: "❌ Password must contain at least one special character (!@#$%^&*...)"

**Test 3.3e: All Requirements Met**
- Enter Password: "TestPass123!"
- Click Next
- Result: ✅ No error, proceeds to confirmation

---

### Test 3.4: Confirm Password Validation
**Prerequisites:** Form is on Step 2, Password field filled

**Test 3.4a: Confirm Password Empty**
- Enter Password: "TestPass123!"
- Leave Confirm Password empty
- Click Next
- Error: "❌ Please confirm your password"

**Test 3.4b: Passwords Don't Match**
- Enter Password: "TestPass123!"
- Enter Confirm Password: "DifferentPass123!"
- Click Next
- Error: "❌ Passwords do not match"

**Test 3.4c: Passwords Match**
- Enter Password: "TestPass123!"
- Enter Confirm Password: "TestPass123!"
- Click Next
- Result: ✅ No error, proceeds to Step 3

---

### Test 3.5: Confirm Password Visibility Toggle
**Prerequisites:** Form is on Step 2

**Steps:**
1. Enter in Confirm Password field: "TestPass123!"
2. Verify it shows as dots
3. Click eye icon next to Confirm Password field
4. Text becomes visible
5. Click eye icon again
6. Text becomes dots again

**Expected Result:**
- ✅ Confirm Password field toggle works independently
- ✅ Can show/hide password and confirm separately
- ✅ Both fields can be shown/hidden together or separately

---

## 👔 TEST CASE 4: Step 3 - Department & Role Selection

### Test 4.1: Role Auto-Population
**Prerequisites:** Form is on Step 3

**Steps:**
1. Select Role: "📚 Library Staff"
2. Observe Department field

**Expected Result:**
- ✅ Department auto-populates to "Library"

**Repeat for other roles:**
- Transport Staff → Transport
- Laboratory Staff → Laboratory
- Student Service Staff → Student Service
- Fee Department Staff → Fee Department
- Coordination Staff → Coordination
- HOD → HOD
- Admin → (stays as selected)

---

### Test 4.2: Manual Department Override
**Prerequisites:** Form is on Step 3

**Steps:**
1. Select Role: "📚 Library Staff" (department becomes "Library")
2. Click Department dropdown
3. Select "Transport" manually

**Expected Result:**
- ✅ Department changes to selected value
- ✅ Manual selection overrides auto-population
- ✅ No error or warning appears

---

### Test 4.3: Optional SAP ID Field
**Prerequisites:** Form is on Step 3

**Test 4.3a: Submit without SAP ID**
- Leave SAP ID empty
- Select Role and Department
- Click "✅ Create User"
- Result: ✅ User created successfully (SAP ID is optional)

**Test 4.3b: Submit with SAP ID**
- Enter SAP ID: "12345"
- Select Role and Department
- Click "✅ Create User"
- Result: ✅ User created with SAP ID

---

## ✅ TEST CASE 5: Form Submission

### Test 5.1: Successful User Creation
**Prerequisites:** Complete all 3 steps with valid data

**Steps:**
1. Step 1: Full Name "John Doe", Email "john.doe.new@test.com"
2. Step 2: Password "ValidPass123!", Confirm "ValidPass123!"
3. Step 3: Role "Transport Staff", Department "Transport"
4. Click "✅ Create User"

**Expected Result:**
- ✅ Loading indicator appears: "⟳ Creating..."
- ✅ Success message displays: "✅ User created successfully! [Timestamp]"
- ✅ Modal closes automatically
- ✅ New user appears in the users table
- ✅ Form fields reset to default values
- ✅ Success message disappears after 5 seconds

**Browser Console Check:**
```
POST /api/admin/create-user → Response: { success: true, message: "✅ User ... created successfully", data: {...} }
```

---

### Test 5.2: Form Cancel Button
**Prerequisites:** Form is partially filled (any step)

**Steps:**
1. Fill some fields (doesn't matter which step)
2. Click "✕ Cancel" button

**Expected Result:**
- ✅ Modal closes immediately
- ✅ Form data is cleared (not saved)
- ✅ User returns to admin dashboard
- ✅ Form step resets to 1 for next open
- ✅ No success or error messages

---

## 🎨 TEST CASE 6: Visual & UI Testing

### Test 6.1: Progress Indicator Visual Feedback
**Step 1 Active:**
- Circle 1: ● (filled purple/gradient)
- Connector 1→2: - (gray)
- Circle 2: ○ (unfilled)
- Connector 2→3: - (gray)
- Circle 3: ○ (unfilled)

**Step 2 Active:**
- Circle 1: ● (filled purple)
- Connector 1→2: — (purple gradient)
- Circle 2: ● (filled purple)
- Connector 2→3: - (gray)
- Circle 3: ○ (unfilled)

**Step 3 Active:**
- Circle 1: ● (filled)
- Connector 1→2: — (purple)
- Circle 2: ● (filled)
- Connector 2→3: — (purple)
- Circle 3: ● (filled)

---

### Test 6.2: Error Message Display
**Steps:**
1. Trigger an error (e.g., invalid email format)
2. Observe error styling

**Expected Visual:**
- ✅ Error text is red (#ff4444)
- ✅ Error text is small (12px)
- ✅ Input has red border
- ✅ Input background is light red (#fff5f5)
- ✅ Error message appears directly below input
- ✅ Error message has 6px margin-top

---

### Test 6.3: Form Spacing & Alignment
**Expected Layout:**
- ✅ Form sections have 28px padding
- ✅ Form row has 28px gap between columns
- ✅ Step indicator (number circle) is 44px
- ✅ All icons (👤, 📧, 🔑, etc.) display correctly
- ✅ Form is centered in modal
- ✅ Modal has rounded corners (12px)
- ✅ Overall layout is responsive

---

## 🔌 TEST CASE 7: API Integration

### Test 7.1: Check Email Endpoint
**Endpoint:** `POST /api/admin/check-email`

**Steps:**
1. Open Browser DevTools → Network tab
2. Go to Step 1
3. Enter existing email
4. Tab or blur from email field
5. Observe Network request

**Expected:**
```
POST /api/admin/check-email
Headers: Authorization: Bearer {token}
Body: { email: "existing@example.com" }
Response: { success: true, exists: true }
Status: 200
```

---

### Test 7.2: Create User Endpoint
**Endpoint:** `POST /api/admin/create-user`

**Steps:**
1. Complete all 3 steps with valid data
2. Click Submit
3. Observe Network request

**Expected:**
```
POST /api/admin/create-user
Headers: Authorization: Bearer {token}
Body: {
  full_name: "John Doe",
  email: "john@example.com",
  password: "ValidPass123!",
  role: "library",
  department: "Library",
  sap: "12345" or null
}
Response: {
  success: true,
  message: "✅ User John Doe created successfully",
  data: { _id, full_name, email, role, department, sap, created_at }
}
Status: 201
```

---

### Test 7.3: Error Responses
**Test Invalid Token:**
- Clear localStorage token
- Try to submit form
- Expected: 401 Unauthorized

**Test Non-Admin User:**
- Login as non-admin role
- Expected: 403 Forbidden (if accessing admin routes)

---

## 🐛 TEST CASE 8: Edge Cases & Error Handling

### Test 8.1: Network Error Simulation
**Steps:**
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Try to check email on Step 1
4. Try to submit user form

**Expected:**
- ✅ Email check fails gracefully (assumes email doesn't exist)
- ✅ User creation shows error message
- ✅ Form doesn't close on network error
- ✅ Error message is descriptive

---

### Test 8.2: Rapid Form Switching
**Steps:**
1. Step 1 → Next → Step 2
2. Immediately click Back multiple times
3. Immediately click Next multiple times

**Expected:**
- ✅ Form doesn't break or show duplicate content
- ✅ State updates are handled correctly
- ✅ Form step synchronizes with displayed content

---

### Test 8.3: Very Long Input
**Steps:**
1. Enter 500+ character full name
2. Enter very long password
3. Try to submit

**Expected:**
- ✅ Form accepts input (if validation passes)
- ✅ No display overflow or UI breaking
- ✅ Backend validates and may truncate appropriately

---

### Test 8.4: Special Characters in Name
**Steps:**
1. Enter Full Name: "José María García-López"
2. Proceed through form
3. Submit

**Expected:**
- ✅ Special characters are preserved
- ✅ User is created with correct name
- ✅ No character encoding issues

---

## 📊 BROWSER COMPATIBILITY TESTING

Test in multiple browsers:
- Chrome/Edge (Latest)
- Firefox (Latest)
- Safari (if available)

**Check:**
- ✅ Progress indicator displays correctly
- ✅ Eye icons render properly
- ✅ Form layout is responsive
- ✅ No console errors

---

## 🔍 DEBUGGING CHECKLIST

If tests fail, check:

1. **Backend Server Issues:**
   - Is backend running on port 5000? `netstat -ano | findstr 5000`
   - Are routes mounted? Check console: "Admin routes mounted"
   - Check `/api/admin/check-email` endpoint exists

2. **Frontend Issues:**
   - Browser console for errors (F12)
   - Check formStep state changes in React DevTools
   - Verify CSS classes applied correctly (Inspect Element)
   - Check if formErrors object updates properly

3. **Network Issues:**
   - DevTools Network tab shows all requests
   - Check request/response payloads match expected
   - Verify Authorization header contains JWT token

4. **State Management:**
   - React DevTools: Check state updates in real-time
   - Verify formStep === 1/2/3 controls conditional rendering
   - Check if formErrors clears when user corrects input

---

## ✅ FINAL VERIFICATION CHECKLIST

Before marking as complete:

- [ ] All 3 steps display correctly
- [ ] Progress indicator shows active step
- [ ] Email existence check works
- [ ] Password visibility toggle works for both fields
- [ ] Password validation shows correct errors
- [ ] Confirm password validation works
- [ ] Form can progress through all 3 steps
- [ ] Back button works at Steps 2 and 3
- [ ] Cancel button closes form and resets state
- [ ] Submit button appears only on Step 3
- [ ] User creation successful with timestamp
- [ ] New user appears in user list
- [ ] No console errors
- [ ] No network errors (200/201 status codes)
- [ ] Form styling matches design specs
- [ ] Responsive on different screen sizes

---

## 📝 TEST EXECUTION LOG

Date: ____________
Tester: ___________
Browser: __________

| Test Case | Result | Notes |
|-----------|--------|-------|
| 1.1 | ☐ Pass ☐ Fail | |
| 1.2 | ☐ Pass ☐ Fail | |
| 1.3 | ☐ Pass ☐ Fail | |
| 1.4 | ☐ Pass ☐ Fail | |
| 2.1 | ☐ Pass ☐ Fail | |
| 2.2 | ☐ Pass ☐ Fail | |
| 2.3 | ☐ Pass ☐ Fail | |
| 2.4 | ☐ Pass ☐ Fail | |
| 3.1 | ☐ Pass ☐ Fail | |
| 3.2 | ☐ Pass ☐ Fail | |
| 3.3 | ☐ Pass ☐ Fail | |
| 3.4 | ☐ Pass ☐ Fail | |
| 3.5 | ☐ Pass ☐ Fail | |
| 4.1 | ☐ Pass ☐ Fail | |
| 4.2 | ☐ Pass ☐ Fail | |
| 4.3 | ☐ Pass ☐ Fail | |
| 5.1 | ☐ Pass ☐ Fail | |
| 5.2 | ☐ Pass ☐ Fail | |
| 6.1 | ☐ Pass ☐ Fail | |
| 6.2 | ☐ Pass ☐ Fail | |
| 6.3 | ☐ Pass ☐ Fail | |
| 7.1 | ☐ Pass ☐ Fail | |
| 7.2 | ☐ Pass ☐ Fail | |
| 7.3 | ☐ Pass ☐ Fail | |
| 8.1 | ☐ Pass ☐ Fail | |
| 8.2 | ☐ Pass ☐ Fail | |
| 8.3 | ☐ Pass ☐ Fail | |
| 8.4 | ☐ Pass ☐ Fail | |

**Overall Result:** ☐ PASS ☐ FAIL

**Sign Off:** _______________  Date: __________

---

**Ready for Production:** ✅ YES ☐ NO

If NO, list blocking issues:
1. _____________________________
2. _____________________________
3. _____________________________
