import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  initializeGoogleAPI,
  initializeGIS,
  authorizeCalendar,
  isCalendarAuthorized,
  revokeCalendarAccess,
  getUserEmail,
} from '../lib/googleCalendar';

const CalendarContext = createContext();

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within CalendarProvider');
  }
  return context;
};

export const CalendarProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Google API on mount
  useEffect(() => {
    const initGoogleServices = async () => {
      try {
        console.log('Starting Google API initialization...');

        // Check if scripts are already loaded
        if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
          console.log('Google scripts already loaded, initializing...');
          await initializeGoogleAPI();
          await initializeGIS();
          setIsInitialized(true);

          if (currentUser) {
            await checkCalendarConnection();
          }
          return;
        }

        // Load gapi script
        console.log('Loading gapi script...');
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.defer = true;

        const scriptLoaded = new Promise((resolve, reject) => {
          script.onload = () => {
            console.log('gapi script loaded successfully');
            resolve();
          };
          script.onerror = (error) => {
            console.error('Failed to load gapi script:', error);
            reject(error);
          };
        });

        document.body.appendChild(script);

        // Load GIS script
        console.log('Loading GIS script...');
        const gisScript = document.createElement('script');
        gisScript.src = 'https://accounts.google.com/gsi/client';
        gisScript.async = true;
        gisScript.defer = true;

        const gisLoaded = new Promise((resolve, reject) => {
          gisScript.onload = () => {
            console.log('GIS script loaded successfully');
            resolve();
          };
          gisScript.onerror = (error) => {
            console.error('Failed to load GIS script:', error);
            reject(error);
          };
        });

        document.body.appendChild(gisScript);

        // Wait for both scripts to load
        await Promise.all([scriptLoaded, gisLoaded]);

        console.log('Both scripts loaded, waiting for global objects...');

        // Wait for global objects to be available
        let retries = 0;
        while ((typeof gapi === 'undefined' || typeof google === 'undefined') && retries < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }

        if (typeof gapi === 'undefined' || typeof google === 'undefined') {
          throw new Error('Google API objects not available after loading scripts');
        }

        console.log('Global objects available, initializing APIs...');

        // Initialize APIs
        await initializeGoogleAPI();
        console.log('Google API initialized');

        await initializeGIS();
        console.log('GIS initialized');

        setIsInitialized(true);
        console.log('Google services initialization complete!');

        // Check if user already connected calendar
        if (currentUser) {
          await checkCalendarConnection();
        }
      } catch (error) {
        console.error('Error initializing Google services:', error);
        console.error('Error stack:', error.stack);
      }
    };

    initGoogleServices();
  }, []);

  // Check calendar connection when user changes
  useEffect(() => {
    if (currentUser && isInitialized) {
      checkCalendarConnection();
    }
  }, [currentUser, isInitialized]);

  // Check if user has calendar connected in Firestore
  const checkCalendarConnection = async () => {
    if (!currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();

      console.log('Checking calendar connection. User data:', {
        calendarConnected: userData?.calendarConnected,
        calendarEmail: userData?.calendarEmail,
        isCalendarAuthorized: isCalendarAuthorized()
      });

      if (userData?.calendarConnected) {
        setIsCalendarConnected(true);
        setCalendarEmail(userData.calendarEmail);

        // Note: We don't automatically reauthorize here anymore
        // User needs to manually reconnect when their OAuth token expires
        // This prevents consent screen from popping up unexpectedly
        if (!isCalendarAuthorized()) {
          console.log('Calendar connected in DB but no OAuth token. User will need to reconnect manually.');
        }
      } else {
        setIsCalendarConnected(false);
        setCalendarEmail(null);
      }
    } catch (error) {
      console.error('Error checking calendar connection:', error);
    }
  };

  // Connect Google Calendar
  const connectCalendar = async () => {
    console.log('connectCalendar called. isInitialized:', isInitialized);

    if (!isInitialized) {
      console.warn('Google API not yet initialized, waiting...');
      // Wait for initialization (max 10 seconds)
      for (let i = 0; i < 100; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log(`Waiting for initialization... attempt ${i + 1}/100, isInitialized:`, isInitialized);
        if (isInitialized) break;
      }

      if (!isInitialized) {
        const errorMsg = 'Google API failed to initialize. Please refresh the page and try again.';
        console.error(errorMsg);
        console.error('Check the console for script loading errors above.');
        throw new Error(errorMsg);
      }
    }

    console.log('Google API is initialized, proceeding with authorization...');
    setIsLoading(true);
    try {
      // Request authorization
      console.log('Requesting calendar authorization...');
      await authorizeCalendar();
      console.log('Authorization successful!');

      // Get user's email from Google Calendar API
      console.log('Getting user email...');
      let email = await getUserEmail();

      // If Google Calendar email fails, use Firebase Auth email as fallback
      if (!email && currentUser) {
        console.log('Using Firebase Auth email as fallback:', currentUser.email);
        email = currentUser.email;
      }

      console.log('Saving calendar connection to Firestore with email:', email);

      // Save to Firestore
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          calendarConnected: true,
          calendarEmail: email,
          calendarConnectedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setIsCalendarConnected(true);
      setCalendarEmail(email);

      console.log('Calendar connected successfully!');
      return { success: true, email };
    } catch (error) {
      console.error('Error connecting calendar:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect Google Calendar
  const disconnectCalendar = async () => {
    console.log('Disconnecting calendar...');
    setIsLoading(true);
    try {
      // Revoke access and clear token
      console.log('Revoking calendar access...');
      revokeCalendarAccess();
      console.log('Calendar access revoked');

      // Update Firestore
      console.log('Updating Firestore...');
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          calendarConnected: false,
          calendarEmail: null,
        },
        { merge: true }
      );
      console.log('Firestore updated');

      setIsCalendarConnected(false);
      setCalendarEmail(null);

      console.log('Calendar disconnected successfully');
      return { success: true };
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    isCalendarConnected,
    calendarEmail,
    isInitialized,
    isLoading,
    connectCalendar,
    disconnectCalendar,
    checkCalendarConnection,
  };

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
};
