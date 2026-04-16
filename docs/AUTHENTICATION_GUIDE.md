# Authentication System - Complete Documentation

## Overview

This is an industry-grade authentication system with role-based access control (RBAC), JWT token management, and comprehensive error handling.

## Architecture

### Frontend (React)
- **AuthContext**: Centralized state management replacing localStorage
- **Protected Routes**: Role-based access control
- **API Service**: Axios interceptors for token management and auto-logout
- **Input Validation**: Client-side validation before submission

### Backend (Node.js/Express)
- **JWT Authentication**: Stateless token-based authentication
- **Password Security**: bcrypt hashing with salt rounds
- **Input Validation**: Server-side validation for all inputs
- **Error Handling**: Standardized error responses with error codes
- **Logging**: Authentication and sensitive operation logging

## API Endpoints

### Authentication

#### POST `/signup`
Create a new user account.

**Request:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "Student",
  "sap": "12345",
  "department": "Engineering"
}
```

**Validation Rules:**
- `full_name`: 2-100 characters, required
- `email`: Valid email format, required
- `password`: Min 6 chars, at least one letter, required
- `role`: One of [Student, Library, Transport, Laboratory, StudentService, FeeDepartment, Coordination, Hod]
- `sap`: Optional, max 255 chars
- `department`: Optional, max 255 chars

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Account created successfully. Please login."
}
```

**Error Responses:**
- `400 MISSING_REQUIRED_FIELDS`: Missing required fields
- `400 INVALID_INPUT`: Invalid field format
- `400 INVALID_EMAIL`: Invalid email format
- `400 WEAK_PASSWORD`: Password doesn't meet requirements
- `400 EMAIL_ALREADY_EXISTS`: Email already registered

---

#### POST `/login`
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id": 1,
  "role": "Student",
  "name": "John Doe",
  "email": "john@example.com",
  "sap": "12345",
  "department": "Engineering"
}
```

**Error Responses:**
- `400 MISSING_REQUIRED_FIELDS`: Email or password missing
- `401 INVALID_CREDENTIALS`: Wrong email or password
- `500 DATABASE_ERROR`: Server database error

---

#### GET `/get-profile`
Fetch authenticated user's profile.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "sap": "12345",
    "department": "Engineering",
    "role": "Student"
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED`: Missing token
- `401 INVALID_TOKEN`: Invalid/expired token
- `404 USER_NOT_FOUND`: User not found
- `500 DATABASE_ERROR`: Server database error

---

#### PUT `/update-profile`
Update authenticated user's profile.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "sap": "12345",
  "department": "Engineering",
  "password": "NewSecurePass456"
}
```

**Validation Rules:**
- Same as signup
- `password`: Optional - if provided must meet strength requirements
- All other fields required

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

**Error Responses:**
- `400 MISSING_REQUIRED_FIELDS`: Required field missing
- `400 INVALID_INPUT`: Invalid field format
- `400 EMAIL_ALREADY_EXISTS`: Email used by another account
- `400 WEAK_PASSWORD`: Weak password
- `401 UNAUTHORIZED`: Missing/invalid token
- `500 DATABASE_ERROR`: Server error

---

#### GET `/user/:id`
Get public user information (requires authentication).

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "full_name": "John Doe",
  "email": "john@example.com",
  "role": "Student",
  "sap": "12345",
  "department": "Engineering"
}
```

**Error Responses:**
- `401 UNAUTHORIZED`: Missing/invalid token
- `404 USER_NOT_FOUND`: User not found

---

### Clearance Requests

#### POST `/clearance-requests`
Submit a clearance request.

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "sapid": "12345",
  "studentName": "John Doe",
  "registrationNo": "REG12345",
  "fatherName": "James Doe",
  "program": "Engineering",
  "semester": "8",
  "degreeStatus": "Final"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Clearance request submitted successfully"
}
```

**Error Responses:**
- `400 MISSING_REQUIRED_FIELDS`: Missing required fields
- `401 UNAUTHORIZED`: Missing/invalid token
- `500 DATABASE_ERROR`: Server error

---

#### GET `/clearance-requests`
Get all clearance requests (admin only).

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "sapid": "12345",
      "student_name": "John Doe",
      "registration_no": "REG12345",
      "father_name": "James Doe",
      "program": "Engineering",
      "semester": "8",
      "degree_status": "Final",
      "submitted_at": "2025-11-25T10:30:00Z"
    }
  ]
}
```

