import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const [view, setView] = useState('overview'); // overview, events, rushees, members, analytics
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // State for data
  const [events, setEvents] = useState([]);
  const [rushees, setRushees] = useState([]);
  const [members, setMembers] = useState([]);
  const [chats, setChats] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [rankings, setRankings] = useState([]);

  // Modal state
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    description: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch all collections
      const [eventsSnap, rusheesSnap, membersSnap, chatsSnap, feedbackSnap, rankingsSnap] =
        await Promise.all([
          getDocs(collection(db, 'events')),
          getDocs(collection(db, 'rushees')),
          getDocs(collection(db, 'members')),
          getDocs(collection(db, 'chats')),
          getDocs(collection(db, 'feedback')),
          getDocs(collection(db, 'rankings'))
        ]);

      setEvents(eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setRushees(rusheesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setMembers(membersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setChats(chatsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setFeedback(feedbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setRankings(rankingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'events'), {
        ...eventForm,
        createdAt: new Date().toISOString()
      });
      setEventForm({ name: '', date: '', time: '', location: '', description: '' });
      setShowEventModal(false);
      fetchAllData();
    } catch (err) {
      console.error('Error adding event:', err);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteDoc(doc(db, 'events', eventId));
        fetchAllData();
      } catch (err) {
        console.error('Error deleting event:', err);
      }
    }
  };

  const exportData = (data, filename) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  // Analytics calculations
  const totalChats = chats.length;
  const completedChats = chats.filter(c => c.status === 'completed').length;
  const averageEventsPerRushee =
    rushees.length > 0
      ? rushees.reduce((sum, r) => sum + (r.eventsAttended?.length || 0), 0) / rushees.length
      : 0;

  // Aggregate rankings (simplified Condorcet-style)
  const aggregateRankings = () => {
    const rusheeScores = {};

    rankings.forEach(ranking => {
      ranking.rusheeIds?.forEach((rusheeId, index) => {
        if (!rusheeScores[rusheeId]) {
          rusheeScores[rusheeId] = 0;
        }
        // Higher ranks get higher scores (reverse index)
        rusheeScores[rusheeId] += ranking.rusheeIds.length - index;
      });
    });

    return Object.entries(rusheeScores)
      .sort(([, a], [, b]) => b - a)
      .map(([rusheeId, score]) => ({
        rushee: rushees.find(r => r.id === rusheeId),
        score
      }))
      .filter(r => r.rushee);
  };

  const topRankedRushees = aggregateRankings().slice(0, 25);

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
          <h1 className="text-2xl font-bold text-primary-700">Admin Dashboard</h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => navigate('/dashboard/member')}
              className="text-gray-700 hover:text-primary-600"
            >
              Member View
            </button>
            <button onClick={logout} className="text-gray-600 hover:text-gray-800">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* View Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['overview', 'events', 'rushees', 'members', 'analytics'].map(tab => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                view === tab ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview View */}
        {view === 'overview' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Rush Overview</h2>
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <StatCard title="Total Rushees" value={rushees.length} icon="👥" />
              <StatCard title="Total Members" value={members.length} icon="🎓" />
              <StatCard title="Total Events" value={events.length} icon="📅" />
              <StatCard
                title="Completed Chats"
                value={`${completedChats}/${totalChats}`}
                icon="☕"
              />
            </div>

            {/* Quick Actions */}
            <div className="card mb-6">
              <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <button onClick={() => setShowEventModal(true)} className="btn-primary">
                  + Add Event
                </button>
                <button
                  onClick={() => exportData(rushees, 'rushees.json')}
                  className="btn-secondary"
                >
                  Export Rushees
                </button>
                <button
                  onClick={() => exportData(feedback, 'feedback.json')}
                  className="btn-secondary"
                >
                  Export Feedback
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Events View */}
        {view === 'events' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Events Management</h2>
              <button onClick={() => setShowEventModal(true)} className="btn-primary">
                + Add Event
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {events.map(event => (
                <div key={event.id} className="card">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold">{event.name}</h3>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    {event.date} at {event.time}
                  </p>
                  <p className="text-sm text-gray-600">📍 {event.location}</p>
                  {event.description && (
                    <p className="text-sm text-gray-500 mt-2">{event.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rushees View */}
        {view === 'rushees' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Rushees</h2>
            <div className="card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Year</th>
                    <th className="text-left py-3 px-4">Major</th>
                    <th className="text-left py-3 px-4">Events</th>
                    <th className="text-left py-3 px-4">Chats</th>
                    <th className="text-left py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rushees.map(rushee => {
                    const rusheeChats = chats.filter(
                      c => c.rusheeId === rushee.userId && c.status === 'completed'
                    ).length;
                    return (
                      <tr key={rushee.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{rushee.name}</td>
                        <td className="py-3 px-4">{rushee.year}</td>
                        <td className="py-3 px-4">{rushee.major}</td>
                        <td className="py-3 px-4">
                          {rushee.eventsAttended?.length || 0}/{events.length}
                        </td>
                        <td className="py-3 px-4">{rusheeChats}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                            {rushee.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Members View */}
        {view === 'members' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Members</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map(member => (
                <div key={member.id} className="card">
                  <h3 className="font-bold text-lg mb-2">{member.name || 'Member'}</h3>
                  <p className="text-sm text-gray-600">{member.hometown}</p>
                  <p className="text-sm text-gray-600">{member.major}</p>
                  <p className="text-sm text-gray-500 mt-2">{member.professionalInterests}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics View */}
        {view === 'analytics' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Analytics</h2>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <StatCard
                title="Avg Events/Rushee"
                value={averageEventsPerRushee.toFixed(1)}
                icon="📊"
              />
              <StatCard
                title="Chat Completion Rate"
                value={
                  totalChats > 0 ? `${((completedChats / totalChats) * 100).toFixed(0)}%` : 'N/A'
                }
                icon="✓"
              />
              <StatCard title="Total Feedback" value={feedback.length} icon="💬" />
            </div>

            {/* Aggregate Rankings */}
            <div className="card">
              <h3 className="text-xl font-bold mb-4">Aggregate Rankings (Top 25)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Based on member rankings using weighted scoring
              </p>
              <div className="space-y-2">
                {topRankedRushees.map((item, index) => (
                  <div
                    key={item.rushee.id}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-xl font-bold text-gray-400">#{index + 1}</span>
                    <div className="flex-1">
                      <p className="font-semibold">{item.rushee.name}</p>
                      <p className="text-sm text-gray-600">{item.rushee.major}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Score</p>
                      <p className="font-bold text-primary-600">{item.score}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card max-w-md w-full"
          >
            <h2 className="text-2xl font-bold mb-4">Add Event</h2>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Event Name</label>
                <input
                  type="text"
                  value={eventForm.name}
                  onChange={e => setEventForm({ ...eventForm, name: e.target.value })}
                  required
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={eventForm.date}
                    onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <input
                    type="time"
                    value={eventForm.time}
                    onChange={e => setEventForm({ ...eventForm, time: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={eventForm.description}
                  onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                  className="input-field min-h-20"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Event
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="card text-center"
  >
    <div className="text-4xl mb-2">{icon}</div>
    <p className="text-gray-600 text-sm">{title}</p>
    <p className="text-3xl font-bold text-primary-600">{value}</p>
  </motion.div>
);

export default AdminDashboard;
