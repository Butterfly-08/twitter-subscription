# TweetBox Premium - Unified Real-Time Twitter Subscription App

A unified, full-stack real-time social feed application designed with a premium space-navy palette, glassmorphism panels, and interactive particle networks. This application combines various security, payment, localization, audio-recording, and notification features into a single, unified codebase with real-time WebSocket capabilities.

---

## Key Features

1. **Real-Time Timelines & Notifications (WebSockets)**
   - Powered by a standard HTTP + WebSocket (`ws`) server on the backend.
   - New tweets (text or voice) are broadcast instantly to all online clients, automatically prepending them to the feed.
   - Users can enable **Smart Notifications** and configure custom, comma-separated keywords (e.g., `cricket, science`). When a matching tweet is posted, they receive a native browser alert or an in-app animated toast alert in real-time.

2. **Security Controls & Restricted Time Windows**
   - **Mobile Login Restriction:** Mobile user-agents are blocked from logging in outside the allowed **10:00 AM - 1:00 PM IST** window.
   - **Payment Allowed Window:** Upgrades and checkouts are restricted to the **10:00 AM - 11:00 AM IST** window.
   - **Audio Upload Window:** Voice postings are restricted to the **2:00 PM - 7:00 PM IST** window (configurable bypass for development).

3. **Multi-Factor OTP Verification**
   - **Google Chrome Login OTP:** Chrome users require a 6-digit email verification token to authenticate after entering correct credentials.
   - **Audio Posting OTP:** Posting voice recordings or file uploads requires a temporary authorization token obtained via email OTP verification.
   - **Language Selection OTP:** Switching your preferred language triggers an email or SMS OTP confirmation flow before updating the user profile.

4. **Interactive Audio Tweets**
   - Record voice clips directly in the browser using the native `MediaRecorder` API.
   - Live Voice Waveform visualization on a canvas reacting to audio amplitude using the `Web Audio API`.
   - Supports drag-and-drop audio files up to **100MB** and maximum duration of **5 minutes (300 seconds)**, validated via server-side metadata parsing (`music-metadata`).

5. **Subscription Plans & Razorpay Payments**
   - Plans: Free (₹0, limit 1 tweet/month), Bronze (₹100, limit 3 tweets/month), Silver (₹300, limit 5 tweets/month), Gold (₹1000, unlimited tweets).
   - Monthly tweet limit tracking, automatically resetting when the calendar month changes.
   - Simulated `DEMO_MODE` auto-completes orders instantly and dispatches premium HTML invoices using Ethereal/SMTP.

6. **Forgot Password Reset Flow**
   - Reset password using your registered email or phone number.
   - Generates a random, **letters-only** temporary password and emails it.
   - Strict rate-limiting allows only **one password reset request per user per day**.

7. **Login History Auditing**
   - Track every login attempt with browser name, operating system, IP address, device type, and authentication status.

---

## Directory Structure

```
realtime-twitter-subscription/
├── backend/
│   ├── config/          # Configurations (DB, mailer, SMS twilio, plan pricing, env)
│   ├── controllers/     # Controller modules (auth, tweets, payments, language)
│   ├── middlewares/     # Middlewares (JWT auth, error handler, rate limit, upload handler)
│   ├── models/          # Mongoose database models (User, Tweet, LoginHistory, Payment, etc)
│   ├── routes/          # API Routers
│   ├── utils/           # Utilities (device detector, mobile checks, OTP timers, password generators)
│   ├── app.js           # Express app instance setup
│   └── server.js        # Server initialization and WebSocket connector
└── frontend/
    ├── assets/          # Static styles, javascript modules, and canvas graphics
    ├── locales/         # Multi-language translation JSON bundles
    └── index.html       # Single-Page-App dashboard dashboard container
└── .env                 # Environment variables configuration
```

---

## Installation & Local Setup

### 1. Database Configuration
Ensure a local MongoDB server is running on `mongodb://localhost:27017` (or provide a remote connection string).

### 2. Environment Configurations
Create a `.env` file in the root directory (a pre-configured template is already supplied):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/realtime_twitter_db
JWT_SECRET=super_secret_jwt_key_99881122
OTP_HASH_SECRET=super_secret_otp_hash_key_112233
SESSION_SECRET=super_secret_session_key_445566

# simulated payment mode for easy testing (instant upgrades without Razorpay keys)
DEMO_MODE=true

# Set to true to bypass the 2:00 PM - 7:00 PM audio upload time window during testing
DEV_BYPASS_TIME_WINDOW=true

# Security Window Configurations
UPLOAD_WINDOW_START_IST=14:00
UPLOAD_WINDOW_END_IST=19:00
PAYMENT_WINDOW_START_HOUR=10
PAYMENT_WINDOW_END_HOUR=11
MOBILE_LOGIN_WINDOW_START_HOUR=10
MOBILE_LOGIN_WINDOW_END_HOUR=13

# Audio Validation Limits
MAX_FILE_SIZE_MB=100
MAX_DURATION_SECONDS=300

# Default keyword preferences
NOTIFICATION_KEYWORDS=cricket,science,technology
```

### 3. Start Backend Node Server
Open a terminal, navigate to the backend folder, install dependencies, and start the app:
```bash
cd backend
npm install
npm start
```
The server will bind and start on `http://localhost:5000`.

---

## Verifying Real-Time Features

1. Open `http://localhost:5000` in two separate browser windows (or one incognito window).
2. Register two accounts (e.g. `@userA` and `@userB`).
3. On `@userB`'s window:
   - Navigate to **Settings** on the sidebar.
   - Toggle **Smart Keyword Notifications** to **ON**.
   - Input custom keywords (e.g., `tech, sports`).
4. On `@userA`'s window:
   - Navigate to **Compose Tweet** on the sidebar.
   - Post a text tweet: *"I am learning some cool new tech today!"*.
5. Watch `@userB`'s timeline:
   - The tweet will immediately append to their feed in real-time.
   - `@userB` will receive a browser notification or animated fallback toast indicating a keyword match alert.
