import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, doc, setDoc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const MemberDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [rushees, setRushees] = useState([]);
  const [selectedRushee, setSelectedRushee] = useState(null);
  const [feedback, setFeedback] = useState({ comment: '', rating: 0 });
  const [rankings, setRankings] = useState([]);
  const [view, setView] = useState('rushees'); // rushees, rankings
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRushees();
    fetchRankings();
  }, []);

  const fetchRushees = async () => {
    try {
      const rusheesSnapshot = await getDocs(collection(db, 'rushees'));
      const rusheesData = rusheesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRushees(rusheesData);
    } catch (err) {
      console.error('Error fetching rushees:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRankings = async () => {
    try {
      const rankingDoc = await getDoc(doc(db, 'rankings', currentUser.uid));
      if (rankingDoc.exists()) {
        setRankings(rankingDoc.data().rusheeIds || []);
      }
    } catch (err) {
      console.error('Error fetching rankings:', err);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!selectedRushee) return;

    try {
      const feedbackRef = doc(db, 'feedback', `${currentUser.uid}_${selectedRushee.id}`);
      await setDoc(feedbackRef, {
        memberId: currentUser.uid,
        rusheeId: selectedRushee.id,
        comment: feedback.comment,
        rating: feedback.rating,
        timestamp: new Date().toISOString()
      });

      alert('Feedback submitted successfully!');
      setFeedback({ comment: '', rating: 0 });
      setSelectedRushee(null);
    } catch (err) {
      console.error('Error submitting feedback:', err);
    }
  };

  const handleSaveRankings = async () => {
    try {
      await setDoc(doc(db, 'rankings', currentUser.uid), {
        memberId: currentUser.uid,
        rusheeIds: rankings,
        updatedAt: new Date().toISOString()
      });
      alert('Rankings saved successfully!');
    } catch (err) {
      console.error('Error saving rankings:', err);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setRankings((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addToRankings = (rusheeId) => {
    if (rankings.includes(rusheeId)) {
      alert('This rushee is already in your rankings');
      return;
    }
    if (rankings.length >= 25) {
      alert('You can only rank up to 25 rushees');
      return;
    }
    setRankings([...rankings, rusheeId]);
  };

  const removeFromRankings = (rusheeId) => {
    setRankings(rankings.filter(id => id !== rusheeId));
  };

  const getRankedRushees = () => {
    return rankings.map(id => rushees.find(r => r.id === id)).filter(Boolean);
  };

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
        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('rushees')}
            className={`px-4 py-2 rounded-lg font-medium ${
              view === 'rushees' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'
            }`}
          >
            Rushees & Feedback
          </button>
          <button
            onClick={() => setView('rankings')}
            className={`px-4 py-2 rounded-lg font-medium ${
              view === 'rankings' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'
            }`}
          >
            My Rankings
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : view === 'rushees' ? (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Rushees List */}
            <div>
              <h2 className="text-xl font-bold mb-4">Rushees</h2>
              <div className="space-y-3">
                {rushees.map(rushee => (
                  <motion.div
                    key={rushee.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setSelectedRushee(rushee)}
                    className={`card cursor-pointer ${
                      selectedRushee?.id === rushee.id ? 'ring-2 ring-primary-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{rushee.name}</h3>
                        <p className="text-sm text-gray-600">{rushee.major}</p>
                        <p className="text-sm text-gray-500">{rushee.year}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToRankings(rushee.id);
                        }}
                        className="text-xs px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700"
                      >
                        + Rank
                      </button>
                    </div>
                    {rushee.resumeUrl && (
                      <a
                        href={rushee.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:underline mt-2 block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Resume
                      </a>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Feedback Panel */}
            <div>
              {selectedRushee ? (
                <div className="card sticky top-4">
                  <h2 className="text-xl font-bold mb-4">
                    Feedback for {selectedRushee.name}
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Application Details</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Why Join:</strong> {selectedRushee.whyJoin}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Strengths:</strong> {selectedRushee.strengths}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Experience:</strong> {selectedRushee.experience}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Rating</label>
                      <div className="flex gap-2">
                        {[-1, 0, 1].map(val => (
                          <button
                            key={val}
                            onClick={() => setFeedback({ ...feedback, rating: val })}
                            className={`px-4 py-2 rounded-lg font-medium ${
                              feedback.rating === val
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {val === -1 ? '👎' : val === 0 ? '😐' : '👍'} {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Comments</label>
                      <textarea
                        value={feedback.comment}
                        onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                        className="input-field min-h-32"
                        placeholder="Share your thoughts on this candidate..."
                      />
                    </div>

                    <button onClick={handleFeedbackSubmit} className="btn-primary w-full">
                      Submit Feedback
                    </button>
                  </div>
                </div>
              ) : (
                <div className="card">
                  <p className="text-gray-500 text-center">
                    Select a rushee to view details and provide feedback
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">My Rankings</h2>
                <button onClick={handleSaveRankings} className="btn-primary">
                  Save Rankings
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Drag to reorder. Top 20-25 rushees you would like to admit.
              </p>

              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={rankings} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {getRankedRushees().map((rushee, index) => (
                      <SortableRusheeItem
                        key={rushee.id}
                        rushee={rushee}
                        index={index}
                        onRemove={removeFromRankings}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {rankings.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No rankings yet. Add rushees from the Rushees tab.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Sortable Rushee Item for Rankings
const SortableRusheeItem = ({ rushee, index, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: rushee.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md cursor-move"
    >
      <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
      <div className="flex-1">
        <p className="font-semibold">{rushee.name}</p>
        <p className="text-sm text-gray-600">{rushee.major}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(rushee.id);
        }}
        className="text-red-600 hover:text-red-800"
      >
        Remove
      </button>
    </div>
  );
};

export default MemberDashboard;
