import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.ts';

// Supabase strips /functions/v1 from the URL before calling the function,
// so Hono receives /server/... — basePath('/server') fixes all routing.
const app = new Hono().basePath('/server');

// CORS configuration
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'apikey', 'x-client-info'],
  exposeHeaders: ['Content-Type'],
}));

// Logger
app.use('*', logger(console.log));

// Create Supabase clients
// Service role client for admin operations (user creation, etc.)
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Anon client for user authentication validation
const supabaseAuth = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

// Helper function to validate user token
async function validateUser(authHeader: string | undefined) {
  console.log('🔍 validateUser called with header:', authHeader?.substring(0, 50) + '...');
  
  if (!authHeader) {
    console.log('❌ No authorization header');
    return { error: 'No authorization header', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('❌ No token in header');
    return { error: 'No token provided', status: 401 };
  }

  console.log('🎫 Extracted token:', token.substring(0, 30) + '...');
  console.log('🔐 Validating with supabaseAuth client...');
  console.log('📋 SUPABASE_URL:', Deno.env.get('SUPABASE_URL'));
  console.log('📋 Using ANON_KEY for validation');

  try {
    const { data, error } = await supabaseAuth.auth.getUser(token);
    
    if (error) {
      console.log('❌ Token validation error:', JSON.stringify(error, null, 2));
      return { error: `Invalid JWT: ${error.message}`, status: 401 };
    }

    if (!data.user) {
      console.log('❌ No user in response, data:', JSON.stringify(data, null, 2));
      return { error: 'Invalid JWT', status: 401 };
    }

    console.log('✅ Token valid for user:', data.user.id);
    return { userId: data.user.id, user: data.user };
  } catch (err) {
    console.log('❌ Exception during token validation:', err);
    return { error: `Token validation failed: ${err.message}`, status: 401 };
  }
}

// ==================== AUTH ROUTES ====================

// Sign up new user
app.post('/auth/signup', async (c) => {
  try {
    const { email, password, username } = await c.req.json();

    if (!email || !password || !username) {
      return c.json({ error: 'Email, password, and username are required' }, 400);
    }

    // Create user with Supabase Auth (using admin client)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since email server not configured
      user_metadata: { username }
    });

    if (authError) {
      console.log('Auth signup error:', authError);
      return c.json({ error: `Failed to create user: ${authError.message}` }, 400);
    }

    // Create user profile in KV store
    const userId = authData.user.id;
    await kv.set(`user:${userId}`, {
      id: userId,
      username,
      email,
      streak: 0,
      totalHours: 0,
      roomsJoined: 0,
      connections: 0,
      badges: [],
      favoriteRooms: [],
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    });

    // Initialize user stats
    await kv.set(`user:${userId}:stats`, {
      totalMinutes: 0,
      roomVisits: {},
      longestSession: 0,
      weeklyMinutes: 0,
      mostActiveTime: 'Not enough data',
      favoriteActivity: 'Not enough data'
    });

    return c.json({
      success: true,
      user: {
        id: userId,
        username,
        email
      }
    });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: `Signup failed: ${error.message}` }, 500);
  }
});

