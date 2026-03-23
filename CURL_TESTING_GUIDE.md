# KYC Profile API - CURL Commands for Testing

## 🔑 Authentication Setup

First, register a user and get a JWT token:

```bash
# 1. Register User
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'

# Response will show: "Verification code sent to email"
```

```bash
# 2. Verify Email (use code from email)
curl -X POST http://localhost:4000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "verificationCode": "123456"
  }'
```

```bash
# 3. Login to get JWT Token
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Save the token from response - you'll need it for all profile API calls
# Response: { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

---

## 📋 Profile API Endpoints (4)

### 1️⃣ GET User Profile
```bash
curl -X GET http://localhost:4000/api/profile/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Example:**
```json
{
  "message": "Profile retrieved successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "profile": {
      "phone": null,
      "address": null,
      "isCompany": false,
      "companyName": null,
      "gstNumber": null,
      "businessType": null
    },
    "kycStatus": "pending"
  }
}
```

---

### 2️⃣ UPDATE User Profile
```bash
curl -X PUT http://localhost:4000/api/profile/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "address": "123 Main Street, New York",
    "isCompany": false,
    "currentProfile": {}
  }'
```

**For Company:**
```bash
curl -X PUT http://localhost:4000/api/profile/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "address": "456 Business Ave, Mumbai",
    "isCompany": true,
    "companyName": "ABC Corporation",
    "gstNumber": "18AABCT1234H1Z0",
    "businessType": "pvt_ltd",
    "currentProfile": {}
  }'
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": { ...updated user data }
}
```

---

### 3️⃣ GET KYC Status
```bash
curl -X GET http://localhost:4000/api/profile/kyc-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Example:**
```json
{
  "message": "KYC status retrieved successfully",
  "kycStatus": "pending",
  "kycRejectionReason": null,
  "documentsStatus": {
    "panCard": false,
    "aadhaarCard": false,
    "gstCertificate": false,
    "businessProof": false,
    "bankStatement": false,
    "electricityBill": false,
    "addressProof": false,
    "photographs": false
  }
}
```

---

### 4️⃣ DELETE Profile Data
```bash
curl -X DELETE http://localhost:4000/api/profile/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "Profile data deleted successfully",
  "user": { ...cleared user data }
}
```

---

## 📄 Document Upload API Endpoints (8)

### 5️⃣ Upload PAN Card
```bash
# Replace "/path/to/pancard.jpg" with actual file path
curl -X POST http://localhost:4000/api/profile/documents/pan \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "document=@/path/to/pancard.jpg"
```

**Windows Example:**
```bash
curl -X POST http://localhost:4000/api/profile/documents/pan \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "document=@C:\Users\user\Desktop\pancard.jpg"
```

**Response:**
```json
{
  "message": "PAN card uploaded successfully",
  "document": "https://res.cloudinary.com/...",
  "user": { ...updated user data }
}
```

---

### 6️⃣ Upload Aadhaar Card (Front)
```bash
curl -X POST http://localhost:4000/api/profile/documents/aadhaar \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "document=@/path/to/aadhaar_front.jpg" \
  -F "side=front"
```

**Response:**
```json
{
  "message": "Aadhaar card front uploaded successfully",
  "document": "https://res.cloudinary.com/...",
  "user": { ...updated user data }
}
```

---

### 7️⃣ Upload Aadhaar Card (Back)
```bash
curl -X POST http://localhost:4000/api/profile/documents/aadhaar \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "document=@/path/to/aadhaar_back.jpg" \
  -F "side=back"
