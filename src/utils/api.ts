import { projectId, publicAnonKey } from './supabase/info';
import { getActiveSession, clearAuthState } from './supabase/client';

const API_URL = `https://${projectId}.supabase.co/functions/v1/server`;

// Global auth failure handler
let onAuthFailure: (() => void) | null = null;

export function setAuthFailureHandler(handler: () => void) {
  onAuthFailure = handler;
}

// Helper to get valid auth token from Supabase session
const getAuthToken = async (): Promise<string | null> => {
  try {
    const session = await getActiveSession();
    
    if (!session || !session.access_token) {
      console.log('⚠️ No valid session or access token');
      return null;
    }
    
    console.log('🎫 Using active Supabase session token (user:', session.user.id + ')');
    return session.access_token;
  } catch (error) {
    console.error('❌ Failed to get auth token:', error);
    return null;
  }
};

// Helper to make authenticated requests with proper error handling
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken();
  
  if (!token) {
    console.error('❌ No valid auth token - user must re-authenticate');
    if (onAuthFailure) {
      onAuthFailure();
    }
    throw new Error('Authentication required');
  }
  
  console.log(`📡 API Request: ${endpoint}`);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'apikey': publicAnonKey, 
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    console.error('❌ 401 Unauthorized - JWT validation failed');
    console.error('🧹 Clearing auth state and forcing re-authentication');
    await clearAuthState();
    if (onAuthFailure) {
      onAuthFailure();
    }
    throw new Error('Session expired or invalid. Please sign in again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
    console.error(`❌ API Error: ${endpoint}`, error);
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  console.log(`✅ API Success: ${endpoint}`);
  return data;
};

// ==================== AUTH API ====================

export const authAPI = {
  signup: async (email: string, password: string, username: string) => {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ email, password, username }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    return response.json();
  },

  signin: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Sign in failed');
    }

    return response.json();
  },

  getMe: async () => {
    return fetchWithAuth('/auth/me');
  },

  signout: async () => {
    await clearAuthState();
  },
};

// ==================== ROOMS API ====================

export const roomsAPI = {
  getAll: async () => {
    return fetchWithAuth('/rooms');
  },

  create: async (roomData: {
    name: string;
    category: string;
    description?: string;
    maxUsers?: number;
    backgroundSound?: string;
  }) => {
    return fetchWithAuth('/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  },

  getById: async (roomId: string) => {
    return fetchWithAuth(`/rooms/${roomId}`);
  },

  join: async (roomId: string, mode: 'video' | 'audio' | 'silent', mood: string) => {
    return fetchWithAuth(`/rooms/${roomId}/join`, {
      method: 'POST',
      body: JSON.stringify({ mode, mood }),
    });
  },

  leave: async (roomId: string, silent: boolean = false) => {
    return fetchWithAuth(`/rooms/${roomId}/leave`, {
      method: 'POST',
      body: JSON.stringify({ silent }),
    });
  },

  getParticipants: async (roomId: string) => {
    return fetchWithAuth(`/rooms/${roomId}/participants`);
  },

  updateParticipantStatus: async (roomId: string, mode?: string, mood?: string) => {
    return fetchWithAuth(`/rooms/${roomId}/participants/me`, {
      method: 'PUT',
      body: JSON.stringify({ mode, mood }),
    });
  },
};

// ==================== CHAT API ====================

export const chatAPI = {
  sendMessage: async (roomId: string, text: string, emoji?: string) => {
    return fetchWithAuth(`/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, emoji }),
    });
  },

  getMessages: async (roomId: string) => {
    return fetchWithAuth(`/rooms/${roomId}/messages`);
  },

  sendReaction: async (roomId: string, emoji: string) => {
    return fetchWithAuth(`/rooms/${roomId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  },
};

// ==================== USER API ====================

export const userAPI = {
  getProfile: async (userId: string) => {
    return fetchWithAuth(`/users/${userId}`);
  },

  updateStreak: async () => {
    return fetchWithAuth('/users/me/streak', {
      method: 'POST',
    });
  },

  reportUser: async (reportedUserId: string, reason?: string, roomId?: string) => {
    return fetchWithAuth('/users/report', {
      method: 'POST',
      body: JSON.stringify({ reportedUserId, reason, roomId }),
    });
  },

  blockUser: async (blockedUserId: string) => {
    return fetchWithAuth('/users/block', {
      method: 'POST',
      body: JSON.stringify({ blockedUserId }),
    });
  },
};

// ==================== POLLING HELPERS ====================

// Poll for real-time updates (simple polling solution)
export const pollParticipants = (roomId: string, callback: (participants: any[]) => void, interval: number = 3000) => {
  const poll = async () => {
    try {
      const response = await roomsAPI.getParticipants(roomId);
      if (response.success) {
        callback(response.participants);
      }
    } catch (error) {
      console.error('Error polling participants:', error);
    }
  };

  poll(); // Initial call
  const intervalId = setInterval(poll, interval);

  return () => clearInterval(intervalId);
};

export const pollMessages = (roomId: string, callback: (messages: any[]) => void, interval: number = 2000) => {
  const poll = async () => {
    try {
      const response = await chatAPI.getMessages(roomId);
      if (response.success) {
        callback(response.messages);
      }
    } catch (error) {
      console.error('Error polling messages:', error);
    }
  };

  poll(); // Initial call
  const intervalId = setInterval(poll, interval);

  return () => clearInterval(intervalId);
};

// ==================== VIDEO API ====================

export const videoAPI = {
  getToken: async (roomId: string) => {
    return fetchWithAuth(`/rooms/${roomId}/video-token`, { method: 'POST' });
  },
};

// ==================== HEALTH CHECK ====================

export const checkHealth = async () => {
  const response = await fetch(`${API_URL}/health`, {
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
    },
  });
  return response.json();
};