// Sign in user
app.post('/auth/signin', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    console.log('🔐 Attempting sign in for:', email);

    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.log('❌ Auth signin error:', error);
      return c.json({ error: `Sign in failed: ${error.message}` }, 401);
    }

    if (!data.session || !data.user) {
      console.log('❌ No session or user returned from Supabase');
      return c.json({ error: 'Sign in failed: No session created' }, 401);
    }

    console.log('✅ Sign in successful, user ID:', data.user.id);
    console.log('🎫 Access token generated:', data.session.access_token.substring(0, 30) + '...');

    // Get user profile using service role key
    let userProfile = await kv.get(`user:${data.user.id}`);

    // If user profile doesn't exist in KV (legacy user or incomplete signup), create it
    if (!userProfile) {
      console.log('⚠️ User profile not found in KV, creating from auth metadata...');
      const username = data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'User';
      
      userProfile = {
        id: data.user.id,
        username,
        email: data.user.email,
        streak: 0,
        totalHours: 0,
        roomsJoined: 0,
        connections: 0,
        badges: [],
        favoriteRooms: [],
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString()
      };
      
      await kv.set(`user:${data.user.id}`, userProfile);
      
      // Initialize user stats
      await kv.set(`user:${data.user.id}:stats`, {
        totalMinutes: 0,
        roomVisits: {},
        longestSession: 0,
        weeklyMinutes: 0,
        mostActiveTime: 'Not enough data',
        favoriteActivity: 'Not enough data'
      });
      
      console.log('✅ Created user profile for existing auth user');
    } else {
      // Update last active
      userProfile.lastActiveAt = new Date().toISOString();
      await kv.set(`user:${data.user.id}`, userProfile);
    }

    return c.json({
      success: true,
      session: data.session,
      user: userProfile
    });
  } catch (error) {
    console.log('Signin error:', error);
    return c.json({ error: `Sign in failed: ${error.message}` }, 500);
  }
});

// Get current user
app.get('/auth/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const validationResult = await validateUser(authHeader);
    
    if (validationResult.error) {
      return c.json({ error: validationResult.error }, validationResult.status);
    }

    const userId = validationResult.userId;

    // Get user profile
    const userProfile = await kv.get(`user:${userId}`);

    if (!userProfile) {
      return c.json({ error: 'User profile not found' }, 404);
    }

    return c.json({
      success: true,
      user: userProfile
    });
  } catch (error) {
    console.log('Get user error:', error);
    return c.json({ error: `Failed to get user: ${error.message}` }, 500);
  }
});

// ==================== ROOM ROUTES ====================

// Get all rooms
app.get('/rooms', async (c) => {
  try {
    const rooms = await kv.getByPrefix('room:');
    const activeRooms = rooms.filter(r => r && !r.key.includes(':session'));
    
    return c.json({
      success: true,
      rooms: activeRooms.map(r => r.value)
    });
  } catch (error) {
    console.log('Get rooms error:', error);
    return c.json({ error: `Failed to get rooms: ${error.message}` }, 500);
  }
});

// Create room
app.post('/rooms', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const validationResult = await validateUser(authHeader);

    if (validationResult.error) {
      return c.json({ error: validationResult.error }, validationResult.status);
    }

    const userId = validationResult.userId;

    const { name, category, description, maxUsers, backgroundSound } = await c.req.json();

    if (!name || !category) {
      return c.json({ error: 'Name and category are required' }, 400);
    }

    const roomId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const room = {
      id: roomId,
      name,
      category,
      description: description || '',
      maxUsers: maxUsers || 50,
      currentUsers: 0,
      isActive: false,
      backgroundSound: backgroundSound || 'silence',
      creatorId: userId,
      createdAt: new Date().toISOString()
    };

    await kv.set(`room:${roomId}`, room);

    return c.json({
      success: true,
      room
    });
  } catch (error) {
    console.log('Create room error:', error);
    return c.json({ error: `Failed to create room: ${error.message}` }, 500);
  }
});

// Get room details
app.get('/rooms/:roomId', async (c) => {
  try {
    const { roomId } = c.req.param();
    const room = await kv.get(`room:${roomId}`);

    if (!room) {
      return c.json({ error: 'Room not found' }, 404);
    }

    // Get active session
    const session = await kv.get(`room:${roomId}:session`);

    return c.json({
      success: true,
      room,
      session: session || null
    });
  } catch (error) {
    console.log('Get room error:', error);
    return c.json({ error: `Failed to get room: ${error.message}` }, 500);
  }
});

// ==================== SESSION ROUTES ====================

