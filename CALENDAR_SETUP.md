# Google Calendar Integration Setup

The coffee chat feature now includes automatic Google Calendar integration! When a rushee books a coffee chat, it's automatically added to both the member's and rushee's Google Calendars.

## Features

✅ **Automatic Event Creation** - Calendar events created when bookings are made
✅ **Email Invitations** - Both parties receive calendar invites
✅ **Automatic Reminders** - 24-hour email + 15-min popup reminders
✅ **Sync on Cancel** - Calendar events deleted when bookings are canceled
✅ **Completion Tracking** - Events marked as completed with visual indicator
✅ **One-Click Connection** - Simple OAuth flow for calendar access

## Setup Instructions

### Step 1: Enable Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one if needed)
3. Go to **APIs & Services** → **Library**
4. Search for "Google Calendar API"
5. Click **Enable**

### Step 2: Create OAuth 2.0 Credentials

1. In Google Cloud Console, go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - User Type: **External**
   - App name: **Scale + Coin**
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add `https://www.googleapis.com/auth/calendar.events`
   - Test users: Add your email and any test user emails
   - Click **Save and Continue**

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **Scale + Coin Web Client**
   - Authorized JavaScript origins:
     ```
     http://localhost:5173
     http://localhost:3000
     https://your-production-domain.com
     ```
   - Authorized redirect URIs: (leave empty for client-side OAuth)
   - Click **CREATE**

5. **Copy your Client ID** - it will look like:
   ```
   123456789-abcdefghijklmnop.apps.googleusercontent.com
   ```

### Step 3: Configure the App

1. Open `src/lib/googleCalendar.js`
2. Find this line:
   ```javascript
   export const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_OAUTH_CLIENT_ID';
   ```
3. Replace `YOUR_GOOGLE_OAUTH_CLIENT_ID` with your actual Client ID:
   ```javascript
   export const GOOGLE_CLIENT_ID = '123456789-abcdefghijklmnop.apps.googleusercontent.com';
   ```

### Step 4: Test the Integration

1. Start the dev server: `npm run dev`
2. Log in as a rushee
3. Go to **Coffee Chats**
4. Click **Connect Calendar**
5. Grant permissions when prompted
6. Book a coffee chat
7. Check your Google Calendar - the event should appear!

## How It Works

### For Rushees:
1. Navigate to Coffee Chats page
2. Click "Connect Calendar" button
3. Grant Google Calendar permissions (one-time)
4. Book a coffee chat slot
5. Event automatically appears in your calendar

### For Members:
1. Connect Google Calendar (same process)
2. Create coffee chat slots
3. When rushee books, event created in both calendars
4. Mark chat as "Completed" to update calendar
5. Event shows as completed with checkmark

### Calendar Event Details:
- **Title:** "Coffee Chat: [Member Name] & [Rushee Name]"
- **Duration:** 30 minutes
- **Location:** As specified in the slot
- **Description:** Auto-generated with context
- **Attendees:** Both member and rushee
- **Reminders:**
  - Email: 24 hours before
  - Popup: 15 minutes before

## Data Stored in Firestore

When calendar is connected, we store:
```javascript
users/{userId}: {
  calendarConnected: true,
  calendarEmail: "user@gmail.com",
  calendarConnectedAt: "2025-01-01T00:00:00Z"
}
```

When coffee chat is booked:
```javascript
chats/{chatId}: {
  // ... other chat data
  calendarEventId: "abc123xyz" // Google Calendar event ID
}
```

## Troubleshooting

### "Calendar not connected" even after authorizing
- Clear browser cache and try again
- Check that the Client ID is correct in `googleCalendar.js`
- Verify the API is enabled in Google Cloud Console

### Events not appearing in calendar
- Check browser console for errors
- Verify both users have connected their calendars
- Make sure Google Calendar API is enabled
- Check quota limits in Google Cloud Console

### OAuth consent screen warnings
- This is normal for apps in development
- Add test users in OAuth consent screen
- For production, submit for verification

### Permission errors
- Ensure `https://www.googleapis.com/auth/calendar.events` scope is included
- Re-authorize if you change scopes
- Check that user granted all permissions

## Security Notes

- ✅ Only calendar events scope is requested (minimal permissions)
- ✅ OAuth tokens stored securely by Google's client library
- ✅ Calendar access can be revoked anytime via "Disconnect" button
- ✅ User can also revoke via [Google Account Settings](https://myaccount.google.com/permissions)

## Production Deployment

Before deploying to production:

1. **Update Authorized Origins:**
   - Add your production domain to Authorized JavaScript origins
   - Example: `https://scale-coin.vercel.app`

2. **Verify OAuth Consent Screen:**
   - Submit app for verification if needed
   - Update privacy policy and terms of service links

3. **Update Client ID:**
   - Use environment variables for Client ID
   - Don't commit credentials to git

Example with environment variables:
```javascript
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
```

Then in `.env`:
```
VITE_GOOGLE_CLIENT_ID=your-client-id-here
```

## Optional Enhancements

Want to add more features? Here are some ideas:

- **Google Meet Integration:** Add video call links automatically
- **Recurring Slots:** Create multiple slots at once
- **Availability Check:** Check member's calendar before showing slots
- **Time Zone Support:** Handle different time zones automatically
- **Notifications:** Send email reminders independent of Google Calendar

## Support

If you need help:
1. Check the [Google Calendar API Docs](https://developers.google.com/calendar)
2. Review error messages in browser console
3. Verify all setup steps were completed correctly
