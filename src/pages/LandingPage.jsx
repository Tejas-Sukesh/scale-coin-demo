import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  useEffect(() => {
    // Redirect logged-in users to their dashboard
    if (currentUser && userProfile) {
      if (userProfile.role === 'member' || userProfile.role === 'admin') {
        navigate('/dashboard/member');
      } else if (userProfile.role === 'rushee') {
        navigate('/dashboard/rushee');
      }
    }
  }, [currentUser, userProfile, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-4xl"
      >
        {/* Logo/Title */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="text-6xl md:text-7xl font-bold text-primary-700 mb-4">
            Scale + Coin
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl md:text-2xl text-gray-600 mb-12"
        >
          Streamline rush. Simplify deliberations.
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto"
        >
          The comprehensive platform for managing rush applications, attendance tracking,
          coffee chats, and deliberations for your university business society.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <button
            onClick={() => navigate('/login')}
            className="btn-primary w-full sm:w-auto px-8 py-3 text-lg"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="btn-secondary w-full sm:w-auto px-8 py-3 text-lg"
          >
            Sign Up
          </button>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="card text-center">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="font-semibold text-lg mb-2">Applications</h3>
            <p className="text-gray-600 text-sm">
              Streamlined application process for rushees
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-3">☕</div>
            <h3 className="font-semibold text-lg mb-2">Coffee Chats</h3>
            <p className="text-gray-600 text-sm">
              Easy scheduling system for member-rushee connections
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="font-semibold text-lg mb-2">Deliberations</h3>
            <p className="text-gray-600 text-sm">
              Organized feedback and ranking for informed decisions
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LandingPage;