// Join room session
app.post('/rooms/:roomId/join', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const validationResult = await validateUser(authHeader);

    if (validationResult.error) {
      return c.json({ error: validationResult.error }, validationResult.status);
    }

    const userId = validationResult.userId;

    const { roomId } = c.req.param();
    const { mode, mood } = await c.req.json();

    const room = await kv.get(`room:${roomId}`);
    if (!room) {
      return c.json({ error: 'Room not found' }, 404);
    }

    const userProfile = await kv.get(`user:${userId}`);

    // Get or create session
    let session = await kv.get(`room:${roomId}:session`);
    if (!session) {
      session = {
        roomId,
        participants: [],
        startedAt: new Date().toISOString(),
        messages: [],
        reactions: []
      };
    }

    // Check if user already in session
    const existingParticipant = session.participants.find(p => p.userId === userId);
    if (existingParticipant) {
      // Update their mode/mood
      existingParticipant.mode = mode || 'video';
      existingParticipant.mood = mood || 'Focused';
      existingParticipant.lastSeenAt = new Date().toISOString();
    } else {
      // Add new participant
      session.participants.push({
        userId,
        username: userProfile?.username || validationResult.user.user_metadata?.username || 'User',
        mode: mode || 'video',
        mood: mood || 'Focused',
        joinedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString()
      });
    }

    // Update room
    room.currentUsers = session.participants.length;
    room.isActive = session.participants.length > 0;

    await kv.set(`room:${roomId}:session`, session);
    await kv.set(`room:${roomId}`, room);

    // Update user stats
    const userStats = await kv.get(`user:${userId}:stats`) || {
      totalMinutes: 0,
      roomVisits: {},
      longestSession: 0,
      weeklyMinutes: 0
    };

    userStats.roomVisits[roomId] = (userStats.roomVisits[roomId] || 0) + 1;
    await kv.set(`user:${userId}:stats`, userStats);

    return c.json({
      success: true,
      session,
      room
    });
  } catch (error) {
    console.log('Join room error:', error);
    return c.json({ error: `Failed to join room: ${error.message}` }, 500);
  }
});

// Leave room session
app.post('/rooms/:roomId/leave', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const validationResult = await validateUser(authHeader);

    if (validationResult.error) {
      return c.json({ error: validationResult.error }, validationResult.status);
    }

    const userId = validationResult.userId;

    const { roomId } = c.req.param();
    const { silent } = await c.req.json();

    const session = await kv.get(`room:${roomId}:session`);
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    const participant = session.participants.find(p => p.userId === userId);
    if (!participant) {
      return c.json({ error: 'Not in session' }, 400);
    }

    // Calculate session duration
    const joinedAt = new Date(participant.joinedAt);
    const leftAt = new Date();
    const sessionMinutes = Math.floor((leftAt.getTime() - joinedAt.getTime()) / 60000);

    // Remove participant
    session.participants = session.participants.filter(p => p.userId !== userId);

    const room = await kv.get(`room:${roomId}`);
    if (room) {
      room.currentUsers = session.participants.length;
      room.isActive = session.participants.length > 0;
      await kv.set(`room:${roomId}`, room);
    }

    await kv.set(`room:${roomId}:session`, session);

    // Update user stats
    const userStats = await kv.get(`user:${userId}:stats`) || {
      totalMinutes: 0,
      roomVisits: {},
      longestSession: 0,
      weeklyMinutes: 0
    };

    userStats.totalMinutes += sessionMinutes;
    userStats.weeklyMinutes += sessionMinutes;
    if (sessionMinutes > userStats.longestSession) {
      userStats.longestSession = sessionMinutes;
    }

    await kv.set(`user:${userId}:stats`, userStats);

    // Update user profile
    const userProfile = await kv.get(`user:${userId}`);
    if (userProfile) {
      userProfile.totalHours = Math.floor(userStats.totalMinutes / 60);
      await kv.set(`user:${userId}`, userProfile);
    }

    return c.json({
      success: true,
      sessionMinutes,
      silent: silent || false
    });
  } catch (error) {
    console.log('Leave room error:', error);
    return c.json({ error: `Failed to leave room: ${error.message}` }, 500);
  }
});

