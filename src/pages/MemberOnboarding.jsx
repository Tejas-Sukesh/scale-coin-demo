import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const MemberOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { currentUser, fetchUserProfile } = useAuth();

  const [formData, setFormData] = useState({
    hometown: '',
    professionalInterests: '',
    major: '',
    activities: '',
    otherInterests: '',
    eventsAttended: '',
    funFact: '',
    hotTake: ''
  });

  const questions = [
    {
      id: 'hometown',
      label: 'Hometown',
      placeholder: 'Austin, Texas',
      type: 'text'
    },
    {
      id: 'professionalInterests',
      label: 'Professional Interests',
      placeholder: 'Entrepreneurship, Tech, Consulting',
      type: 'text'
    },
    {
      id: 'major',
      label: 'Major & Minor',
      placeholder: 'Econ + CS, Stats minor',
      type: 'text'
    },
    {
      id: 'activities',
      label: 'Activities',
      placeholder: 'Clubs, projects, work experience',
      type: 'textarea'
    },
    {
      id: 'otherInterests',
      label: 'Other Interests',
      placeholder: 'Hobbies, passions outside of work/school',
      type: 'textarea'
    },
    {
      id: 'eventsAttended',
      label: 'Events Attended / Will Attend',
      placeholder: 'List rush events you attended or plan to attend',
      type: 'textarea'
    },
    {
      id: 'funFact',
      label: 'Fun Fact',
      placeholder: 'Something interesting about yourself',
      type: 'text'
    },
    {
      id: 'hotTake',
      label: 'Hot Take',
      placeholder: 'Share an unpopular or bold opinion',
      type: 'textarea'
    }
  ];

  const handleInputChange = (value) => {
    const question = questions[currentStep];
    setFormData({ ...formData, [question.id]: value });
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Save member profile data
      await setDoc(doc(db, 'members', currentUser.uid), {
        ...formData,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Update user onboarding status
      await setDoc(
        doc(db, 'users', currentUser.uid),
        { onboardingComplete: true },
        { merge: true }
      );

      // Refresh user profile and wait for state to update
      await fetchUserProfile(currentUser.uid);

      // Use window.location to force a full page reload
      // This ensures the AuthContext picks up the updated profile
      window.location.href = '/dashboard/member';
    } catch (err) {
      setError('Failed to save profile. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              className="bg-primary-600 h-2 rounded-full"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="card"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {currentQuestion.label}
            </h2>
            <p className="text-gray-600 mb-6">
              Tell us about yourself. You can skip any question and complete it later.
            </p>

            {currentQuestion.type === 'textarea' ? (
              <textarea
                value={formData[currentQuestion.id]}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={currentQuestion.placeholder}
                className="input-field min-h-32 resize-y"
                autoFocus
              />
            ) : (
              <input
                type="text"
                value={formData[currentQuestion.id]}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={currentQuestion.placeholder}
                className="input-field"
                autoFocus
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <div>
                {currentStep > 0 && (
                  <button
                    onClick={handleBack}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Back
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSkip}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Skip
                </button>
                {currentStep < questions.length - 1 ? (
                  <button onClick={handleNext} className="btn-primary">
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn-primary disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Complete'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Skip All Option */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/dashboard/member')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Skip for now and complete later
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberOnboarding;
