# Quick Start Guide - Scale + Coin

## Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
cd scale-coin
npm install
```

### Step 2: Set Up Firebase

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable these services:
   - **Authentication** (Email/Password)
   - **Firestore Database** (test mode)
   - **Storage** (test mode)

3. Get your config from Project Settings > General > Your apps > Web

### Step 3: Configure Firebase

Open `src/lib/firebase.js` and replace with your credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Step 4: Deploy Security Rules

1. Go to Firestore Database > Rules in Firebase Console
2. Copy and paste the contents of `firestore.rules`
3. Click Publish

### Step 5: Run the App

```bash
npm run dev
```

Open http://localhost:5173

## Testing the App

### Create Test Accounts

**Create a Member:**
1. Sign up with an email
2. Select "Member" role
3. Complete the onboarding questionnaire

**Create a Rushee:**
1. Sign up with a different email
2. Select "Rushee" role
3. Fill out the application form

**Create an Admin:**
1. Create a member account
2. Go to Firebase Console > Firestore
3. Find your user in the `users` collection
4. Change `role` from "member" to "admin"

### Test Features

**As a Member:**
- ✓ Add coffee chat slots
- ✓ Review rushee applications
- ✓ Give feedback (thumbs up/down/neutral)
- ✓ Rank rushees with drag-and-drop

**As a Rushee:**
- ✓ Submit application with resume
- ✓ Book coffee chats (max 2)
- ✓ Mark events as attended
- ✓ View progress dashboard

**As an Admin:**
- ✓ Create/delete events
- ✓ View all rushees and members
- ✓ See analytics
- ✓ View aggregate rankings
- ✓ Export data as JSON

## Troubleshooting

**Build fails?**
- Make sure all dependencies are installed: `npm install`
- Clear cache: `rm -rf node_modules package-lock.json && npm install`

**Firebase errors?**
- Double-check your Firebase config in `src/lib/firebase.js`
- Ensure Authentication and Firestore are enabled
- Make sure security rules are deployed

**Can't log in?**
- Check Firebase Console > Authentication to verify your account exists
- Make sure you're using the correct email/password
- Clear browser cache and try again

**Rushees not showing up?**
- Make sure the rushee completed their onboarding
- Check Firestore console to verify the `rushees` collection exists
- Verify your Firestore security rules are properly deployed

## Next Steps

1. Customize the color scheme in `tailwind.config.js`
2. Add your organization's logo to `public/`
3. Customize questions in onboarding forms
4. Deploy to production (Vercel, Netlify, or Firebase Hosting)

## Need Help?

Check the full README.md for detailed documentation.