// Get session participants
app.get('/rooms/:roomId/participants', async (c) => {
  try {
    const { roomId } = c.req.param();
    const session = await kv.get(`room:${roomId}:session`);

    if (!session) {
      return c.json({
        success: true,
        participants: []
      });
    }

    return c.json({
      success: true,
      participants: session.participants
    });
  } catch (error) {
    console.log('Get participants error:', error);
    return c.json({ error: `Failed to get participants: ${error.message}` }, 500);
  }
});

// Update participant status (mode, mood)
app.put('/rooms/:roomId/participants/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const validationResult = await validateUser(authHeader);

    if (validationResult.error) {
      return c.json({ error: validationResult.error }, validationResult.status);
    }

    const userId = validationResult.userId;

    const { roomId } = c.req.param();
    const { mode, mood } = await c.req.json();

    const session = await kv.get(`room:${roomId}:session`);
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    const participant = session.participants.find(p => p.userId === userId);
    if (!participant) {
      return c.json({ error: 'Not in session' }, 400);
    }

    if (mode) participant.mode = mode;
    if (mood) participant.mood = mood;
    participant.lastSeenAt = new Date().toISOString();

    await kv.set(`room:${roomId}:session`, session);

    return c.json({
      success: true,
      participant
    });
  } catch (error) {
    console.log('Update participant error:', error);
    return c.json({ error: `Failed to update participant: ${error.message}` }, 500);
  }
});

// ==================== CHAT ROUTES ====================

// Send message
app.post('/rooms/:roomId/messages', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const validationResult = await validateUser(authHeader);

    if (validationResult.error) {
      return c.json({ error: validationResult.error }, validationResult.status);
    }

    const userId = validationResult.userId;

    const { roomId } = c.req.param();
    const { text, emoji } = await c.req.json();

    if (!text && !emoji) {
      return c.json({ error: 'Message text or emoji is required' }, 400);
    }

    const session = await kv.get(`room:${roomId}:session`);
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    const userProfile = await kv.get(`user:${userId}`);

    const message = {
      id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId,
      userName: userProfile?.username || validationResult.user.user_metadata?.username || 'User',
      text: text || emoji,
      emoji: emoji || null,
      timestamp: new Date().toISOString()
    };

    session.messages.push(message);

    // Keep only last 100 messages
    if (session.messages.length > 100) {
      session.messages = session.messages.slice(-100);
    }

    await kv.set(`room:${roomId}:session`, session);

    return c.json({
      success: true,
      message
    });
  } catch (error) {
    console.log('Send message error:', error);
    return c.json({ error: `Failed to send message: ${error.message}` }, 500);
  }
});

// Get messages
app.get('/rooms/:roomId/messages', async (c) => {
  try {
    const { roomId } = c.req.param();
    const session = await kv.get(`room:${roomId}:session`);

    if (!session) {
      return c.json({
        success: true,
        messages: []
      });
    }

    return c.json({
      success: true,
      messages: session.messages || []
    });
  } catch (error) {
    console.log('Get messages error:', error);
    return c.json({ error: `Failed to get messages: ${error.message}` }, 500);
  }
});

// Send emoji reaction
app.post('/rooms/:roomId/reactions', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const validationResult = await validateUser(authHeader);

    if (validationResult.error) {
      return c.json({ error: validationResult.error }, validationResult.status);
    }

    const userId = validationResult.userId;

    const { roomId } = c.req.param();
    const { emoji } = await c.req.json();

    if (!emoji) {
      return c.json({ error: 'Emoji is required' }, 400);
    }

    const session = await kv.get(`room:${roomId}:session`);
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    const userProfile = await kv.get(`user:${userId}`);

    const reaction = {
      id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId,
      userName: userProfile?.username || validationResult.user.user_metadata?.username || 'User',
      emoji,
      timestamp: new Date().toISOString()
    };

    if (!session.reactions) {
      session.reactions = [];
    }

    session.reactions.push(reaction);

    // Keep only reactions from last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    session.reactions = session.reactions.filter(r => r.timestamp > fiveMinutesAgo);

    await kv.set(`room:${roomId}:session`, session);

    return c.json({
      success: true,
      reaction
    });
  } catch (error) {
    console.log('Send reaction error:', error);
    return c.json({ error: `Failed to send reaction: ${error.message}` }, 500);
  }
});

