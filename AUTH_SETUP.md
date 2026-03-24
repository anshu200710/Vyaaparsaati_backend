# Backend Auth Implementation - Setup Guide

## Overview
Complete authentication backend implementation with registration, email verification, and login functionality.

---

## Files Modified

### 1. authController.js
Complete rewrite with:
- ✅ Proper request validation
- ✅ Consistent response format
- ✅ JWT token generation (access + refresh)
- ✅ Email verification flow
- ✅ Error handling with user-friendly messages
- ✅ Verification code generation and management

### 2. authRoutes.js
Already has all required endpoints:
```
POST /auth/register                      - User registration
POST /auth/login                         - User login  
POST /auth/verify-email                  - Email verification
POST /auth/resend-verification-code      - Resend verification code
```

---

## Required Environment Variables

Create a `.env` file in the server root:

```env
# JWT Configuration
JWT_SECRET=your-very-secure-secret-key-here
JWT_REFRESH_SECRET=your-very-secure-refresh-secret-key-here

# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/vyapaar
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vyapaar

# Email Service (Gmail example)
EMAIL_SERVICE=gmail
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-specific-password
# OR Sendgrid:
# SENDGRID_API_KEY=your-sendgrid-api-key

# Frontend URL (for CORS)
FRONTEND_URL=http://192.168.1.100:8081
```

---

## Database Schema Update

### User Model Verification

Ensure your User model (`server/models/User.js`) includes:

```javascript
{
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Account type
  accountType: { 
    type: String, 
    enum: ['individual', 'business', 'lawyer', 'admin'],
    default: 'individual'
  },
  
  // Optional fields
  phoneNumber: String,
  businessName: String,
  
  // Email verification
  isEmailVerified: { type: Boolean, default: false },
  verificationCode: String,
  verificationCodeExpiry: Date,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

---

## Setup Instructions

### Step 1: Install Dependencies
```bash
cd server
npm install
```

### Step 2: Verify Dependencies
Ensure you have:
```json
{
  "dependencies": {
    "express": "^4.18.x",
    "mongoose": "^7.x.x",
    "bcryptjs": "^2.4.x",
    "jsonwebtoken": "^9.x.x",
    "dotenv": "^16.x.x",
    "cors": "^2.8.x",
    "nodemailer": "^6.x.x" // for email
  }
}
```

### Step 3: Email Service Setup

#### Option A: Gmail with App Password
1. Enable 2-Factor Authentication on Gmail
2. Generate App Password from your Google account
3. Add to .env:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

#### Option B: SendGrid
1. Create SendGrid account
2. Generate API key
3. Add to .env:
```env
SENDGRID_API_KEY=SG.xxx...
EMAIL_USER=noreply@yourapp.com
```

#### Option C: Custom SMTP
```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=username
SMTP_PASS=password
SMTP_FROM=noreply@example.com
```

### Step 4: Start Server
```bash
npm start
# or with development watch mode
npm run dev
```

Server should run on: `http://localhost:5000`

---

## API Endpoints

All endpoints accept and return JSON.

### 1. Register User
**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "accountType": "individual",
  "phoneNumber": "+1234567890",
  "businessName": null
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully. Verification code sent to email.",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "accountType": "individual",
      "verified": false,
      "createdAt": "2024-03-24T10:00:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "message": "User-friendly error message",
  "error": "Technical error details"
}
```

### 2. Verify Email
**Endpoint:** `POST /api/auth/verify-email`

**Request Body:**
```json
{
  "email": "john@example.com",
  "verificationCode": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": { /* user object */ },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

### 3. Login
**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user object */ },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

### 4. Resend Verification Code
**Endpoint:** `POST /api/auth/resend-verification-code`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Verification code resent to email"
}
```

---

## Testing with cURL

### Test Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"John",
    "lastName":"Doe",
    "email":"john@example.com",
    "password":"password123",
    "confirmPassword":"password123",
    "accountType":"individual"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"john@example.com",
    "password":"password123"
  }'
```

### Test Email Verification
```bash
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email":"john@example.com",
    "verificationCode":"123456"
  }'
```

---

## Error Codes

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Missing required fields | Incomplete request body |
| 400 | Passwords do not match | confirmPassword != password |
| 400 | Email already registered | Duplicate email |
| 400 | Invalid verification code | Wrong code entered |
| 400 | Verification code expired | Code older than 10 minutes |
| 401 | Invalid email or password | Wrong credentials |
| 403 | Email not verified | User hasn't verified email yet |
| 500 | Internal server error | Database or server error |

---

## Security Considerations

1. **Password Hashing:**
   - Passwords are hashed using bcryptjs before storage
   - Never log or expose passwords
   - Implement password reset functionality

2. **JWT Tokens:**
   - Access tokens: 7 days expiration
   - Refresh tokens: 30 days expiration
   - Store secrets in environment variables
   - Use strong, unique secrets

3. **Email Verification:**
   - Codes expire after 10 minutes
   - Codes are 6-10 digits
   - Can resend up to 5 times per hour (optional rate limiting)

4. **Rate Limiting (Recommended):**
   ```javascript
   const rateLimit = require('express-rate-limit');
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   
   app.use('/api/auth/', limiter);
   ```

5. **HTTPS in Production:**
   - Always use HTTPS for production
   - Set `secure` flag on cookies
   - Enable HSTS headers

---

## Monitoring & Logs

### Enable Detailed Logging
```javascript
// In authController.js
if (process.env.NODE_ENV === 'development') {
  console.log('Request:', req.body);
  console.log('Response:', result);
}
```

### Check Logs
```bash
# View server logs
tail -f server.log

# Check for errors
grep -i error server.log
```

---

## Troubleshooting

### Issue: "Email service not sending"
**Solution:**
1. Verify email credentials in .env
2. Check Gmail app-specific password
3. Test email manually:
```javascript
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({...});
await transporter.verify();
```

### Issue: "JWT token invalid"
**Solution:**
1. Check JWT_SECRET is set
2. Ensure secrets are the same in all environments
3. Verify token isn't expired

### Issue: "User not found after registration"
**Solution:**
1. Check MongoDB is running
2. Verify database connection string
3. Check user object before saving

### Issue: "CORS errors"
**Solution:**
```javascript
// In server.js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

---

## Production Deployment

### Pre-deployment Checklist
- [ ] Environment variables configured
- [ ] Database backup created
- [ ] Email service tested
- [ ] SSL/TLS certificate installed
- [ ] Rate limiting enabled
- [ ] Error logging configured
- [ ] Performance monitoring set up

### Deploy Steps
1. Test all endpoints on staging
2. Run security audit
3. Clear old verification codes
4. Deploy to production
5. Monitor error logs
6. Set up alerts

---

## Additional Features to Consider

1. **Forgot Password** - Allow users to reset forgotten passwords
2. **Account Deactivation** - Allow users to deactivate accounts
3. **Login History** - Track user login attempts
4. **Two-Factor Authentication** - Add extra security
5. **Social Login** - Google, Apple, Facebook integration
6. **Account Linking** - Link multiple accounts
7. **Session Management** - Force logout from other devices

---

## Support & Documentation

- API Testing: See `CURL_TESTING_GUIDE.md`
- Frontend Integration: See `client/AUTH_IMPLEMENTATION.md`
- Frontend Quick Start: See `client/QUICK_START.md`

For more information, check the updated controller and route files.
