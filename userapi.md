# User API Documentation

This document provides detailed information about all user-related API endpoints for the `city_care_backend` project.
**Global Prefix:** `/api`
**Base URL:** `http://localhost:3000/api` (assuming default port)

## Response Structure
All API responses follow this standard format:
```json
{
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... } | [ ... ] | null,
  "pagination": { ... } // Optional, for list endpoints
}
```

---

## 1. Authentication (`/auth`)

### Login
**POST** `/auth/login`
- **Description:** Authenticate user using email/password or OTP.
- **Request Body:**
  ```json
  {
    "email": "string (optional)",
    "userName": "string (optional)",
    "phoneNo": "string (optional)",
    "password": "string (optional)",
    "otp": "string (optional)",
    "role": "enum (user, vendor, admin)" // Optional
  }
  ```
- **Response Data:**
  ```json
  {
    "token": "jwt_token_string",
    "user": { ...user_details... }
  }
  ```

### Send OTP
**POST** `/auth/send-otp`
- **Description:** Trigger an OTP to be sent to the user's phone/email.
- **Request Body:**
  ```json
  {
    "email": "string (optional)",
    "phoneNo": "string (optional)",
    "userName": "string (optional)",
    "role": "enum"
  }
  ```
- **Response Data:**
  ```json
  {
    "isKycVerified": boolean,
    "userId": number
  }
  ```

### Verify OTP
**POST** `/auth/verify-otp`
- **Description:** Verify the received OTP. Can be used for login or password reset.
- **Request Body:**
  ```json
  {
    "otp": "string (required)",
    "email": "string",
    "phoneNo": "string",
    "newPassword": "string (optional - for reset flow)"
  }
  ```
- **Response Data:** `null` (Success message only)

---

## 2. User Management (`/users`)

### Create User (Sign Up)
**POST** `/users`
- **Request Body:**
  ```json
  {
    "fullName": "string",
    "userName": "string",
    "email": "string",
    "phoneNo": "string",
    "password": "string",
    "role": "CUSTOMER | VENDOR",
    "fcmToken": "string (optional)"
  }
  ```
- **Response Data:** User object.

### Get User Profile
**GET** `/users/:id`
- **Response Data:**
  ```json
  {
    "id": number,
    "fullName": "string",
    "email": "string",
    "phoneNo": "string",
    "role": "CUSTOMER",
    "profile": { ... },
    "isActive": boolean,
    "points": number,
    "referralCode": "string",
    ...
  }
  ```

### Update User
**PUT** `/users/:id/customer`
- **Request Body:**
  ```json
  {
    "isActive": boolean,
    "isEmailValid": boolean,
    "profileImageUrl": "string (optional - s3 key)"
  }
  ```

### Upload Profile Image
**PUT** `/users/:id/customer/upload`
- **Headers:** `Content-Type: multipart/form-data`
- **Form Data:**
  - `file`: (Binary file)
- **Response Data:** Updated user object with new profile image path.

---

## 3. Services (`/services`)

### List Services
**GET** `/services`
- **Query Params:**
  - `status`: 'all' | 'active' | 'inactive' (default: 'all')
  - `page`: number (default: 1)
  - `limit`: number (default: 10)
  - `pagination`: boolean (default: true)
- **Response Data:**
  ```json
  {
    "records": [
      {
        "id": number,
        "name": "string",
        "description": "string",
        "imagePath": "string",
        "parentId": number | null
      }
    ],
    "summary": { ... }
  }
  ```

### Get Service Tree (Grouped)
**GET** `/services/grouped`
- **Description:** Useful for displaying categories and their sub-services.
- **Response Data:** Array of services nested by parent.

---

## 4. Service Menus & Subcategories

### List Menus Grouped by Subcategory
**GET** `/service-menus/grouped-by-subcategory`
- **Query Params:** `serviceId` (optional), `subcategoryId` (optional)
- **Response Data:**
  ```json
  [
    {
      "subcategory": { "id": 1, "name": "AC Repair" },
      "menus": [
        {
          "id": 101,
          "title": "Split AC Service",
          "basePriceInPaisa": 50000,
          "imagePath": "..."
        }
      ]
    }
  ]
  ```

---

## 5. Booking & Scheduling (`/bookings`)

### Check Availability
**GET** `/bookings/check-availability`
- **Query Params:**
  - `latitude`: number
  - `longitude`: number
  - `serviceId`: number
  - `date`: YYYY-MM-DD
- **Response Data:** `{ "available": boolean, "vendors": [...] }`

### Get Available Slots
**GET** `/bookings/available-slots`
- **Query Params:**
  - `serviceId`: number
  - `serviceMenuId`: number
  - `bookingDate`: YYYY-MM-DD
  - `latitude`: number
  - `longitude`: number
- **Response Data:** Array of time slots e.g., `["09:00", "10:00", ...]`

### Create Booking from Cart
**POST** `/bookings/from-cart`
- **Request Body:**
  ```json
  {
    "userId": number,
    "serviceId": number,
    "paymentMethod": "CASH | ONLINE",
    "paymentMode": "FULL | PARTIAL",
    "priceSummary": object
  }
  ```