// ==================== USER ROUTES ====================

// Get user profile
app.get('/users/:userId', async (c) => {
  try {
    const { userId } = c.req.param();
    const userProfile = await kv.get(`user:${userId}`);

    if (!userProfile) {
      return c.json({ error: 'User not found' }, 404);
    }

    const userStats = await kv.get(`user:${userId}:stats`);

    return c.json({
      success: true,
      user: userProfile,
      stats: userStats || {}
    });
  } catch (error) {
    console.log('Get user profile error:', error);
    return c.json({ error: `Failed to get user profile: ${error.message}` }, 500);
  }
});

// Update streak
app.post('/users/me/streak', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const validationResult = await validateUser(authHeader);

    if (validationResult.error) {
      return c.json({ error: validationResult.error }, validationResult.status);
    }

    const userId = validationResult.userId;

    const userProfile = await kv.get(`user:${userId}`);
    if (!userProfile) {
      return c.json({ error: 'User profile not found' }, 404);
    }

    const today = new Date().toISOString().split('T')[0];
    const lastActive = userProfile.lastActiveAt?.split('T')[0];

    if (lastActive !== today) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      if (lastActive === yesterday) {
        // Consecutive day
        userProfile.streak = (userProfile.streak || 0) + 1;
      } else {
        // Streak broken
        userProfile.streak = 1;
      }
      
      userProfile.lastActiveAt = new Date().toISOString();
      await kv.set(`user:${userId}`, userProfile);
    }

    return c.json({
      success: true,
      streak: userProfile.streak
    });
  } catch (error) {
    console.log('Update streak error:', error);
    return c.json({ error: `Failed to update streak: ${error.message}` }, 500);
  }
});

// Report user
app.post('/users/report', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const validationResult = await validateUser(authHeader);

    if (validationResult.error) {
      return c.json({ error: validationResult.error }, validationResult.status);
    }

    const userId = validationResult.userId;

    const { reportedUserId, reason, roomId } = await c.req.json();

    if (!reportedUserId) {
      return c.json({ error: 'Reported user ID is required' }, 400);
    }

    const reportId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const report = {
      id: reportId,
      reporterId: userId,
      reportedUserId,
      reason: reason || 'No reason provided',
      roomId: roomId || null,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    await kv.set(`report:${reportId}`, report);

    return c.json({
      success: true,
      report
    });
  } catch (error) {
    console.log('Report user error:', error);
    return c.json({ error: `Failed to report user: ${error.message}` }, 500);
  }
});

// Block user
app.post('/users/block', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const validationResult = await validateUser(authHeader);

    if (validationResult.error) {
      return c.json({ error: validationResult.error }, validationResult.status);
    }

    const userId = validationResult.userId;

    const { blockedUserId } = await c.req.json();

    if (!blockedUserId) {
      return c.json({ error: 'Blocked user ID is required' }, 400);
    }

    // Get or create blocked users list
    const blockedUsers = await kv.get(`user:${userId}:blocked`) || [];
    
    if (!blockedUsers.includes(blockedUserId)) {
      blockedUsers.push(blockedUserId);
      await kv.set(`user:${userId}:blocked`, blockedUsers);
    }

    return c.json({
      success: true,
      blockedUsers
    });
  } catch (error) {
    console.log('Block user error:', error);
    return c.json({ error: `Failed to block user: ${error.message}` }, 500);
  }
});

