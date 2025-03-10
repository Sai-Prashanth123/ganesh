# Firebase Authentication Setup

This document provides instructions on how to set up Firebase Authentication for the application.

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click on "Add project" and follow the steps to create a new project
3. Give your project a name and follow the setup wizard

## Step 2: Register Your Web App

1. In the Firebase Console, click on your project
2. Click on the web icon (</>) to add a web app
3. Register your app with a nickname (e.g., "JobSpring Web")
4. Check the box for "Also set up Firebase Hosting" if you plan to deploy the app
5. Click "Register app"

## Step 3: Copy Firebase Configuration

After registering your app, you'll see a configuration object like this:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

Copy this configuration and replace the placeholder values in `src/firebase/config.js`.

## Step 4: Enable Authentication Methods

1. In the Firebase Console, go to "Authentication" in the left sidebar
2. Click on "Get started" or "Sign-in method" tab
3. Enable "Email/Password" authentication by clicking on it and toggling the switch
4. Click "Save"

## Step 5: Set Up Firestore Database

1. In the Firebase Console, go to "Firestore Database" in the left sidebar
2. Click on "Create database"
3. Choose "Start in production mode" or "Start in test mode" (for development)
4. Select a location for your database
5. Click "Enable"

## Step 6: Set Up Security Rules

1. In the Firestore Database section, go to the "Rules" tab
2. Update the rules to secure your data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/resumes/{resumeId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click "Publish"

## Step 7: Install Firebase CLI (Optional, for Deployment)

1. Install Firebase CLI globally:
   ```
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```
   firebase login
   ```

3. Initialize Firebase in your project:
   ```
   firebase init
   ```

4. Select Hosting and other services you need
5. Follow the prompts to set up your project

## Step 8: Deploy Your Application (Optional)

1. Build your application:
   ```
   npm run build
   ```

2. Deploy to Firebase:
   ```
   firebase deploy
   ```

## Troubleshooting

- If you encounter CORS issues, make sure your backend API has proper CORS headers
- If authentication is not working, check the Firebase console for any error messages
- Ensure your Firebase configuration is correctly copied to the config file 