```

**Response:**
```json
{
  "message": "Aadhaar card back uploaded successfully",
  "document": "https://res.cloudinary.com/...",
  "user": { ...updated user data }
}
```

---

### 8️⃣ Upload GST Certificate
```bash
curl -X POST http://localhost:4000/api/profile/documents/gst \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "document=@/path/to/gst_certificate.pdf"
```

**Response:**
```json
{
  "message": "GST certificate uploaded successfully",
  "document": "https://res.cloudinary.com/...",
  "user": { ...updated user data }
}
```

---

### 9️⃣ Upload Business Proof
```bash
curl -X POST http://localhost:4000/api/profile/documents/business-proof \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "document=@/path/to/business_proof.pdf"
```

**Response:**
```json
{
  "message": "Business proof uploaded successfully",
  "document": "https://res.cloudinary.com/...",
  "user": { ...updated user data }
}
```

---

### 🔟 Upload Bank Statement
```bash
curl -X POST http://localhost:4000/api/profile/documents/bank-statement \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "document=@/path/to/bank_statement.pdf"
```

**Response:**
```json
{
  "message": "Bank statement uploaded successfully",
  "document": "https://res.cloudinary.com/...",
  "user": { ...updated user data }
}
```

---

### 1️⃣1️⃣ Upload Electricity Bill (Address Proof)
```bash
curl -X POST http://localhost:4000/api/profile/documents/electricity-bill \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "document=@/path/to/electricity_bill.pdf"
```

**Response:**
```json
{
  "message": "Electricity bill uploaded successfully",
  "document": "https://res.cloudinary.com/...",
  "user": { ...updated user data }
}
```

---

### 1️⃣2️⃣ Upload Address Proof
```bash
curl -X POST http://localhost:4000/api/profile/documents/address-proof \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "document=@/path/to/address_proof.jpg"
```

**Response:**
```json
{
  "message": "Address proof uploaded successfully",
  "document": "https://res.cloudinary.com/...",
  "user": { ...updated user data }
}
```

---

### 1️⃣3️⃣ Upload Photographs (Multiple - Max 5)
```bash
# Upload up to 5 photos
curl -X POST http://localhost:4000/api/profile/documents/photographs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "documents=@/path/to/photo1.jpg" \
  -F "documents=@/path/to/photo2.jpg" \
  -F "documents=@/path/to/photo3.jpg"
```

**Windows Example with Multiple Files:**
```bash
curl -X POST http://localhost:4000/api/profile/documents/photographs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "documents=@C:\Users\user\Desktop\photo1.jpg" \
  -F "documents=@C:\Users\user\Desktop\photo2.jpg" \
  -F "documents=@C:\Users\user\Desktop\photo3.jpg"
```

**Response:**
```json
{
  "message": "Photographs uploaded successfully",
  "documents": [
    { "fileUrl": "https://...", "fileId": "...", "uploadedAt": "2024-01-15T10:00:00Z" },
    { "fileUrl": "https://...", "fileId": "...", "uploadedAt": "2024-01-15T10:00:00Z" }
  ],
  "user": { ...updated user data }
}
```

---

## 📂 Document Management API Endpoints (2)

### 1️⃣4️⃣ GET All Documents
```bash
curl -X GET http://localhost:4000/api/profile/documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "Documents retrieved successfully",
  "documents": {
    "panCard": {
      "fileUrl": "https://res.cloudinary.com/...",
      "fileId": "kyc/pan_cards/...",
      "uploadedAt": "2024-01-15T10:00:00Z",
      "verified": false
    },
    "aadhaarCard": {
      "front": {
        "fileUrl": "https://res.cloudinary.com/...",
        "fileId": "kyc/aadhaar_cards/...",
        "uploadedAt": "2024-01-15T10:00:00Z"
      },
      "back": {
        "fileUrl": "https://res.cloudinary.com/...",
        "fileId": "kyc/aadhaar_cards/...",
        "uploadedAt": "2024-01-15T10:00:00Z"
      },
      "verified": false
    },
    "gstCertificate": { ... },
    "businessProof": { ... },
    "bankStatement": { ... },
    "electricityBill": { ... },
    "addressProof": { ... },
    "photographs": [ ... ]
  }
}
```

---

### 1️⃣5️⃣ DELETE Document
```bash
# Delete PAN Card
curl -X DELETE http://localhost:4000/api/profile/documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "panCard"
  }'
