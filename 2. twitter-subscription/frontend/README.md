# TweetBox Frontend (Next.js version)

This is the Next.js version of the frontend, using the Pages Router. It talks
to the same backend (`/backend` folder) you already have running on port
5000 - nothing on the backend changes.

## Setup

```bash
cd frontend-nextjs
npm install
copy .env.local.example .env.local
```

Edit `.env.local` if your backend isn't running on `http://localhost:5000`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

## Run

```bash
npm run dev
```

Open `http://localhost:3000` in your browser. Make sure the backend
(`backend/` folder) is running separately on port 5000 at the same time.

## Pages

- `pages/index.js` - login / register screen
- `pages/dashboard.js` - main app: post tweets, see plans, subscribe, view payment history
- `lib/api.js` - fetch wrapper + localStorage helpers for token/user
- `components/Navbar.js` - top navbar with logout

## Notes

- Auth token and user info are stored in `localStorage`, same as the plain JS version.
- Demo mode payments work the same way - if `DEMO_MODE=true` is set in the
  backend `.env`, clicking Subscribe skips Razorpay entirely and instantly
  upgrades the plan.
- If `DEMO_MODE=false` and real Razorpay keys are set, the Razorpay checkout
  popup loads via the script tag in `pages/_app.js`.