// Delete room (creator only)
app.delete('/rooms/:roomId', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const validationResult = await validateUser(authHeader);
    if (validationResult.error) {
      return c.json({ error: validationResult.error }, validationResult.status);
    }

    const { roomId } = c.req.param();
    const room = await kv.get(`room:${roomId}`);

    if (!room) return c.json({ error: 'Room not found' }, 404);
    if (room.creatorId !== validationResult.userId) {
      return c.json({ error: 'Only the creator can delete this room' }, 403);
    }

    await kv.del(`room:${roomId}`);
    await kv.del(`room:${roomId}:session`);

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: `Failed to delete room: ${error.message}` }, 500);
  }
});

// ==================== HEALTH CHECK ====================

app.get('/health', async (c) => {
  // Seed defaultné roomky ak neexistujú
  const existing = await kv.getByPrefix('room:');
  const rooms = existing.filter(r => r && !r.key.includes(':session') && !r.key.includes(':messages'));

  if (rooms.length === 0) {
    const defaults = [
      { name: 'Study Together', category: 'Study', description: 'Focus alongside others in silence or soft music', maxUsers: 50 },
      { name: 'Deep Work', category: 'Work', description: 'Accountability sessions for focused deep work', maxUsers: 50 },
      { name: 'Morning Routine', category: 'Morning', description: 'Start your day alongside early risers', maxUsers: 30 },
      { name: 'Chill & Music', category: 'Relax', description: 'Unwind with ambient sounds and good company', maxUsers: 50 },
      { name: 'Cleaning Vibes', category: 'Cleaning', description: 'Get motivated to tidy up together', maxUsers: 30 },
    ];

    for (const d of defaults) {
      const roomId = `default_${d.name.toLowerCase().replace(/\s+/g, '_')}`;
      await kv.set(`room:${roomId}`, {
        id: roomId,
        ...d,
        currentUsers: 0,
        isActive: true,
        backgroundSound: 'silence',
        creatorId: 'system',
        createdAt: new Date().toISOString(),
      });
    }
  }

  return c.json({ success: true, message: 'BeWith server is running!' });
});

// ==================== DAILY VIDEO ====================

app.post('/rooms/:id/video-token', async (c) => {
  const auth = await validateUser(c.req.header('Authorization'));
  if ('error' in auth) return c.json({ error: auth.error }, auth.status as any);

  const roomId = c.req.param('id');
  const dailyKey = Deno.env.get('DAILY_API_KEY');
  if (!dailyKey) return c.json({ error: 'Daily API key not configured' }, 500);

  const dailyRoomName = `bewith-${roomId}`;
  const exp = Math.floor(Date.now() / 1000) + 3600 * 4; // 4 hours

  // Create Daily room (ignore 409 if already exists)
  const createRes = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${dailyKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: dailyRoomName,
      properties: {
        enable_chat: false,
        enable_screenshare: false,
        enable_recording: false,
        max_participants: 10,
        exp,
      },
    }),
  });

  let roomUrl: string;
  if (createRes.status === 409) {
    const getRes = await fetch(`https://api.daily.co/v1/rooms/${dailyRoomName}`, {
      headers: { 'Authorization': `Bearer ${dailyKey}` },
    });
    const existing = await getRes.json();
    roomUrl = existing.url;
  } else if (createRes.ok) {
    const created = await createRes.json();
    roomUrl = created.url;
  } else {
    const err = await createRes.json();
    return c.json({ error: err.info ?? 'Failed to create Daily room' }, 500);
  }

  // Generate meeting token for this user
  const tokenRes = await fetch('https://api.daily.co/v1/meeting-tokens', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${dailyKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      properties: {
        room_name: dailyRoomName,
        user_id: auth.user.id,
        user_name: auth.user.user_metadata?.username ?? 'Guest',
        is_owner: false,
        exp,
      },
    }),
  });
  const tokenData = await tokenRes.json();

  return c.json({
    success: true,
    url: roomUrl,
    token: tokenData.token,
    roomName: dailyRoomName,
  });
});