```

**Other Document Types:**
```bash
# Delete Aadhaar Front
"documentType": "aadhaarCard.front"

# Delete Aadhaar Back
"documentType": "aadhaarCard.back"

# Delete GST
"documentType": "gstCertificate"

# Delete Business Proof
"documentType": "businessProof"

# Delete Bank Statement
"documentType": "bankStatement"

# Delete Electricity Bill
"documentType": "electricityBill"

# Delete Address Proof
"documentType": "addressProof"

# Delete all Photographs
"documentType": "photographs"
```

**Response:**
```json
{
  "message": "Document deleted successfully",
  "user": { ...updated user data }
}
```

---

## 🧪 Complete Testing Workflow

### Step 1: Setup
```bash
# Set JWT token in environment (Windows PowerShell)
$TOKEN = "your_jwt_token_from_login"
```

### Step 2: Run Commands
```bash
# Get profile
curl -X GET http://localhost:4000/api/profile/profile `
  -H "Authorization: Bearer $TOKEN"

# Update profile
curl -X PUT http://localhost:4000/api/profile/profile `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{\"phone\":\"9876543210\",\"address\":\"123 Main St\",\"currentProfile\":{}}'

# Upload PAN
curl -X POST http://localhost:4000/api/profile/documents/pan `
  -H "Authorization: Bearer $TOKEN" `
  -F "document=@C:\path\to\pancard.jpg"
```

---

## 📝 Using Postman Instead of CURL

1. **Open Postman**
2. **Set Authorization:**
   - Go to "Authorization" tab
   - Select "Bearer Token"
   - Paste your JWT token

3. **For File Uploads:**
   - Go to "Body" tab
   - Select "form-data"
   - Add key `document` with type "File"
   - Select file from computer

4. **For Aadhaar Card:**
   - Add two form fields:
     - `document` (File type) - the file
     - `side` (Text type) - "front" or "back"

---

## ✅ Test Checklist

- [ ] Register user
- [ ] Verify email
- [ ] Login and save token
- [ ] Get profile (should show empty profile)
- [ ] Update profile with phone & address
- [ ] Get profile (should show updated data)
- [ ] Get KYC status (should show pending)
- [ ] Upload PAN card
- [ ] Upload Aadhaar front
- [ ] Upload Aadhaar back
- [ ] Upload GST certificate
- [ ] Upload Business proof
- [ ] Upload Bank statement
- [ ] Upload Electricity bill
- [ ] Upload Address proof
- [ ] Upload Photographs (3 images)
- [ ] Get all documents (should show all uploads)
- [ ] Delete one document
- [ ] Get all documents (should show deletion)
- [ ] Delete profile data (should clear everything)

---

## 🔧 Troubleshooting

### No token error
```
{"error": "No token provided. Please login first."}
```
**Solution:** Make sure the Bearer token is in Authorization header

### File not found
```
curl: (26) Failed to open/read the file
```
**Solution:** Check file path exists and is correct

### File too large
```
{"error": "File too large. Maximum 10MB allowed"}
```
**Solution:** File size exceeded 10MB limit

### Invalid file type
```
{"error": "Invalid file type. Only JPEG, PNG, and PDF files are allowed."}
```
**Solution:** Use JPEG, PNG, or PDF files only

---

## 💡 Pro Tips

1. **Save Token to Variable** (Windows PowerShell):
   ```powershell
   $TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/profile/profile
   ```

2. **Pretty Print JSON Response**:
   ```bash
   curl -s http://... | powershell -Command "ConvertFrom-Json | ConvertTo-Json"
   ```

3. **Save Response to File**:
   ```bash
   curl http://... > response.json
   ```

4. **Test with Sample Files**:
   - Create test images (1MB each)
   - Create test PDFs (2MB each)
   - Use realistic file names

---

**All 15 API endpoints are now testable with the curl commands above!** ✅
