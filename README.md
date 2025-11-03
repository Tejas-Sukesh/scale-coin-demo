# Scale + Coin

A comprehensive web-based platform for managing rush applications, attendance, coffee chats, and deliberations for university business societies.

## Features

### For Rushees
- Submit application with resume upload
- Schedule coffee chats with members (up to 2 active bookings)
- Track event attendance
- View progress dashboard
- Monitor application status

### For Members
- Review rushee applications
- Provide feedback and ratings (-1, 0, +1)
- Create and manage coffee chat availability
- Rank top 20-25 rushees with drag-and-drop
- View coffee chat history

### For Admins
- Manage events (add/edit/delete)
- View all rushees and members
- Coffee chat analytics
- Export data (rushees, feedback, attendance)
- View aggregate rankings with Condorcet-style visualization
- Comprehensive analytics dashboard

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: TailwindCSS with custom design system
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **Backend**: Firebase
  - Authentication (Email/Password)
  - Firestore (Database)
  - Storage (Resume uploads)
- **Drag & Drop**: @dnd-kit
- **Forms**: react-hook-form

## Setup Instructions

### 1. Prerequisites

- Node.js 16+ installed
- Firebase account (free tier works)

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable "Email/Password"
4. Create Firestore Database:
   - Go to Firestore Database > Create database
   - Start in "test mode" (we'll add security rules later)
5. Enable Storage:
   - Go to Storage > Get started
   - Start in "test mode"
6. Get your Firebase config:
   - Go to Project Settings > General
   - Scroll to "Your apps" and click the web icon (</>)
   - Copy the firebaseConfig object

### 3. Install Dependencies

```bash
cd scale-coin
npm install
```

### 4. Configure Firebase

Edit `src/lib/firebase.js` and replace the placeholder config with your Firebase credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 5. Deploy Firestore Security Rules

In the Firebase Console:
1. Go to Firestore Database > Rules
2. Copy the contents of `firestore.rules` and paste them
3. Click "Publish"

### 6. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 7. Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## Project Structure

```
scale-coin/
├── src/
│   ├── components/          # Reusable components
│   ├── context/             # React Context (Auth)
│   ├── lib/                 # Firebase config
│   ├── pages/               # Page components
│   │   ├── LandingPage.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── RoleSelection.jsx
│   │   ├── MemberOnboarding.jsx
│   │   ├── RusheeOnboarding.jsx
│   │   ├── MemberDashboard.jsx
│   │   ├── RusheeDashboard.jsx
│   │   ├── AdminDashboard.jsx
│   │   └── CoffeeChats.jsx
│   ├── App.jsx              # Main app with routing
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── firestore.rules          # Firestore security rules
├── tailwind.config.js       # Tailwind configuration
└── package.json
```

## Firestore Data Structure

### Collections

**users**
```javascript
{
  email: string,
  role: "member" | "rushee" | "admin",
  createdAt: timestamp,
  onboardingComplete: boolean
}
```

**members**
```javascript
{
  userId: string,
  hometown: string,
  professionalInterests: string,
  major: string,
  activities: string,
  otherInterests: string,
  eventsAttended: string,
  funFact: string,
  hotTake: string,
  createdAt: timestamp
}
```

**rushees**
```javascript
{
  userId: string,
  name: string,
  year: string,
  major: string,
  phone: string,
  linkedin: string,
  whyJoin: string,
  strengths: string,
  experience: string,
  resumeUrl: string,
  status: "pending" | "accepted" | "rejected",
  eventsAttended: array,
  coffeeChatsCompleted: number,
  createdAt: timestamp
}
```

**events**
```javascript
{
  name: string,
  date: string,
  time: string,
  location: string,
  description: string,
  createdAt: timestamp
}
```

**chats**
```javascript
{
  memberId: string,
  memberName: string,
  rusheeId: string | null,
  rusheeName: string | null,
  date: string,
  time: string,
  location: string,
  status: "available" | "booked" | "completed" | "no-show",
  createdAt: timestamp
}
```

**feedback**
```javascript
{
  memberId: string,
  rusheeId: string,
  comment: string,
  rating: -1 | 0 | 1,
  timestamp: timestamp
}
```

**rankings**
```javascript
{
  memberId: string,
  rusheeIds: array,
  updatedAt: timestamp
}
```

## User Roles

### Member
- Complete onboarding questionnaire
- Review rushee applications
- Provide feedback and ratings
- Create coffee chat slots
- Rank rushees for deliberations

### Rushee
- Submit application
- Upload resume
- Schedule coffee chats (max 2 active)
- Track event attendance
- View progress dashboard

### Admin
- All member privileges
- Manage events
- View all data
- Export data
- View analytics and aggregate rankings

## Creating Your First Admin User

1. Sign up as a new user and select "Member" role
2. Complete the onboarding
3. Go to Firebase Console > Firestore Database
4. Find the `users` collection
5. Find your user document
6. Edit the `role` field from "member" to "admin"
7. Refresh the app and navigate to `/dashboard/admin`

## Features Roadmap

- [ ] Email notifications for coffee chats
- [ ] Google Calendar integration
- [ ] Advanced analytics and reporting
- [ ] Mobile responsive improvements
- [ ] Real-time updates with Firestore listeners
- [ ] Profile editing for members
- [ ] Bulk operations for admin

## License

MIT

## Support

For issues or questions, please contact the development team.
