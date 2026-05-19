import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

// Create singleton Supabase client for auth session management
export const supabase = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: window.localStorage,
  },
});

// Get current session with automatic refresh
export async function getActiveSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Session error:', error);
      return null;
    }
    
    if (session) {
      console.log('✅ Active session found for user:', session.user.id);
      return session;
    }
    
    console.log('⚠️ No active session');
    return null;
  } catch (error) {
    console.error('❌ Failed to get session:', error);
    return null;
  }
}

// Clear all auth state
export async function clearAuthState() {
  try {
    await supabase.auth.signOut();
    localStorage.removeItem('bewith_access_token');
    console.log('🧹 Auth state cleared');
  } catch (error) {
    console.error('❌ Failed to clear auth state:', error);
  }
}
