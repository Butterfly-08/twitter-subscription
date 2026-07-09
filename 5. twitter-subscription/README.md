# Smart Keyword Notifications

A full-stack application feature that provides instant, native browser notifications whenever a new tweet mentions specific keywords (e.g., "cricket", "science").

This project includes a Node.js/Express/MongoDB backend and a Vanilla HTML/CSS/JS frontend utilizing the browser's Notification API.

## Features

- **Keyword Detection**: Automatically detects predefined keywords in new tweets (case-insensitive, whole-word matching).
- **Native Browser Popups**: Utilizes the native browser `Notification` API to deliver popups containing the full tweet content.
- **Graceful Fallback**: If browser notifications are disabled or unsupported, gracefully degrades to a custom, animated in-app toast notification.
- **Real-Time Delivery**: The frontend globally polls for notifiable tweets, allowing users to receive alerts while navigating any part of the authenticated application.
- **Server-Side Preferences**: Granular user control over notifications. Preferences are persisted in MongoDB so they're respected seamlessly across devices.

## Architecture

- **Backend**: Node.js, Express, MongoDB, Mongoose, JSON Web Tokens (JWT)
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (No frameworks)

## Installation & Setup

1. **Clone and Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Database Configuration**
   Ensure you have a MongoDB instance running.
   Update the `.env` file in the root directory with your `MONGO_URI`.

   Example `.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/tweet_subscription_app
   JWT_SECRET=super-secret-key-12345
   NODE_ENV=development
   NOTIFICATION_KEYWORDS=cricket,science
   ```

3. **Start the Backend Server**
   ```bash
   cd backend
   node server.js
   ```
   The backend will start on `http://localhost:5000`.

4. **Serve the Frontend**
   You can serve the frontend files using any static HTTP server. For example, if you have `serve` installed globally:
   ```bash
   cd frontend
   npx serve .
   ```
   Alternatively, you can use the Live Server extension in VS Code.

## Usage

1. **Register/Login**: Open the frontend app and create an account.
2. **Enable Notifications**: Navigate to your **Profile** and toggle the "Smart Notifications" switch to ON.
3. **Grant Permissions**: Accept the browser prompt to allow native notifications.
4. **Test**: Log in with a different account on another browser/device and post a tweet containing the word "cricket" or "science". You should see a notification popup!

## Security

- Preferences are double-checked on both the client (before rendering) and the server (before sending payloads).
- API routes are protected using JWT authentication.
- Secrets are managed via `.env` variables.
