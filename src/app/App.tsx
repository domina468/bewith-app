import { useState, useEffect } from 'react';
import { AuthScreen } from './components/auth-screen';
import { Onboarding } from './components/onboarding';
import { HomeScreen } from './components/home-screen';
import { RoomDetail } from './components/room-detail';
import { ChatOverlay } from './components/chat-overlay';
import { ProfileScreen } from './components/profile-screen';
import { CreateRoom, type RoomData } from './components/create-room';
import { NotificationsScreen } from './components/notifications-screen';
import { SettingsModal } from './components/settings-modal';
import { Toaster, toast } from 'sonner';
import { AnimatePresence } from 'motion/react';
import { authAPI, roomsAPI, userAPI, checkHealth, setAuthFailureHandler } from '/src/utils/api';
import { supabase, getActiveSession } from '/src/utils/supabase/client';

interface User {
  id: string;
  username: string;
  email: string;
  streak?: number;
  totalHours?: number;
}

interface Room {
  id: string;
  name: string;
  category: string;
  description: string;
  currentUsers: number;
  maxUsers: number;
  imageUrl?: string;
  isActive: boolean;
}

type Screen = 'auth' | 'onboarding' | 'home' | 'room' | 'profile' | 'notifications';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('auth');
  const [user, setUser] = useState<User | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  // Set up global auth failure handler
  useEffect(() => {
    setAuthFailureHandler(() => {
      console.log('🚨 Auth failure detected - redirecting to sign in');
      setUser(null);
      setCurrentRoom(null);
      setCurrentScreen('auth');
      toast.error('Session expired. Please sign in again.');
    });
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking for active Supabase session...');
        
        // Check for active Supabase session
        const session = await getActiveSession();
        
        if (session) {
          console.log('✅ Active Supabase session found, validating user profile...');
          
          try {
            const response = await authAPI.getMe();
            if (response.success) {
              console.log('✅ User authenticated:', response.user.username);
              setUser(response.user);
              setCurrentScreen('home');
              
              // Update streak in background
              await userAPI.updateStreak().catch(console.error);
            }
          } catch (error) {
            console.error('❌ Failed to get user profile:', error);
            setCurrentScreen('auth');
          }
        } else {
          console.log('🔓 No active session, showing auth screen');
          setCurrentScreen('auth');
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        setCurrentScreen('auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    checkHealth()
      .then((res) => console.log('✅ Backend connected:', res))
      .catch(err => console.error('❌ Backend connection failed:', err));
  }, []);

  useEffect(() => {
    if (currentScreen === 'home' && user) {
      loadRooms();
    }
  }, [currentScreen, user]);

  // Realtime — sleduj presence vo všetkých roomkách a aktualizuj počty
  useEffect(() => {
    if (!user || rooms.length === 0) return;

    const channels = rooms.map(room => {
      const ch = supabase.channel(`room:${room.id}`);
      ch.on('presence', { event: 'sync' }, () => {
        const count = Object.keys(ch.presenceState()).length;
        setRooms(prev => prev.map(r => r.id === room.id ? { ...r, currentUsers: count } : r));
      }).subscribe();
      return ch;
    });

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [user, rooms.length]);

  const loadRooms = async () => {
    // Verify we have a valid session before making API calls
    const session = await getActiveSession();
    if (!session) {
      console.error('⚠️ Cannot load rooms - no active session');
      return;
    }
    
    try {
      console.log('📡 Loading rooms...');
      const response = await roomsAPI.getAll();
      if (response.success) {
        const roomsWithImages = response.rooms.map((room: Room) => ({
          ...room,
          imageUrl: room.imageUrl || getDefaultRoomImage(room.category)
        }));
        setRooms(roomsWithImages);
        console.log('✅ Loaded', roomsWithImages.length, 'rooms');
      }
    } catch (error) {
      console.error('❌ Failed to load rooms:', error);
      toast.error('Failed to load rooms');
    }
  };

  const getDefaultRoomImage = (category: string) => {
    const images: Record<string, string> = {
      'Study': 'https://images.unsplash.com/photo-1763890965393-1cea435581ab?w=400',
      'Work': 'https://images.unsplash.com/photo-1675434301703-6b7b9ca9f28d?w=400',
      'Cleaning': 'https://images.unsplash.com/photo-1758272422189-b10f36fd4ddd?w=400',
      'Morning': 'https://images.unsplash.com/photo-1617037201980-ddc9c1ebbd83?w=400',
      'Relax': 'https://images.unsplash.com/photo-1543244916-b3da1ba6252c?w=400',
    };
    return images[category] || 'https://images.unsplash.com/photo-1675434301703-6b7b9ca9f28d?w=400';
  };

  const handleAuthSuccess = (userData: User, accessToken: string) => {
    console.log('✅ Auth success - setting user state:', userData.username);
    setUser(userData);
    setCurrentScreen('home');
    toast.success(`Welcome, ${userData.username}! 👋`);
  };

  const handleOnboardingComplete = (userData: { username: string; email: string }) => {
    setCurrentScreen('home');
  };

  const handleJoinRoom = async (room: Room) => {
    try {
      const response = await roomsAPI.join(room.id, 'video', 'Focused');
      
      if (response.success) {
        setCurrentRoom(room);
        setCurrentScreen('room');
        toast.success(`Joined ${room.name}`);
      }
    } catch (error: any) {
      console.error('Failed to join room:', error);
      toast.error(error.message || 'Failed to join room');
    }
  };

  const handleLeaveRoom = async () => {
    if (!currentRoom) return;

    try {
      const response = await roomsAPI.leave(currentRoom.id, true);
      
      if (response.success) {
        toast.info(`Left ${currentRoom.name} quietly`);
        setCurrentRoom(null);
        setCurrentScreen('home');
        setShowChat(false);
        loadRooms();
      }
    } catch (error: any) {
      console.error('Failed to leave room:', error);
      setCurrentRoom(null);
      setCurrentScreen('home');
      setShowChat(false);
    }
  };

  const handleCreateRoom = async (roomData: RoomData) => {
    try {
      const response = await roomsAPI.create({
        name: roomData.name,
        category: roomData.category,
        description: roomData.description,
        maxUsers: roomData.maxUsers,
        backgroundSound: 'silence'
      });

      if (response.success) {
        const newRoom: Room = {
          ...response.room,
          imageUrl: getDefaultRoomImage(response.room.category)
        };

        setShowCreateRoom(false);
        toast.success('Room created successfully! 🎉');

        await loadRooms();

        setTimeout(() => {
          handleJoinRoom(newRoom);
        }, 500);
      }
    } catch (error: any) {
      console.error('Failed to create room:', error);
      toast.error(error.message || 'Failed to create room');
    }
  };

  const handleSignOut = () => {
    authAPI.signout();
    setUser(null);
    setCurrentScreen('auth');
    toast.success('Signed out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background:'#080B12' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="bw-orb-1 absolute rounded-full" style={{ width:500,height:500,top:-150,left:-150,background:'radial-gradient(circle,rgba(124,101,245,0.2) 0%,transparent 65%)' }}/>
          <div className="bw-orb-2 absolute rounded-full" style={{ width:400,height:400,bottom:-100,right:-100,background:'radial-gradient(circle,rgba(91,164,245,0.15) 0%,transparent 65%)' }}/>
        </div>
        <div className="relative text-center">
          <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center animate-pulse shadow-2xl"
            style={{ background:'linear-gradient(135deg,#7C65F5,#5BA4F5)', boxShadow:'0 12px 40px rgba(124,101,245,0.4)' }}>
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <circle cx="12" cy="20" r="3.5" fill="white" fillOpacity="0.9"/>
              <circle cx="20" cy="20" r="3.5" fill="white"/>
              <circle cx="28" cy="20" r="3.5" fill="white" fillOpacity="0.9"/>
            </svg>
          </div>
          <p className="text-sm font-semibold tracking-wider" style={{ color:'rgba(238,238,255,0.35)', letterSpacing:'0.1em' }}>BEWITH</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen">
        {currentScreen === 'auth' && (
          <AuthScreen onAuthSuccess={handleAuthSuccess} />
        )}

        {currentScreen === 'onboarding' && (
          <Onboarding onComplete={handleOnboardingComplete} />
        )}

        {currentScreen === 'home' && user && (
          <HomeScreen
            user={user}
            rooms={rooms}
            onJoinRoom={handleJoinRoom}
            onProfileClick={() => setCurrentScreen('profile')}
            onNotificationsClick={() => setCurrentScreen('notifications')}
            onCreateRoom={() => setShowCreateRoom(true)}
            onSettingsClick={() => setShowSettings(true)}
          />
        )}

        {currentScreen === 'room' && currentRoom && user && (
          <RoomDetail
            room={currentRoom}
            user={user}
            onLeave={handleLeaveRoom}
            onOpenChat={() => setShowChat(true)}
          />
        )}

        {currentScreen === 'profile' && user && (
          <ProfileScreen
            user={user}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'notifications' && (
          <NotificationsScreen
            onBack={() => setCurrentScreen('home')}
          />
        )}

        <AnimatePresence>
          {showChat && currentRoom && user && (
            <ChatOverlay
              roomId={currentRoom.id}
              user={user}
              onClose={() => setShowChat(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showCreateRoom && (
            <CreateRoom
              onClose={() => setShowCreateRoom(false)}
              onCreate={handleCreateRoom}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSettings && (
            <SettingsModal 
              onClose={() => setShowSettings(false)}
              onSignOut={handleSignOut}
            />
          )}
        </AnimatePresence>
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'white',
            border: '1px solid #E0E0E0',
            borderRadius: '12px',
            padding: '12px 16px'
          }
        }}
      />
    </>
  );
}

export default App;