# Clearance Request Duplicate Prevention Implementation

## Overview
Successfully implemented duplicate prevention for clearance requests with selective resubmission functionality for rejected requests only.

## Problem Statement
Previously, students could submit unlimited clearance requests to all departments without any restrictions. The system needed to:
1. **Prevent duplicate submissions** - Students can only submit ONE clearance request at a time (except for rejected requests)
2. **Allow selective resubmission** - If a department rejects a request, student can ONLY resubmit to that specific department
3. **Show request status** - Display which departments have approved, pending, or rejected the request

## Solution Implemented

### Frontend Changes

#### 1. **ClearanceRequest.js** (src/ and my-app/ versions)

**New State Variables:**
```javascript
const [existingRequests, setExistingRequests] = useState([]);           // Array of student's requests
const [fetchingRequests, setFetchingRequests] = useState(true);         // Loading state
const [departmentStatuses, setDepartmentStatuses] = useState({});       // Department status map
const [resubmittingDept, setResubmittingDept] = useState(null);         // Current resubmitting dept
```

**useEffect Hook - Fetch Existing Requests:**
- Runs on component mount
- Calls `GET /api/clearance-requests` to fetch student's existing requests
- Builds a `departmentStatuses` map for quick lookup
- Handles authentication errors gracefully

**Updated handleSubmit():**
- Now checks `hasActiveRequest` before allowing submission
- If an active (non-rejected) request exists, button is disabled with message
- Refreshes existing requests after successful submission
- Prevents accidental duplicate submissions

**New handleResubmit() Function:**
- Takes department name as parameter
- Sends POST to `/api/clearance-requests/resubmit` with specific department
- Only sends to ONE rejected department, not all departments
- Updates local state with new status
- Shows success message "✅ Resubmit request sent to [Department]!"

**Updated UI Elements:**
1. **Submit Button:**
   - Disabled state: `disabled={loading || hasActiveRequest || fetchingRequests}`
   - Shows different text based on state:
     - "Loading..." while checking requests
     - "🔒 Request Already Submitted (Pending/Approved)" when active request exists
     - "✅ Submit Clearance Request" when can submit

2. **New Resubmit Section:**
   - Only displays when `hasRejectedRequests` is true
   - Shows orange/warning gradient background
   - Lists all departments with "Rejected" status
   - Provides individual "🔄 Resubmit to [Department]" buttons for each rejected department
   - Shows loading state during resubmission

3. **Updated Info Box:**
   - Shows current request status if requests exist
   - Uses color-coded status badges:
     - 🟡 Pending (yellow)
     - 🟢 Approved (green)
     - 🔴 Rejected (red)
   - Shows helpful info about selective resubmission rules

#### 2. **ClearanceRequest.css** (src/ and my-app/ versions)

**New Styles Added:**
- `.resubmit-section` - Orange gradient container for resubmit UI
- `.resubmit-btn` - Individual department resubmit buttons
- `.spinner` - Loading animation for async operations
- `.status-pending`, `.status-approved`, `.status-rejected` - Color-coded status badges
- `@keyframes spin` and `@keyframes slideIn` - Smooth animations

### Backend Changes

#### 1. **server.js** (backend/ and my-app/backend/)

**New GET Endpoint: `/api/clearance-requests`**
```
GET /api/clearance-requests
Authorization: Bearer {token}

Response:
{
  success: true,
  requests: [
    { _id, student_id, department_name, status, ... },
    ...
  ],
  count: number
}
```
- Returns all of student's clearance requests
- Sorted by most recent first
- Used by frontend to check for active requests
- Handles authentication via verifyToken middleware

**Modified POST Endpoint: `/api/clearance-requests/resubmit`**

**Old Behavior:**
- Resubmitted to ALL rejected departments

**New Behavior:**
- If `department` parameter in body:
  - Resubmits to ONLY that specific department
  - Checks if that specific department's request is rejected
  - Returns 400 if department doesn't have rejected request
  - Returns success with department-specific details
  
- If NO `department` parameter:
  - Falls back to original behavior (resubmit to all)
  - Maintains backward compatibility

**Request Body (with specific department):**
```json
{
  "sapid": "xxx",
  "student_name": "Name",
  "registration_no": "xxx",
  "father_name": "Name",
  "program": "BSCS",
  "semester": "8",
  "degree_status": "Final Year",
  "department": "Library"  // Specific department to resubmit to
}
```

## User Flow

### 1. **First Time Submitting:**
- Student fills form → Submit button enabled
- Clicks submit → Request sent to ALL departments (original behavior)
- Button becomes disabled → Shows "Request Already Submitted (Pending/Approved)"
- Info box shows request status for each department

### 2. **Department Rejects Request:**
- Status changes to "Rejected" for that department
- Resubmit section appears at bottom
- Shows "🔄 Resubmit to [Department]" button ONLY for rejected department
- Other departments' statuses remain unchanged

### 3. **Resubmitting to Rejected Department:**
- Student clicks resubmit button for rejected department
- Request sent to ONLY that department
- Department's status changes back to "Pending"
- Can now wait for department's response again

### 4. **Cannot Submit New Request While Pending:**
- Even if some departments rejected, if ANY department has "Pending" status
- Submit button remains disabled
- Students cannot submit duplicate requests
- Must wait for all departments to respond

## Key Features

✅ **Duplicate Prevention**
- One active request at a time (all departments pending/approved)
- Cannot submit new request if previous one is still being reviewed

✅ **Selective Resubmission**
- Only rejected departments show resubmit button
- Resubmit goes to ONLY that department, not all
- Other approved/pending departments unaffected

✅ **Clear Visual Feedback**
- Color-coded status badges (Pending/Approved/Rejected)
- Disabled submit button with explanatory text
- Separate resubmit section with warning gradient

✅ **Error Handling**
- Validates department exists and is rejected
- Clear error messages if resubmit fails
- Refreshes status after successful resubmit

✅ **Backward Compatible**
- Resubmit without department parameter still works
- Maintains original all-departments resubmit behavior
- No breaking changes to existing code

## Files Modified

### Frontend
- ✅ `src/components/Student/ClearanceRequest.js` (155 lines added)
- ✅ `src/components/Student/ClearanceRequest.css` (100+ lines added)
- ✅ `my-app/src/components/Student/ClearanceRequest.js` (155 lines added)
- ✅ `my-app/src/components/Student/ClearanceRequest.css` (100+ lines added)

### Backend
- ✅ `backend/server.js` (40 lines added for GET endpoint, 50 lines modified for resubmit)
- ✅ `my-app/backend/server.js` (40 lines added for GET endpoint, 50 lines modified for resubmit)

## Testing Checklist

- [ ] Student can submit clearance request on first attempt
- [ ] Submit button disables after submission
- [ ] Request status appears in info box
- [ ] No resubmit section appears if no rejections
- [ ] Resubmit section appears when department rejects
- [ ] Only rejected department has resubmit button
- [ ] Clicking resubmit button updates status to "Pending"
- [ ] Cannot submit new request while other depts are pending
- [ ] Resubmit only affects the specific department
- [ ] Error handling works for invalid resubmit attempts
- [ ] Status badges show correct colors

## Benefits

1. **Prevents Spam** - Students can't flood departments with requests
2. **Fair Processing** - Each request gets proper review before resubmission
3. **Clear Rules** - Students see exactly what they can and cannot do
4. **Better UX** - Visual feedback prevents confusion
5. **Flexible** - Allows resubmission only for rejected requests
6. **Maintains Data Integrity** - Prevents database corruption from duplicate submissions
