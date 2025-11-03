// Google Calendar API Integration
// Handles creating, updating, and deleting calendar events

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email';

// Google Cloud OAuth Client ID
export const GOOGLE_CLIENT_ID = '1025825983951-1pf5sq0sud4blj6khg7d3fjca0mnsbjt.apps.googleusercontent.com';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Initialize the Google API client
export const initializeGoogleAPI = () => {
  return new Promise((resolve, reject) => {
    gapi.load('client', async () => {
      try {
        await gapi.client.init({
          discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
};

// Initialize Google Identity Services
export const initializeGIS = () => {
  return new Promise((resolve) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: '', // defined later
    });
    gisInited = true;
    resolve();
  });
};

// Request user authorization for calendar access
export const authorizeCalendar = () => {
  return new Promise((resolve, reject) => {
    if (!gapiInited || !gisInited) {
      reject(new Error('Google API not initialized'));
      return;
    }

    tokenClient.callback = async (response) => {
      if (response.error !== undefined) {
        reject(response);
        return;
      }
      resolve(response);
    };

    // Always prompt for consent to ensure we get the latest scopes
    // This is important when scopes have been updated
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

// Check if user has authorized calendar access
export const isCalendarAuthorized = () => {
  return gapi.client.getToken() !== null;
};

// Revoke calendar access
export const revokeCalendarAccess = () => {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken('');
  }
};

// Create a calendar event for a coffee chat
export const createCalendarEvent = async (chatDetails) => {
  console.log('createCalendarEvent called with:', chatDetails);

  const { date, time, location, memberName, rusheeName, memberEmail, rusheeEmail } = chatDetails;

  // Check if gapi is available and has a token
  if (typeof gapi === 'undefined') {
    console.error('Google API (gapi) is not loaded');
    return { success: false, error: 'Google API not loaded' };
  }

  const token = gapi.client.getToken();
  console.log('Current OAuth token:', token ? 'Present' : 'Missing');

  if (!token) {
    console.error('No OAuth token available. User needs to authorize calendar access.');
    return { success: false, error: 'Calendar not authorized. Please reconnect your calendar.' };
  }

  // Combine date and time into ISO format
  const startDateTime = new Date(`${date}T${time}`);
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // 30 min duration

  const event = {
    summary: `Coffee Chat: ${memberName} & ${rusheeName}`,
    location: location,
    description: `Coffee chat between ${memberName} (member) and ${rusheeName} (rushee) for Scale + Coin rush process.`,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    attendees: [
      { email: memberEmail },
      { email: rusheeEmail },
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 15 }, // 15 min before
      ],
    },
    // Send email invitations
    conferenceData: null,
    guestsCanModify: false,
    guestsCanInviteOthers: false,
    guestsCanSeeOtherGuests: true,
  };

  try {
    const response = await gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'all', // Send email to all attendees
    });

    return {
      success: true,
      eventId: response.result.id,
      eventLink: response.result.htmlLink,
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    console.error('Error details:', {
      status: error.status,
      message: error.message,
      result: error.result,
      body: error.body
    });

    let errorMessage = error.message || 'Unknown error';
    if (error.result?.error?.message) {
      errorMessage = error.result.error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

// Update a calendar event
export const updateCalendarEvent = async (eventId, updates) => {
  try {
    // First, get the existing event
    const event = await gapi.client.calendar.events.get({
      calendarId: 'primary',
      eventId: eventId,
    });

    // Apply updates
    const updatedEvent = {
      ...event.result,
      ...updates,
    };

    const response = await gapi.client.calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: updatedEvent,
      sendUpdates: 'all',
    });

    return {
      success: true,
      eventId: response.result.id,
    };
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Delete a calendar event
export const deleteCalendarEvent = async (eventId) => {
  try {
    await gapi.client.calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
      sendUpdates: 'all', // Notify all attendees of cancellation
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Mark event as completed (update description and color)
export const markEventAsCompleted = async (eventId) => {
  try {
    const event = await gapi.client.calendar.events.get({
      calendarId: 'primary',
      eventId: eventId,
    });

    const updatedEvent = {
      ...event.result,
      description: (event.result.description || '') + '\n\n✅ Status: Completed',
      colorId: '10', // Green color
    };

    await gapi.client.calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: updatedEvent,
      sendUpdates: 'all',
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking event as completed:', error);
    return { success: false, error: error.message };
  }
};

// Get user's email from Google
export const getUserEmail = async () => {
  try {
    console.log('Attempting to get user email from Google Calendar API...');

    // Check if gapi.client.calendar is initialized
    if (!gapi.client.calendar) {
      console.error('Google Calendar API client not initialized');
      return null;
    }

    const response = await gapi.client.calendar.calendarList.get({
      calendarId: 'primary',
    });

    console.log('Got user email from Calendar API:', response.result.id);
    return response.result.id; // This is the user's email
  } catch (error) {
    console.error('Error getting user email from Calendar API:', error);

    // Try alternative method - get from OAuth2 userinfo
    try {
      console.log('Trying alternative method to get user email...');
      const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${gapi.client.getToken().access_token}`,
        },
      });
      const userinfo = await userinfoResponse.json();
      console.log('Got user email from OAuth2 userinfo:', userinfo.email);
      return userinfo.email;
    } catch (altError) {
      console.error('Alternative method also failed:', altError);
      return null;
    }
  }
};
