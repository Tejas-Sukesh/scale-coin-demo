import { useCalendar } from '../context/CalendarContext';
import { motion } from 'framer-motion';

const CalendarConnectButton = () => {
  const { isCalendarConnected, calendarEmail, isLoading, connectCalendar, disconnectCalendar } =
    useCalendar();

  const handleConnect = async () => {
    const result = await connectCalendar();
    if (result.success) {
      alert('Google Calendar connected successfully!');
    } else {
      alert('Failed to connect Google Calendar: ' + result.error);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm('Are you sure you want to disconnect your Google Calendar?')) {
      const result = await disconnectCalendar();
      if (result.success) {
        alert('Google Calendar disconnected');
      }
    }
  };

  return (
    <div className="card bg-primary-50 border-primary-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
            📅 Google Calendar Integration
          </h3>
          {isCalendarConnected ? (
            <div>
              <p className="text-sm text-green-700 mb-1">
                ✓ Connected as {calendarEmail}
              </p>
              <p className="text-xs text-gray-600">
                Coffee chats will automatically be added to your calendar
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              Connect your Google Calendar to automatically sync coffee chat bookings
            </p>
          )}
        </div>
        <div>
          {isCalendarConnected ? (
            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="text-sm px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="text-sm px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? 'Connecting...' : 'Connect Calendar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarConnectButton;
