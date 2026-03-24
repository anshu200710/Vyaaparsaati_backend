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

## 🧪 Offers API Endpoints (5)

### 1️⃣ GET All Active Offers
```bash
curl -X GET http://localhost:4000/api/offers
```

### 2️⃣ GET Offer by ID
```bash
curl -X GET http://localhost:4000/api/offers/{offerId}
```

### 3️⃣ CREATE Offer (admin)
```bash
curl -X POST http://localhost:4000/api/offers \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -F "bannerImage=@/path/to/banner.jpg" \
  -F "title=Super Savings" \
  -F "description=Get 20% off on all items"
```

### 4️⃣ UPDATE Offer (admin)
```bash
curl -X PUT http://localhost:4000/api/offers/{offerId} \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -F "bannerImage=@/path/to/new-banner.jpg" \
  -F "title=Updated Offer" \
  -F "description=Updated description" \
  -F "isActive=true"
```

### 5️⃣ DELETE Offer (admin)
```bash
curl -X DELETE http://localhost:4000/api/offers/{offerId} \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

---

## 📰 News & Updates API Endpoints (7)

### 1️⃣6️⃣ GET All Published News
```bash
curl -X GET http://localhost:4000/api/news
```

**Query Parameters:**
```bash
# Get with pagination
curl -X GET "http://localhost:4000/api/news?page=1&limit=10"

# Get specific category
curl -X GET "http://localhost:4000/api/news?category=technology&page=1"
```

---

### 1️⃣7️⃣ GET News by ID
```bash
curl -X GET http://localhost:4000/api/news/{newsId}
```

---

### 1️⃣8️⃣ GET News by Category
```bash
curl -X GET http://localhost:4000/api/news/category/technology

# Categories: technology, business, updates, announcement, other
```

**With Pagination:**
```bash
curl -X GET "http://localhost:4000/api/news/category/business?page=1&limit=5"
```

---

### 1️⃣9️⃣ CREATE News (admin)
```bash
curl -X POST http://localhost:4000/api/news \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -F "image=@/path/to/news-image.jpg" \
  -F "title=Major Updates Released" \
  -F "description=We are excited to announce new features" \
  -F "category=announcement"
```

**Windows Example:**
```bash
curl -X POST http://localhost:4000/api/news \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -F "image=@C:\Users\user\Desktop\news.jpg" \
  -F "title=New Feature Launch" \
  -F "description=Check out our latest innovations" \
  -F "category=technology"
```

---

### 2️⃣0️⃣ UPDATE News (admin)
```bash
curl -X PUT http://localhost:4000/api/news/{newsId} \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -F "image=@/path/to/new-image.jpg" \
  -F "title=Updated Title" \
  -F "description=Updated description" \
  -F "category=business" \
  -F "isPublished=true"
```

**Update without image:**
```bash
curl -X PUT http://localhost:4000/api/news/{newsId} \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "description": "Updated description",
    "category": "updates",
    "isPublished": true
  }'
```

---

### 2️⃣1️⃣ DELETE News (admin)
```bash
curl -X DELETE http://localhost:4000/api/news/{newsId} \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

---

### 2️⃣2️⃣ GET All News (admin - including unpublished)
```bash
curl -X GET http://localhost:4000/api/news/admin/all \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**With filters:**
```bash
curl -X GET "http://localhost:4000/api/news/admin/all?category=announcement&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

---

## 💬 Chat & AI Messaging API Endpoints (8)

### 2️⃣3️⃣ START a New Conversation
```bash
curl -X POST http://localhost:4000/api/chat/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Help with my account",
    "adminId": "ADMIN_USER_ID"
  }'
```

**Response:**
```json
{
  "message": "Conversation started successfully",
  "data": {
    "_id": "conversation_id",
    "userId": { "_id": "user_id", "name": "John", "email": "john@example.com" },
    "adminId": { "_id": "admin_id", "name": "Admin", "email": "admin@example.com" },
    "subject": "Help with my account",
    "messages": [],
    "aiChatEnabled": false,
    "status": "open",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### 2️⃣4️⃣ SEND a Message
```bash
curl -X POST http://localhost:4000/api/chat/{conversationId}/message \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need help with my account verification"
  }'
```

**Response:**
```json
{
  "message": "Message sent successfully",
  "data": {
    "_id": "conversation_id",
    "messages": [
      {
        "_id": "msg_id",
        "sender": "user",
        "senderName": "John Doe",
        "message": "I need help with my account",
        "timestamp": "2024-01-15T10:05:00Z"
      }
    ]
  }
}
```

---

### 2️⃣5️⃣ GET Conversation History
```bash
curl -X GET http://localhost:4000/api/chat/{conversationId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "_id": "conversation_id",
  "userId": { "_id": "user_id", "name": "John", "email": "john@example.com" },
  "adminId": { "_id": "admin_id", "name": "Admin", "email": "admin@example.com" },
  "subject": "Help with my account",
  "messages": [
    {
      "_id": "msg_id_1",
      "sender": "user",
      "senderName": "John Doe",
      "message": "I need help",
      "timestamp": "2024-01-15T10:00:00Z"
    },
    {
      "_id": "msg_id_2",
      "sender": "admin",
      "senderName": "Admin",
      "message": "I'll help you out",
      "timestamp": "2024-01-15T10:05:00Z"
    }
  ],
  "aiChatEnabled": false,
  "status": "open"
}
```

---

### 2️⃣6️⃣ LIST My Conversations (user or admin)
```bash
curl -X GET http://localhost:4000/api/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**With pagination:**
```bash
curl -X GET "http://localhost:4000/api/chat?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2️⃣7️⃣ LIST All Conversations (admin only)
```bash
curl -X GET http://localhost:4000/api/chat/admin/all \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**With status filter:**
```bash
curl -X GET "http://localhost:4000/api/chat/admin/all?status=open&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

---

### 2️⃣8️⃣ ENABLE AI ChatBot (Convert to Chat with AI)
```bash
curl -X PUT http://localhost:4000/api/chat/{conversationId}/enable-bot \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "AI chat enabled successfully",
  "data": {
    "_id": "conversation_id",
    "aiChatEnabled": true,
    "status": "open"
  }
}
```

**Now when you send a message, the AI (Gemini) will auto-reply:**
```bash
curl -X POST http://localhost:4000/api/chat/{conversationId}/message \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What payment methods do you accept?"
  }'
```

**Response (with AI response auto-added):**
```json
{
  "message": "Message sent successfully",
  "data": {
    "messages": [
      {
        "sender": "user",
        "senderName": "John",
        "message": "What payment methods do you accept?",
        "timestamp": "2024-01-15T10:00:00Z"
      },
      {
        "sender": "bot",
        "senderName": "ChatBot",
        "message": "We accept all major credit cards, PayPal, bank transfers, and digital wallets...",
        "timestamp": "2024-01-15T10:00:05Z"
      }
    ]
  }
}
```

---

### 2️⃣9️⃣ DISABLE AI ChatBot
```bash
curl -X PUT http://localhost:4000/api/chat/{conversationId}/disable-bot \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "AI chat disabled successfully",
  "data": {
    "aiChatEnabled": false
  }
}
```

---

### 3️⃣0️⃣ CLOSE Conversation (admin only)
```bash
curl -X PUT http://localhost:4000/api/chat/{conversationId}/close \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "Conversation closed successfully",
  "data": {
    "status": "closed"
  }
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