- **Response Data:** details of created bookings.

### List Bookings
**GET** `/bookings`
- **Query Params:** `customerId`, `status` (PENDING, ACCEPTED, etc.), `dateFrom`, `dateTo`.
- **Response Data:** List of booking objects.

---

## 6. Cart (`/cart`)

### Get Cart
**GET** `/cart/:userId`
- **Response Data:**
  ```json
  {
    "items": [
      {
        "id": number,
        "serviceMenuId": number,
        "quantity": number,
        "serviceMenu": { "title": "...", "basePriceInPaisa": ... }
      }
    ],
    "totalAmount": number
  }
  ```

### Add to Cart
**POST** `/cart/:userId`
- **Request Body:**
  ```json
  {
    "serviceMenuId": number,
    "quantity": number
  }
  ```

---

## 7. Wallet & Payments

### Wallet Balance
**GET** `/wallets/:userId/balance`
- **Response Data:**
  ```json
  {
    "balance": 1500,
    "currency": "INR"
  }
  ```

### Create Top-up Order
**POST** `/wallets/:userId/topup/create`
- **Request Body:**
  ```json
  {
    "amount": number
  }
  ```
- **Response Data:** Razorpay order details.

### Verify Top-up
**POST** `/wallets/:userId/topup/verify`
- **Request Body:**
  ```json
  {
    "razorpayOrderId": "string",
    "razorpayPaymentId": "string",
    "razorpaySignature": "string"
  }
  ```

### Create Payment (General)
**POST** `/payments/create`
- **Request Body:**
  ```json
  {
    "amountInPaisa": number,
    "currency": "INR",
    "referenceId": number, // e.g. booking ID
    "receipt": "string"
  }
  ```

---

## 8. Address (`/addresses`)

### List Addresses
**GET** `/addresses/:userId`
- **Response Data:** Array of address objects.

### Create Address
**POST** `/addresses`
- **Request Body:**
  ```json
  {
    "label": "Home",
    "addressLine1": "string",
    "addressLine2": "string",
    "city": "string",
    "state": "string",
    "pincode": "string",
    "latitude": number,
    "longitude": number,
    "isDefault": boolean
  }
  ```

---

## 9. File Uploads (`/upload-files`)

### Upload File
**POST** `/upload-files`
- **Headers:** `Content-Type: multipart/form-data`
- **Form Data:**
  - `files`: (Multiple binary files)
  - `section`: "chat" | "support" | "profile"
- **Response Data:** List of uploaded file paths.

---

## 10. Notifications (`/notifications`)

### Register Push Token
**POST** `/notifications/push`
- **Request Body:**
  ```json
  {
    "token": "fcm_token_string",
    "title": "Welcome",
    "body": "Thank you for joining!"
  }
  ```

---

## 11. KYC (DigiLocker) (`/digilocker`)

### Start KYC Flow
**GET** `/digilocker/start/:userId`
- **Description:** Redirects user to DigiLocker for OAuth2 verification.
- **Response:** 302 Redirect to DigiLocker login page.

---

## 12. Utilities (S3 & Vendors)

### Get S3 Upload URL
**POST** `/s3/upload-url`
- **Description:** Get a pre-signed URL for direct upload to S3.
- **Request Body:**
  ```json
  {
    "fileName": "string",
    "contentType": "string" (e.g. "image/png")
  }
  ```
- **Response Data:** `{ "uploadUrl": "https://..." }`

### Vendor Dropdown
**GET** `/vendors/dropdown`
- **Query Params:** `type` (optional, filter by vendor type)
- **Response Data:** List of vendors `{ "label": "Name", "value": id }`.


services categories in home page
call this below api in home page to show service list 
curl --location 'https://citycare.thynxai.cloud/api/services/parents' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjM4LCJ1c2VybmFtZSI6Ijc5Nzg5OTk1MDEiLCJyb2xlcyI6WyJjdXN0b21lciJdLCJpYXQiOjE3Njc1MTU4MDV9.NtWsh33eUeFKpW9Vc92WNk_ddUuDNDmt47TEZwFY7Rk'



service list
after above use this 
curl --location 'https://citycare.thynxai.cloud/api/services/by-parent/8' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjM4LCJ1c2VybmFtZSI6Ijc5Nzg5OTk1MDEiLCJyb2xlcyI6WyJjdXN0b21lciJdLCJpYXQiOjE3Njc1MTU4MDV9.NtWsh33eUeFKpW9Vc92WNk_ddUuDNDmt47TEZwFY7Rk'



single service by id

curl --location 'https://citycare.thynxai.cloud/api/services/1' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjUsInVzZXJuYW1lIjoiamFuZTFAZXhhbXBsZS5jb20iLCJyb2xlcyI6WyJ2ZW5kb3IiXSwiaWF0IjoxNzYzODIyODQwfQ.XgmJrOevsr6vDheVrBLGD697gOJGNPAEKqniJUByfiU'
