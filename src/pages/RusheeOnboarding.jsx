import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const RusheeOnboarding = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const navigate = useNavigate();
  const { currentUser, fetchUserProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    year: '',
    major: '',
    phone: '',
    linkedin: '',
    whyJoin: '',
    strengths: '',
    experience: ''
  });

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Resume file must be less than 5MB');
        return;
      }
      setResumeFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      let resumeUrl = '';

      // Upload resume if provided
      if (resumeFile) {
        const resumeRef = ref(storage, `resumes/${currentUser.uid}/${resumeFile.name}`);
        await uploadBytes(resumeRef, resumeFile);
        resumeUrl = await getDownloadURL(resumeRef);
      }

      // Save rushee application data
      await setDoc(doc(db, 'rushees', currentUser.uid), {
        ...formData,
        userId: currentUser.uid,
        resumeUrl,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        eventsAttended: [],
        coffeeChatsCompleted: 0
      });

      // Update user onboarding status
      await setDoc(
        doc(db, 'users', currentUser.uid),
        { onboardingComplete: true },
        { merge: true }
      );

      // Refresh user profile and wait for state to update
      await fetchUserProfile(currentUser.uid);

      // Navigate to rushee dashboard
      navigate('/dashboard/rushee');
    } catch (err) {
      setError('Failed to submit application. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-700 mb-2">
            Rush Application
          </h1>
          <p className="text-gray-600 text-lg">
            Tell us about yourself and why you want to join
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Basic Information
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  className="input-field"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year *
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  required
                  className="input-field"
                >
                  <option value="">Select year</option>
                  <option value="Freshman">Freshman</option>
                  <option value="Sophomore">Sophomore</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Major *
              </label>
              <input
                type="text"
                value={formData.major}
                onChange={(e) => handleInputChange('major', e.target.value)}
                required
                className="input-field"
                placeholder="Economics, Computer Science"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="input-field"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => handleInputChange('linkedin', e.target.value)}
                  className="input-field"
                  placeholder="https://linkedin.com/in/yourname"
                />
              </div>
            </div>
          </div>

          {/* Resume Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resume (PDF, Max 5MB)
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleResumeUpload}
              className="input-field"
            />
            {resumeFile && (
              <p className="text-sm text-green-600 mt-1">
                Selected: {resumeFile.name}
              </p>
            )}
          </div>

          {/* Short Answer Questions */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Short Answers
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why do you want to join our business society? *
                </label>
                <textarea
                  value={formData.whyJoin}
                  onChange={(e) => handleInputChange('whyJoin', e.target.value)}
                  required
                  className="input-field min-h-32"
                  placeholder="Share your motivation and what you hope to gain..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What are your key strengths? *
                </label>
                <textarea
                  value={formData.strengths}
                  onChange={(e) => handleInputChange('strengths', e.target.value)}
                  required
                  className="input-field min-h-24"
                  placeholder="List 2-3 strengths with brief examples..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relevant Experience *
                </label>
                <textarea
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  required
                  className="input-field min-h-32"
                  placeholder="Internships, projects, leadership roles, etc..."
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default RusheeOnboarding;
