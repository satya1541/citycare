# Customer/User API Analysis

This document outlines the available APIs for the **Customer/User** application, based on the `city care backend` source code and [userapi.md](file:///d:/project/City-Care-Connect/userapi.md).

## 1. Authentication (`/auth`)
- `POST /auth/login`: Login with email/password or OTP. Returns JWT token.
- `POST /auth/send-otp`: Send OTP for login/signup.
- `POST /auth/verify-otp`: Verify OTP.
- `POST /auth/logout`: Logout (clears cookie).
- `POST /auth/reset-password`: Reset password.

## 2. User Profile (`/users`)
- `POST /users`: Register a new user (Customer/Vendor).
- `GET /users/:id`: Get user profile details.
- `PUT /users/:id/customer`: Update customer profile fields.
- `PUT /users/:id/customer/upload`: Upload profile image.
- `POST /users/:userId/email/validate`: Validate email via OTP.
- `POST /users/:userId/email/send-otp`: Send OTP to email.

## 3. Services (`/services`)
- `GET /services/parents`: **(Critical for Home Page)** Get main categories (e.g., AC Repair, Cleaning).
- `GET /services/by-parent/:parentId`: **(Critical for Category Page)** Get sub-services for a category.
- `GET /services`: List all services with filters.
- `GET /services/:id`: Get details of a specific service.
- `GET /services/grouped`: Get services grouped by parent.

## 4. Service Menus (`/service-menus`)
- `GET /service-menus/grouped-by-subcategory`: **(Critical for Service Listing)** List actual bookable items (menus) grouped by subcategory.
- `GET /service-menus/:id`: Get details of a specific service menu item.

## 5. Bookings (`/bookings`)
- `GET /bookings/check-availability`: Check if vendors are available at a location.
- `GET /bookings/available-slots`: Get available time slots for a service.
- `POST /bookings/from-cart`: Create bookings from cart items.
- `GET /bookings`: List user's bookings (history/upcoming).
- `GET /bookings/:id`: Get booking details.
- `POST /bookings/:id/cancel/:customerId`: Cancel a booking.
- `POST /bookings/:id/rate/:customerId`: Rate a completed booking.
- `PUT /bookings/:id/reschedule/:customerId`: Reschedule a booking.

## 6. Cart (`/cart`)
- `GET /cart/:userId`: Get current cart items.
- `POST /cart/:userId`: Add item to cart.
- `PUT /cart/:userId/items/:id`: Update cart item quantity.
- `DELETE /cart/:userId/items/:id`: Remove item from cart.
- `DELETE /cart/:userId`: Clear entire cart.
- `GET /cart/:userId/summary`: Get total items and cost.

## 7. Wallet (`/wallets`)
- `GET /wallets/:userId/balance`: Get wallet balance.
- `GET /wallets/:userId/transactions`: Get wallet transaction history.
- `POST /wallets/:userId/topup/create`: Create Razorpay order for top-up.
- `POST /wallets/:userId/topup/verify`: Verify payment and credit wallet.

## 8. Addresses (`/addresses`)
- `GET /addresses/:userId`: List saved addresses.
- `POST /addresses`: Add a new address.
- `PATCH /addresses/:id`: Update an address.
- `DELETE /addresses/:id`: Delete an address.
- `PATCH /addresses/:userId/:id/default`: Set default address.

## 9. Payments (`/payments`)
- `POST /payments/create`: Create a general payment.
- `POST /payments/verify`: Verify a payment.

## 10. Referrals (`/referrals`)
- `GET /referrals/my-code`: Get user's referral code.
- `POST /referrals/send`: Send referral to friend.
- `POST /referrals/apply`: Apply a referral code.

## 11. Notifications (`/notifications`)
- `POST /notifications/push`: Register FCM token for push notifications.

---

## Implementation Recommendations

Based on the current project state (Frontend) and the API list above, here is the recommended implementation order:

### Phase 1: Core Data Integration (Home & Categories)
1.  **Service Categories (Home Page):**
    -   Replace mock categories in `home-data.ts` / `home.tsx` with `GET /services/parents`.
2.  **Service Listing (Category Page):**
    -   Update `category.tsx` to fetch sub-services using `GET /services/by-parent/:parentId`.
    -   Fetch bookable items using `GET /service-menus/grouped-by-subcategory`.

### Phase 2: Authentication & Profile
1.  **Login Flow:**
    -   Implement real `POST /auth/send-otp` and `/auth/login` in the Login Modal.
    -   Store JWT token.
2.  **Profile:**
    -   Fetch real user data on `/profile` using `GET /users/:id`.

### Phase 3: Booking Flow
1.  **Cart:**
    -   Implement Add to Cart (`POST /cart/:userId`) and Cart Drawer (`GET /cart/:userId`).
2.  **Checkout:**
    -   Implement Address selection (`GET /addresses/:userId`).
    -   Implement Slot selection (`GET /bookings/available-slots`).
    -   Create Booking (`POST /bookings/from-cart`).