**Error Responses:**
- `401 UNAUTHORIZED`: Missing/invalid token
- `403 FORBIDDEN`: User is not admin
- `500 DATABASE_ERROR`: Server error

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `MISSING_REQUIRED_FIELDS` | 400 | One or more required fields are missing |
| `INVALID_INPUT` | 400 | Input format is invalid |
| `INVALID_EMAIL` | 400 | Email format is invalid |
| `WEAK_PASSWORD` | 400 | Password doesn't meet strength requirements |
| `EMAIL_ALREADY_EXISTS` | 400 | Email is already registered |
| `INVALID_CREDENTIALS` | 401 | Email or password is incorrect |
| `UNAUTHORIZED` | 401 | No token provided or token missing |
| `INVALID_TOKEN` | 401 | Token is invalid or expired |
| `FORBIDDEN` | 403 | User doesn't have permission |
| `USER_NOT_FOUND` | 404 | User doesn't exist |
| `NOT_FOUND` | 404 | Endpoint not found |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

---

## Security Features

### Password Security
- Hashed using bcrypt with 10 salt rounds
- Validated for minimum length (6 chars) and character variety
- Never stored in plain text

### Token Security
- JWT tokens with 2-hour expiration
- Verified on every protected endpoint
- Automatically cleared on client on 401 response

### Input Sanitization
- All inputs trimmed and validated
- Maximum length enforcement (255 chars default)
- Email validation with regex
- XSS protection through React escaping

### Error Handling
- Never expose sensitive system information
- Consistent error message format
- Detailed logging for debugging (server-side only)

### Role-Based Access Control
- Client-side: ProtectedRoute component checks user role
- Server-side: authMiddleware verifies token
- Role validation on sensitive endpoints

---

## Frontend Usage

### 1. Setup
Wrap your app with AuthProvider:

```jsx
import { AuthProvider } from './contexts/AuthContext';

<AuthProvider>
  <App />
</AuthProvider>
```

### 2. Use in Components
```jsx
import { useAuthContext } from '../contexts/AuthContext';

function Dashboard() {
  const { user, logout, refreshProfile } = useAuthContext();
  
  return (
    <div>
      <h1>Welcome, {user.full_name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 3. Protected Routes
```jsx
<Route
  path="/student-dashboard"
  element={
    <ProtectedRoute allowedRoles={["Student"]}>
      <StudentDashboard />
    </ProtectedRoute>
  }
/>
```

---

## Backend Configuration

Create `.env` file in backend directory:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
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

## Testing Authentication Flow

### 1. Signup
```bash
curl -X POST http://localhost:5000/signup \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123",
    "role": "Student"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### 3. Get Profile (with token)
```bash
curl -X GET http://localhost:5000/get-profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Best Practices Implemented

✅ Stateless JWT authentication
✅ Centralized state management (AuthContext)
✅ Input validation (client + server)
✅ Password hashing and security
✅ Comprehensive error handling
✅ Request/response interceptors
✅ Role-based access control
✅ Secure token storage
✅ Auto-logout on token expiration
✅ Detailed logging for auditing
✅ Consistent API response format
✅ CORS configuration
✅ Environment-based configuration
✅ Type-safe error codes

---

## Common Issues & Solutions

### Issue: Token keeps expiring
**Solution**: Token expires after 2 hours. Users need to login again. Implement refresh token endpoint for extended sessions.

### Issue: User data not updating
**Solution**: Use `refreshProfile()` from AuthContext after updates to fetch fresh data from server.

### Issue: 401 errors on protected routes
**Solution**: Check if token is valid, hasn't expired, and user has correct role.

### Issue: CORS errors
**Solution**: Ensure `CORS_ORIGIN` in backend matches frontend URL.

---

## Future Enhancements

- [ ] Implement JWT refresh token mechanism
- [ ] Add email verification on signup
- [ ] Implement password reset flow
- [ ] Add multi-factor authentication (MFA)
- [ ] Rate limiting on login attempts
- [ ] Session management/device tracking
- [ ] OAuth2 integration (Google, GitHub, etc.)
- [ ] Audit logging with timestamps
- [ ] Role-based endpoint access
