# Tweet Subscription App (Node.js/Express backend + Next.js frontend)

A Twitter-like app where users can post tweets, but how many tweets they can
post per month depends on the subscription plan they pick. Payments are
processed through Razorpay, restricted to a fixed time window (10:00 AM -
11:00 AM IST), and a successful payment triggers an automatic invoice email.

This version keeps the backend and frontend as **two separate servers** that
talk to each other over HTTP, the same way most real-world Node.js + Next.js
setups work:

- `backend/` -> Node.js + Express.js + MongoDB, runs on port 5000
- `frontend/` -> Next.js, runs on port 3000, calls the backend API over `fetch`

## Plans

| Plan   | Price (per month) | Tweet Limit |
|--------|--------------------|-------------|
| Free   | ₹0                 | 1 tweet     |
| Bronze | ₹100               | 3 tweets    |
| Silver | ₹300               | 5 tweets    |
| Gold   | ₹1000              | Unlimited   |

## Folder Structure

```
twitter-subscription-project/
├── backend/                  <- Node.js / Express.js API server
│   ├── config/                (db, razorpay, plans)
│   ├── controllers/           (route logic)
│   ├── middleware/            (auth check, payment time window check)
│   ├── models/                (mongoose schemas)
│   ├── routes/                (express routers)
│   ├── utils/                 (email sender, token generator)
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── frontend/                 <- Next.js app (Pages Router)
    ├── pages/
    │   ├── index.js            (login / register)
    │   └── dashboard.js        (tweets, plans, payments)
    ├── lib/api.js               (fetch wrapper that calls the backend)
    ├── components/Navbar.js
    ├── styles/globals.css
    ├── .env.local.example
    └── package.json
```

## How They Connect

The frontend never touches MongoDB or Razorpay directly. Every action goes
through HTTP calls to the backend:

```
Browser (Next.js, port 3000)
        |
        |  fetch('http://localhost:5000/api/...')
        v
Express API (port 5000) ---> MongoDB
                         ---> Razorpay
                         ---> Email (Nodemailer)
```

The frontend's base URL is set in `frontend/.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

Change this if you deploy the backend somewhere else (Render, Railway, etc).

## Setup

### 1. Backend (Express)

```bash
cd backend
npm install
copy .env.example .env
```

Fill in `backend/.env`:
- `MONGO_URI` - MongoDB connection string (local or Atlas)
- `JWT_SECRET` - any random string
- `DEMO_MODE=true` - keep this on to test without a real Razorpay account (payments are simulated, no checkout popup, instant plan upgrade). Set to `false` once real keys are added.
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` - only needed when `DEMO_MODE=false`
- `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` - for sending invoice emails (Gmail needs an App Password, not your normal password)

Run it:

```bash
npm run dev
```

Backend runs on `http://localhost:5000`.

### 2. Frontend (Next.js)

In a second terminal:

```bash
cd frontend
npm install
copy .env.local.example .env.local
npm run dev
```

Frontend runs on `http://localhost:3000`. Open that in your browser. Keep the
backend running in the other terminal at the same time - both need to be up.

## How the Time Restriction Works

`backend/middleware/paymentWindow.js` checks the current hour in IST and
blocks `/api/payments/create-order` and `/api/payments/verify` outside the
allowed window (default 10 AM - 11 AM, change via `PAYMENT_WINDOW_START_HOUR`
/ `PAYMENT_WINDOW_END_HOUR` in `.env`).

## How the Tweet Limit Works

Each user document stores `plan`, `tweetCount`, and `tweetCountMonth`.
`backend/controllers/tweetController.js` resets the counter when the month
changes, then checks the plan's limit from `backend/config/plans.js`. Gold
plan uses `tweetLimit: -1`, treated as unlimited everywhere.

## How the Invoice Email Works

After Razorpay signature verification (skipped when `DEMO_MODE=true`),
`backend/controllers/paymentController.js` updates the user's plan, generates
an invoice number, and sends an HTML invoice email via
`backend/utils/sendEmail.js` using Nodemailer. If the email fails, the
payment itself still succeeds - the failure is just logged server-side.

## Forgot Password Feature

- Page: `frontend/pages/forgot-password.js`, linked from the login screen ("Forgot password?")
- Route: `POST /api/auth/forgot-password` with body `{ identifier }` where `identifier` can be the user's registered **email or phone number**
- The backend looks up the user by either field, generates a brand new password made **only of uppercase and lowercase letters** (no numbers, no symbols - see `backend/utils/passwordGenerator.js`), saves it (hashed), and emails the new password to the user's registered email via `backend/utils/sendEmail.js`
- **Rate limited to once per day per user** - tracked via `lastPasswordResetRequest` on the User model. A second attempt within 24 hours returns:
  `"You can use this option only one time per day."`
- Phone number is optional at registration (`frontend/pages/index.js`), stored on the User model with a sparse unique index so multiple users can leave it blank without conflict.
- Show/Hide password toggle is available on login and register forms via `frontend/components/PasswordInput.js`.

## Notes

- Plan validity is 30 days from the date of payment, then falls back to Free automatically.
- No admin panel included, by design - wasn't part of the requirement.
- Test Razorpay payments with their test card `4111 1111 1111 1111`, any future expiry, any CVV - only relevant once `DEMO_MODE=false`.

## Known Limitations

- No password reset flow.
- No refund handling.
- No Razorpay webhook - only the client-side checkout handler flow is used (fine for getting started, but production apps should add a webhook as backup).