// Debug endpoint to check auth state
app.get('/debug/auth', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader) {
      return c.json({ 
        success: false, 
        error: 'No authorization header',
        hasHeader: false
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return c.json({ 
        success: false, 
        error: 'No token in header',
        hasHeader: true,
        hasToken: false
      });
    }

    // Try to validate token
    const { data, error } = await supabaseAuth.auth.getUser(token);
    
    if (error) {
      return c.json({ 
        success: false, 
        error: error.message,
        hasHeader: true,
        hasToken: true,
        tokenValid: false,
        errorDetails: error
      });
    }

    // Check if user profile exists
    const userProfile = await kv.get(`user:${data.user.id}`);
    
    return c.json({ 
      success: true,
      hasHeader: true,
      hasToken: true,
      tokenValid: true,
      userId: data.user.id,
      userEmail: data.user.email,
      hasProfile: !!userProfile,
      profile: userProfile
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error.message,
      exception: true
    });
  }
});

// Debug endpoint to create a test user
app.post('/debug/create-test-user', async (c) => {
  try {
    const testEmail = 'test@bewith.com';
    const testPassword = 'test1234';
    const testUsername = 'TestUser';

    console.log('🔧 Creating test user:', testEmail);

    // Try to create user (will fail if already exists)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { username: testUsername }
    });

    if (authError) {
      // User might already exist, try to get existing user
      console.log('⚠️ User creation failed (might already exist):', authError.message);
      
      // List all users to check
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        return c.json({ 
          error: `Failed to list users: ${listError.message}`,
          details: listError
        }, 500);
      }

      const existingUser = users.find(u => u.email === testEmail);
      
      if (existingUser) {
        console.log('✅ Test user already exists:', existingUser.id);
        
        // Ensure profile exists in KV
        let userProfile = await kv.get(`user:${existingUser.id}`);
        
        if (!userProfile) {
          console.log('📝 Creating KV profile for existing user...');
          userProfile = {
            id: existingUser.id,
            username: testUsername,
            email: testEmail,
            streak: 0,
            totalHours: 0,
            roomsJoined: 0,
            connections: 0,
            badges: [],
            favoriteRooms: [],
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString()
          };
          
          await kv.set(`user:${existingUser.id}`, userProfile);
          
          await kv.set(`user:${existingUser.id}:stats`, {
            totalMinutes: 0,
            roomVisits: {},
            longestSession: 0,
            weeklyMinutes: 0,
            mostActiveTime: 'Not enough data',
            favoriteActivity: 'Not enough data'
          });
        }
        
        return c.json({
          success: true,
          message: 'Test user already exists',
          credentials: {
            email: testEmail,
            password: testPassword,
            username: testUsername
          },
          user: userProfile
        });
      }
      
      return c.json({ 
        error: `Failed to create test user: ${authError.message}`,
        details: authError
      }, 400);
    }

    // Create user profile in KV store
    const userId = authData.user.id;
    const userProfile = {
      id: userId,
      username: testUsername,
      email: testEmail,
      streak: 0,
      totalHours: 0,
      roomsJoined: 0,
      connections: 0,
      badges: [],
      favoriteRooms: [],
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };
    
    await kv.set(`user:${userId}`, userProfile);

    // Initialize user stats
    await kv.set(`user:${userId}:stats`, {
      totalMinutes: 0,
      roomVisits: {},
      longestSession: 0,
      weeklyMinutes: 0,
      mostActiveTime: 'Not enough data',
      favoriteActivity: 'Not enough data'
    });

    console.log('✅ Test user created successfully');

    return c.json({
      success: true,
      message: 'Test user created successfully',
      credentials: {
        email: testEmail,
        password: testPassword,
        username: testUsername
      },
      user: userProfile
    });
  } catch (error) {
    console.log('❌ Test user creation error:', error);
    return c.json({ 
      error: `Failed to create test user: ${error.message}`,
      details: error
    }, 500);
  }
});

// Start server
Deno.serve(app.fetch);