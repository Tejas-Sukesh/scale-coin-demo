import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, fetchUserProfile } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      const userCredential = await login(email, password);
      const user = userCredential.user;

      // Fetch user profile to get role and onboarding status
      const profile = await fetchUserProfile(user.uid);

      if (!profile) {
        setError('User profile not found');
        return;
      }

      // Redirect based on role and onboarding status
      if (!profile.onboardingComplete) {
        // Redirect to onboarding if not complete
        if (profile.role === 'member' || profile.role === 'admin') {
          window.location.href = '/onboarding/member';
        } else if (profile.role === 'rushee') {
          window.location.href = '/onboarding/rushee';
        }
      } else {
        // Redirect to appropriate dashboard
        if (profile.role === 'member') {
          window.location.href = '/dashboard/member';
        } else if (profile.role === 'rushee') {
          window.location.href = '/dashboard/rushee';
        } else if (profile.role === 'admin') {
          window.location.href = '/dashboard/admin';
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError(`Failed to log in: ${err.message || 'Please check your credentials.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="card max-w-md w-full"
      >
        <h2 className="text-3xl font-bold text-center text-primary-700 mb-2">
          Welcome Back
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Log in to Scale + Coin
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
              placeholder="your.email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
            Sign up
          </Link>
        </p>

        <button
          onClick={() => navigate('/')}
          className="text-gray-500 hover:text-gray-700 text-sm mt-4 w-full text-center"
        >
          Back to Home
        </button>
      </motion.div>
    </div>
  );
};

export default Login;
