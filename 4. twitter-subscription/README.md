# Audio Tweet Feature

A complete end-to-end "Audio Tweet" feature for a social platform, featuring a heavily polished animated UI and a secure Node.js backend enforcing strict audio upload limits.

## Features

*   **In-Browser Recording**: Record audio directly from the browser using the native `MediaRecorder` API.
*   **Live Waveform Visualization**: Visualizes voice amplitude in real-time using the `Web Audio API`.
*   **Audio Upload**: Drag and drop or browse to upload pre-recorded audio files (`.mp3`, `.wav`, `.m4a`, `.ogg`, `.webm`).
*   **Strict Validations**:
    *   **Time Window**: Uploads are strictly restricted to the 2:00 PM - 7:00 PM IST window.
    *   **Duration Cap**: Audio length is capped at a hard maximum of 5 minutes (300 seconds), enforced via server-side metadata parsing.
    *   **Size Cap**: File size is capped at 100MB, enforced at the upload stream level.
*   **OTP Security**: Uploads require a 6-digit One-Time Password sent to the user's registered email, verified before the upload is accepted.
*   **High-Fidelity Animated UI**: 
    *   Zero dependencies, pure HTML/CSS/Vanilla JS.
    *   Deep space-navy palette and frosted-glass panels.
    *   Custom `<canvas>` background featuring drifting aurora blobs, audio-reactive ripples, and particles.

## Prerequisites

*   Node.js (LTS recommended)
*   MongoDB (Running locally or accessible via URI)

## Installation

1.  Clone this repository or download the source code.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Ensure your `.env` file is configured correctly. A template is provided below.

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=4000
MONGO_URI=mongodb://npratheepan07_db_user:AMMALOVE%4008@localhost:27017/tweet_subscription_app?authSource=admin
OTP_SIGNING_SECRET=your_super_secret_key
MAX_FILE_SIZE_MB=100
MAX_DURATION_SECONDS=300
UPLOAD_WINDOW_START_IST=14:00
UPLOAD_WINDOW_END_IST=19:00

# Set to true to test uploads outside of the 2PM - 7PM IST window
DEV_BYPASS_TIME_WINDOW=true

# SMTP details for sending OTP emails (Optional)
# If omitted, OTPs will be printed to the server console in [DEV MODE]
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=your_email@example.com
# SMTP_PASS=your_email_password
```

## Running the Application

To start the server in development mode (using nodemon):

```bash
npm run dev
```

To start the server in production mode:

```bash
npm start
```

Once running, navigate to `http://localhost:4000` in your browser.

## Testing Locally

1.  Open the application in your browser.
2.  Click **Compose Audio Tweet**.
3.  (For testing) Enter an email when prompted to mock a logged-in user session.
4.  Record an audio clip or upload a file.
5.  Click **Continue to verify**.
6.  Look at your backend server terminal to find the 6-digit OTP code (if SMTP is not configured).
7.  Enter the code and click **Verify & Post**.

## Architecture Overview

*   **Frontend**: 
    *   `public/index.html`: Structure and modal states.
    *   `public/style.css`: Design system and custom CSS animations.
    *   `public/script.js`: State machine, API calls, and canvas drawing logic.
*   **Backend**:
    *   `server.js`: Express configuration and route aggregation.
    *   `models/`: Mongoose schemas (`AudioTweet`, `User`).
    *   `middleware/`: Enforces OTP authentication, time window, and Multer file upload limits.
    *   `routes/`: API endpoints for authentication and audio processing.
    *   `utils/`: Helper logic for OTP generation, JWT token signing, and mailers.
