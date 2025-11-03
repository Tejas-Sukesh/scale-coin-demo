import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';

const RusheeDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [rusheeData, setRusheeData] = useState(null);
  const [events, setEvents] = useState([]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch rushee profile
      const rusheeQuery = query(collection(db, 'rushees'), where('userId', '==', currentUser.uid));
      const rusheeSnapshot = await getDocs(rusheeQuery);
      if (!rusheeSnapshot.empty) {
        setRusheeData({ id: rusheeSnapshot.docs[0].id, ...rusheeSnapshot.docs[0].data() });
      }

      // Fetch events
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const eventsData = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(eventsData);

      // Fetch coffee chats
      const chatsQuery = query(collection(db, 'chats'), where('rusheeId', '==', currentUser.uid));
      const chatsSnapshot = await getDocs(chatsQuery);
      const chatsData = chatsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(chatsData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEventAttendance = async (eventId, attended) => {
    try {
      const rusheeQuery = query(collection(db, 'rushees'), where('userId', '==', currentUser.uid));
      const rusheeSnapshot = await getDocs(rusheeQuery);

      if (!rusheeSnapshot.empty) {
        const rusheeDocId = rusheeSnapshot.docs[0].id;
        const currentEvents = rusheeData.eventsAttended || [];

        let updatedEvents;
        if (attended) {
          updatedEvents = [...currentEvents, eventId];
        } else {
          updatedEvents = currentEvents.filter(id => id !== eventId);
        }

        await updateDoc(doc(db, 'rushees', rusheeDocId), {
          eventsAttended: updatedEvents
        });

        setRusheeData({ ...rusheeData, eventsAttended: updatedEvents });
      }
    } catch (err) {
      console.error('Error updating attendance:', err);
    }
  };

  const eventsAttended = rusheeData?.eventsAttended || [];
  const totalEvents = events.length;
  const attendanceRate = totalEvents > 0 ? (eventsAttended.length / totalEvents) * 100 : 0;
  const completedChats = chats.filter(c => c.status === 'completed').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-700">Scale + Coin</h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => navigate('/coffee-chats')}
              className="text-gray-700 hover:text-primary-600"
            >
              Coffee Chats
            </button>
            <button onClick={logout} className="text-gray-600 hover:text-gray-800">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome, {rusheeData?.name}!
          </h2>
          <p className="text-gray-600">
            Track your progress through the rush process
          </p>
        </motion.div>

        {/* Progress Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Events Attended</p>
                <p className="text-3xl font-bold text-primary-600">
                  {eventsAttended.length}/{totalEvents}
                </p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Coffee Chats</p>
                <p className="text-3xl font-bold text-primary-600">
                  {completedChats}
                </p>
              </div>
              <div className="text-4xl">☕</div>
            </div>
            <button
              onClick={() => navigate('/coffee-chats')}
              className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Schedule More →
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Application Status</p>
                <p className="text-lg font-bold text-green-600 capitalize">
                  {rusheeData?.status || 'Pending'}
                </p>
              </div>
              <div className="text-4xl">📝</div>
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Events Section */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4">Rush Events</h3>
            <div className="space-y-3">
              {events.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No events scheduled yet
                </p>
              ) : (
                events.map(event => (
                  <div
                    key={event.id}
                    className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{event.name}</h4>
                      <p className="text-sm text-gray-600">{event.date} at {event.time}</p>
                      <p className="text-sm text-gray-500">{event.location}</p>
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      )}
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={eventsAttended.includes(event.id)}
                        onChange={(e) => handleEventAttendance(event.id, e.target.checked)}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-600">Attended</span>
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Chats Section */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4">My Coffee Chats</h3>
            <div className="space-y-3">
              {chats.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    No coffee chats scheduled yet
                  </p>
                  <button
                    onClick={() => navigate('/coffee-chats')}
                    className="btn-primary"
                  >
                    Schedule a Chat
                  </button>
                </div>
              ) : (
                chats.map(chat => (
                  <div
                    key={chat.id}
                    className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {chat.memberName}
                      </h4>
                      <p className="text-sm text-gray-600">{chat.date} at {chat.time}</p>
                      <p className="text-sm text-gray-500">📍 {chat.location}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        chat.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : chat.status === 'booked'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {chat.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Application Details Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card mt-6"
        >
          <h3 className="text-xl font-bold mb-4">Your Application</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-700">Why Join</p>
              <p className="text-gray-600 mt-1">{rusheeData?.whyJoin}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Key Strengths</p>
              <p className="text-gray-600 mt-1">{rusheeData?.strengths}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-700">Experience</p>
              <p className="text-gray-600 mt-1">{rusheeData?.experience}</p>
            </div>
            {rusheeData?.resumeUrl && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Resume</p>
                <a
                  href={rusheeData.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  View Resume →
                </a>
              </div>
            )}
          </div>
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card mt-6 bg-primary-50 border-primary-200"
        >
          <h3 className="text-lg font-bold text-primary-800 mb-3">
            Tips for Success
          </h3>
          <ul className="space-y-2 text-sm text-primary-900">
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">✓</span>
              Attend as many rush events as possible to show your interest
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">✓</span>
              Schedule coffee chats to get to know members personally
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">✓</span>
              Be authentic and let your personality shine through
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">✓</span>
              Follow up after coffee chats with a thank you message
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default RusheeDashboard;
