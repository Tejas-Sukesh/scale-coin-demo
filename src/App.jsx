import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CalendarProvider } from './context/CalendarContext';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RoleSelection from './pages/RoleSelection';
import MemberOnboarding from './pages/MemberOnboarding';
import RusheeOnboarding from './pages/RusheeOnboarding';
import MemberDashboard from './pages/MemberDashboard';
import RusheeDashboard from './pages/RusheeDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CoffeeChats from './pages/CoffeeChats';

// Protected Route component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userProfile } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(userProfile?.role)) {
    return <Navigate to="/" />;
  }

  // Redirect to onboarding if not complete
  if (userProfile && !userProfile.onboardingComplete) {
    if (userProfile.role === 'member') {
      return <Navigate to="/onboarding/member" />;
    } else if (userProfile.role === 'rushee') {
      return <Navigate to="/onboarding/rushee" />;
    }
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CalendarProvider>
          <div className="min-h-screen">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/role-selection" element={<RoleSelection />} />

              {/* Onboarding Routes */}
              <Route path="/onboarding/member" element={<MemberOnboarding />} />
              <Route path="/onboarding/rushee" element={<RusheeOnboarding />} />

              {/* Dashboard Routes */}
              <Route
                path="/dashboard/member"
                element={
                  <ProtectedRoute allowedRoles={['member', 'admin']}>
                    <MemberDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/rushee"
                element={
                  <ProtectedRoute allowedRoles={['rushee']}>
                    <RusheeDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Coffee Chats */}
              <Route
                path="/coffee-chats"
                element={
                  <ProtectedRoute>
                    <CoffeeChats />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </CalendarProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
