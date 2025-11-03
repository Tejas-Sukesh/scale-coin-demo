import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleRoleSelect = async () => {
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    const email = sessionStorage.getItem('signupEmail');
    const password = sessionStorage.getItem('signupPassword');

    if (!email || !password) {
      setError('Session expired. Please start over.');
      setTimeout(() => navigate('/signup'), 2000);
      return;
    }

    try {
      setLoading(true);
      setError('');
      await signup(email, password, selectedRole);

      // Clear session storage
      sessionStorage.removeItem('signupEmail');
      sessionStorage.removeItem('signupPassword');

      // Redirect to appropriate onboarding
      if (selectedRole === 'member') {
        navigate('/onboarding/member');
      } else {
        navigate('/onboarding/rushee');
      }
    } catch (err) {
      setError('Failed to create account. ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      id: 'member',
      title: 'Member',
      description: 'I am a current member of the business society',
      icon: '👤',
      features: [
        'Review rushee applications',
        'Schedule coffee chats',
        'Provide feedback and rankings',
        'Participate in deliberations'
      ]
    },
    {
      id: 'rushee',
      title: 'Rushee',
      description: 'I am applying to join the business society',
      icon: '🌟',
      features: [
        'Submit application',
        'Schedule coffee chats with members',
        'Track event attendance',
        'View progress dashboard'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full"
      >
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-primary-700 mb-2">
            Choose Your Role
          </h2>
          <p className="text-gray-600 text-lg">
            Select how you'll be using Scale + Coin
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 max-w-2xl mx-auto">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {roles.map((role) => (
            <motion.div
              key={role.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedRole(role.id)}
              className={`card cursor-pointer transition-all ${
                selectedRole === role.id
                  ? 'ring-4 ring-primary-500 bg-primary-50'
                  : 'hover:shadow-lg'
              }`}
            >
              <div className="text-5xl mb-4">{role.icon}</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {role.title}
              </h3>
              <p className="text-gray-600 mb-4">{role.description}</p>
              <ul className="space-y-2">
                {role.features.map((feature, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start">
                    <span className="text-primary-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleRoleSelect}
            disabled={loading || !selectedRole}
            className="btn-primary px-12 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Continue'}
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="block mx-auto mt-4 text-gray-500 hover:text-gray-700"
          >
            Back
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default RoleSelection;
