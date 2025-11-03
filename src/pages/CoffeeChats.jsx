import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCalendar } from '../context/CalendarContext';
import { collection, query, getDocs, addDoc, updateDoc, doc, where, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';
import { createCalendarEvent, deleteCalendarEvent, markEventAsCompleted } from '../lib/googleCalendar';
import CalendarConnectButton from '../components/CalendarConnectButton';

const CoffeeChats = () => {
  const { currentUser, userProfile } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, my-chats, available
  const [showRusheeModal, setShowRusheeModal] = useState(false);
  const [selectedRushee, setSelectedRushee] = useState(null);
  const [loadingRushee, setLoadingRushee] = useState(false);

  const isMember = userProfile?.role === 'member' || userProfile?.role === 'admin';

  const fetchChats = async () => {
    try {
      setLoading(true);
      const chatsRef = collection(db, 'chats');
      let q;

      if (isMember) {
        // Members see their own slots
        q = query(chatsRef, where('memberId', '==', currentUser.uid));
      } else {
        // Rushees see all available slots
        q = query(chatsRef);
      }

      const snapshot = await getDocs(q);
      const chatsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setChats(chatsData);
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [currentUser]);

  const filteredChats = chats.filter(chat => {
    if (filter === 'my-chats') {
      return isMember ? chat.memberId === currentUser.uid : chat.rusheeId === currentUser.uid;
    }
    if (filter === 'available') {
      return chat.status === 'available';
    }
    return true;
  });

  if (isMember) {
    return <MemberCoffeeChats chats={filteredChats} fetchChats={fetchChats} loading={loading} filter={filter} setFilter={setFilter} />;
  } else {
    return <RusheeCoffeeChats chats={filteredChats} fetchChats={fetchChats} loading={loading} filter={filter} setFilter={setFilter} />;
  }
};

// Member View Component
const MemberCoffeeChats = ({ chats, fetchChats, loading, filter, setFilter }) => {
  const { currentUser } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    location: ''
  });

  const handleAddSlot = async (e) => {
    e.preventDefault();

    try {
      // Get member data
      const memberDoc = await getDocs(query(collection(db, 'members'), where('userId', '==', currentUser.uid)));
      const memberData = memberDoc.docs[0]?.data();

      await addDoc(collection(db, 'chats'), {
        memberId: currentUser.uid,
        memberName: memberData?.name || currentUser.email,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        status: 'available',
        rusheeId: null,
        rusheeName: null,
        createdAt: new Date().toISOString()
      });

      setFormData({ date: '', time: '', location: '' });
      setShowAddModal(false);
      fetchChats();
    } catch (err) {
      console.error('Error adding slot:', err);
    }
  };

  const handleMarkStatus = async (chatId, status) => {
    try {
      // Get chat to check for calendar event
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      const chatData = chatDoc.data();

      // If marking as completed, update calendar event
      if (status === 'completed' && chatData.calendarEventId) {
        await markEventAsCompleted(chatData.calendarEventId);
      }

      await updateDoc(doc(db, 'chats', chatId), { status });
      fetchChats();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDeleteSlot = async (chatId) => {
    if (window.confirm('Are you sure you want to delete this slot?')) {
      try {
        await deleteDoc(doc(db, 'chats', chatId));
        fetchChats();
      } catch (err) {
        console.error('Error deleting slot:', err);
      }
    }
  };

  const handleViewRushee = async (rusheeId) => {
    if (!rusheeId) return;

    setLoadingRushee(true);
    setShowRusheeModal(true);

    try {
      // Fetch rushee data from rushees collection
      const rusheeDoc = await getDoc(doc(db, 'rushees', rusheeId));
      if (rusheeDoc.exists()) {
        setSelectedRushee({ id: rusheeDoc.id, ...rusheeDoc.data() });
      } else {
        setSelectedRushee(null);
        alert('Rushee information not found');
      }
    } catch (err) {
      console.error('Error fetching rushee:', err);
      alert('Failed to load rushee information');
    } finally {
      setLoadingRushee(false);
    }
  };

  const totalSlots = chats.length;
  const bookedSlots = chats.filter(c => c.status === 'booked').length;
  const completedSlots = chats.filter(c => c.status === 'completed').length;
  const availableSlots = chats.filter(c => c.status === 'available').length;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Coffee Chat Slots</h1>
            <p className="text-gray-600 mt-1">Manage your availability and track coffee chats with rushees</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            + Add Slot
          </button>
        </div>

        {/* Calendar Connect */}
        <div className="mb-6">
          <CalendarConnectButton />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card bg-white">
            <p className="text-sm text-gray-600 mb-1">Total Slots</p>
            <p className="text-2xl font-bold text-gray-800">{totalSlots}</p>
          </div>
          <div className="card bg-green-50 border-green-200">
            <p className="text-sm text-green-700 mb-1">Available</p>
            <p className="text-2xl font-bold text-green-700">{availableSlots}</p>
          </div>
          <div className="card bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-700 mb-1">Booked</p>
            <p className="text-2xl font-bold text-blue-700">{bookedSlots}</p>
          </div>
          <div className="card bg-gray-50 border-gray-200">
            <p className="text-sm text-gray-700 mb-1">Completed</p>
            <p className="text-2xl font-bold text-gray-700">{completedSlots}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            All Slots
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'available' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            Available
          </button>
          <button
            onClick={() => setFilter('my-chats')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'my-chats' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            Booked
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : chats.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No coffee chat slots yet</p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              Create Your First Slot
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chats.map(chat => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`card border-l-4 ${
                  chat.status === 'available' ? 'border-l-green-500' :
                  chat.status === 'booked' ? 'border-l-blue-500' :
                  chat.status === 'completed' ? 'border-l-gray-400' :
                  'border-l-red-500'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-lg text-gray-800">{chat.date}</p>
                    <p className="text-sm text-gray-600">🕐 {chat.time}</p>
                    <p className="text-sm text-gray-600 mt-1">📍 {chat.location}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    chat.status === 'available' ? 'bg-green-100 text-green-700' :
                    chat.status === 'booked' ? 'bg-blue-100 text-blue-700' :
                    chat.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {chat.status.toUpperCase()}
                  </span>
                </div>

                {chat.rusheeId ? (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-600 font-medium mb-1">RUSHEE</p>
                    {isMember ? (
                      <button
                        onClick={() => handleViewRushee(chat.rusheeId)}
                        className="text-sm font-semibold text-blue-900 hover:text-blue-700 hover:underline transition-colors text-left"
                      >
                        {chat.rusheeName}
                      </button>
                    ) : (
                      <p className="text-sm font-semibold text-blue-900">{chat.rusheeName}</p>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 italic">No rushee booked yet</p>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  {chat.status === 'booked' && (
                    <>
                      <button
                        onClick={() => handleMarkStatus(chat.id, 'completed')}
                        className="flex-1 text-xs px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                      >
                        ✓ Mark Complete
                      </button>
                      <button
                        onClick={() => handleMarkStatus(chat.id, 'no-show')}
                        className="flex-1 text-xs px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                      >
                        ✗ No-Show
                      </button>
                    </>
                  )}
                  {chat.status === 'available' && (
                    <button
                      onClick={() => handleDeleteSlot(chat.id)}
                      className="w-full text-xs px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                    >
                      🗑 Delete Slot
                    </button>
                  )}
                  {(chat.status === 'completed' || chat.status === 'no-show') && (
                    <div className="w-full text-center py-2 text-xs text-gray-500">
                      Chat {chat.status === 'completed' ? 'completed' : 'marked as no-show'}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add Slot Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="card max-w-md w-full"
            >
              <h2 className="text-2xl font-bold mb-4">Add Coffee Chat Slot</h2>
              <form onSubmit={handleAddSlot} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                    className="input-field"
                    placeholder="Starbucks on Main St"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">Add Slot</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

// Rushee View Component
const RusheeCoffeeChats = ({ chats, fetchChats, loading, filter, setFilter }) => {
  const { currentUser } = useAuth();
  const [rusheeData, setRusheeData] = useState(null);

  useEffect(() => {
    const fetchRusheeData = async () => {
      const rusheeDoc = await getDocs(query(collection(db, 'rushees'), where('userId', '==', currentUser.uid)));
      if (!rusheeDoc.empty) {
        setRusheeData(rusheeDoc.docs[0].data());
      }
    };
    fetchRusheeData();
  }, [currentUser]);

  const myBookedChats = chats.filter(chat => chat.rusheeId === currentUser.uid);
  const canBookMore = myBookedChats.filter(c => c.status === 'booked').length < 2;

  const handleBookSlot = async (chatId) => {
    if (!canBookMore) {
      alert('You can only have 2 active bookings at a time.');
      return;
    }

    try {
      // Get chat details
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      const chatData = chatDoc.data();

      if (!chatData) {
        alert('Chat not found.');
        return;
      }

      // Update booking first (this is the critical operation)
      console.log('Updating chat booking status...');
      await updateDoc(doc(db, 'chats', chatId), {
        rusheeId: currentUser.uid,
        rusheeName: rusheeData?.name || currentUser.email,
        status: 'booked'
      });
      console.log('Chat booking status updated successfully!');

      // Try to create calendar event (non-blocking)
      try {
        const rusheeUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const rusheeEmail = rusheeUserDoc.data()?.email || rusheeUserDoc.data()?.calendarEmail;

        const memberUserDoc = await getDoc(doc(db, 'users', chatData.memberId));
        const memberEmail = memberUserDoc.data()?.email || memberUserDoc.data()?.calendarEmail;
        const memberCalendarConnected = memberUserDoc.data()?.calendarConnected;
        const rusheeCalendarConnected = rusheeUserDoc.data()?.calendarConnected;

        console.log('Calendar Debug:', {
          memberCalendarConnected,
          rusheeCalendarConnected,
          memberEmail,
          rusheeEmail,
          chatData
        });

        if (memberCalendarConnected || rusheeCalendarConnected) {
          console.log('Attempting to create calendar event...');
          const eventResult = await createCalendarEvent({
            date: chatData.date,
            time: chatData.time,
            location: chatData.location,
            memberName: chatData.memberName,
            rusheeName: rusheeData?.name || currentUser.email,
            memberEmail: memberEmail,
            rusheeEmail: rusheeEmail,
          });

          console.log('Calendar event result:', eventResult);

          if (eventResult.success) {
            // Store calendar event ID
            console.log('Storing calendar event ID:', eventResult.eventId);
            try {
              await updateDoc(doc(db, 'chats', chatId), {
                calendarEventId: eventResult.eventId,
              });
              console.log('Calendar event created successfully and ID stored!');
            } catch (updateError) {
              console.error('Failed to store calendar event ID in Firestore:', updateError);
              // Event was created successfully, just couldn't store the ID
            }
          } else {
            console.warn('Calendar event creation failed:', eventResult.error);
            // Show a warning to the user
            if (eventResult.error && eventResult.error.includes('not authorized')) {
              console.warn('User needs to reconnect calendar - token expired or missing');
            }
          }
        } else {
          console.log('Neither member nor rushee has calendar connected, skipping event creation');
        }
      } catch (calendarErr) {
        // Calendar error shouldn't block the booking
        console.error('Calendar integration error (non-critical):', calendarErr);
        console.error('Error details:', {
          message: calendarErr.message,
          code: calendarErr.code,
          stack: calendarErr.stack
        });
      }

      // Refresh the chat list
      fetchChats();
      alert('Coffee chat booked successfully!');
    } catch (err) {
      console.error('Error booking slot:', err);
      alert(`Failed to book slot: ${err.message}`);
    }
  };

  const handleCancelBooking = async (chatId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        // Get chat to check for calendar event
        const chatDoc = await getDoc(doc(db, 'chats', chatId));
        const chatData = chatDoc.data();

        // Delete calendar event if exists
        if (chatData.calendarEventId) {
          await deleteCalendarEvent(chatData.calendarEventId);
        }

        // Update booking
        await updateDoc(doc(db, 'chats', chatId), {
          rusheeId: null,
          rusheeName: null,
          status: 'available',
          calendarEventId: null,
        });
        fetchChats();
      } catch (err) {
        console.error('Error canceling booking:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Coffee Chats</h1>
        <p className="text-gray-600 mb-6">
          Book up to 2 coffee chats with members. Active bookings: {myBookedChats.filter(c => c.status === 'booked').length}/2
        </p>

        {/* Calendar Connect */}
        <div className="mb-6">
          <CalendarConnectButton />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('available')}
            className={`px-4 py-2 rounded-lg font-medium ${filter === 'available' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'}`}
          >
            Available
          </button>
          <button
            onClick={() => setFilter('my-chats')}
            className={`px-4 py-2 rounded-lg font-medium ${filter === 'my-chats' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'}`}
          >
            My Chats
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chats.map(chat => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">{chat.date}</p>
                    <p className="text-sm text-gray-600">{chat.time}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    chat.status === 'available' ? 'bg-green-100 text-green-700' :
                    chat.status === 'booked' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {chat.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-2">📍 {chat.location}</p>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Member: {chat.memberName}
                </p>

                {chat.status === 'available' && chat.rusheeId !== currentUser.uid && (
                  <button
                    onClick={() => handleBookSlot(chat.id)}
                    disabled={!canBookMore}
                    className="btn-primary w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {canBookMore ? 'Book Slot' : 'Max Bookings Reached'}
                  </button>
                )}

                {chat.rusheeId === currentUser.uid && chat.status === 'booked' && (
                  <button
                    onClick={() => handleCancelBooking(chat.id)}
                    className="w-full text-sm px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Cancel Booking
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Rushee Details Modal */}
        {showRusheeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowRusheeModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Rushee Profile</h2>
                <button
                  onClick={() => setShowRusheeModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  &times;
                </button>
              </div>

              {loadingRushee ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading rushee information...</p>
                </div>
              ) : selectedRushee ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{selectedRushee.name}</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Year</p>
                        <p className="font-medium text-gray-800">{selectedRushee.year}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Major</p>
                        <p className="font-medium text-gray-800">{selectedRushee.major}</p>
                      </div>
                      {selectedRushee.phone && (
                        <div>
                          <p className="text-gray-600">Phone</p>
                          <p className="font-medium text-gray-800">{selectedRushee.phone}</p>
                        </div>
                      )}
                      {selectedRushee.linkedin && (
                        <div>
                          <p className="text-gray-600">LinkedIn</p>
                          <a
                            href={selectedRushee.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:underline"
                          >
                            View Profile
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedRushee.whyJoin && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Why Join Scale + Coin?</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedRushee.whyJoin}</p>
                    </div>
                  )}

                  {selectedRushee.strengths && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Strengths</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedRushee.strengths}</p>
                    </div>
                  )}

                  {selectedRushee.experience && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Relevant Experience</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedRushee.experience}</p>
                    </div>
                  )}

                  {selectedRushee.resumeUrl && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Resume</h4>
                      <a
                        href={selectedRushee.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        View Resume
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Rushee information not found</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoffeeChats;
