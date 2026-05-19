import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { authAPI } from '/src/utils/api';
import { supabase } from '/src/utils/supabase/client';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface AuthScreenProps {
  onAuthSuccess: (user: any, accessToken: string) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testUserReady, setTestUserReady] = useState(false);

  useEffect(() => {
    fetch(`https://${projectId}.supabase.co/functions/v1/server/debug/create-test-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.success || d?.message?.includes('already exists')) setTestUserReady(true); })
      .catch(() => {});
  }, []);

  const setSession = async (session: { access_token: string; refresh_token: string }) => {
    const { error } = await supabase.auth.setSession(session);
    if (error) throw new Error('Session error');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (!username.trim()) { toast.error('Enter a username'); return; }
        if (password.length < 6) { toast.error('Password must be 6+ characters'); return; }
        await authAPI.signup(email, password, username);
        const r = await authAPI.signin(email, password);
        if (r.success && r.session) {
          await setSession(r.session);
          toast.success(`Welcome to BeWith, ${username}!`);
          onAuthSuccess(r.user, r.session.access_token);
        }
      } else {
        const r = await authAPI.signin(email, password);
        if (r.success && r.session) {
          await setSession(r.session);
          toast.success(`Welcome back, ${r.user.username}!`);
          onAuthSuccess(r.user, r.session.access_token);
        }
      }
    } catch (err: any) {
      const msg = err.message ?? '';
      if (msg.includes('Invalid login credentials')) toast.error('Incorrect email or password');
      else if (msg.includes('already registered')) { toast.error('Already registered — sign in instead'); setTimeout(() => setMode('signin'), 1200); }
      else toast.error(msg || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setLoading(true);
    try {
      const r = await authAPI.signin('test@bewith.com', 'test1234');
      if (r.success && r.session) {
        await setSession(r.session);
        onAuthSuccess(r.user, r.session.access_token);
      }
    } catch { toast.error('Test login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-5"
      style={{ background: '#080B12' }}>

      {/* ── Ambient orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="bw-orb-1 absolute rounded-full" style={{
          width: 600, height: 600, top: -200, left: -200,
          background: 'radial-gradient(circle, rgba(124,101,245,0.22) 0%, transparent 65%)',
          filter: 'blur(1px)',
        }}/>
        <div className="bw-orb-2 absolute rounded-full" style={{
          width: 500, height: 500, bottom: -150, right: -150,
          background: 'radial-gradient(circle, rgba(91,164,245,0.18) 0%, transparent 65%)',
          filter: 'blur(1px)',
        }}/>
        <div className="bw-orb-3 absolute rounded-full" style={{
          width: 350, height: 350, top: '40%', left: '55%',
          background: 'radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 65%)',
          filter: 'blur(1px)',
        }}/>
        {/* Mesh grid overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}/>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[380px]"
      >
        {/* Logo */}
        <div className="text-center mb-9">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative inline-block mb-5"
          >
            <div className="w-[72px] h-[72px] rounded-3xl mx-auto flex items-center justify-center shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #7C65F5, #5BA4F5)' }}>
              <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
                <circle cx="12" cy="20" r="3.5" fill="white" fillOpacity="0.9"/>
                <circle cx="20" cy="20" r="3.5" fill="white"/>
                <circle cx="28" cy="20" r="3.5" fill="white" fillOpacity="0.9"/>
                <path d="M8 12C8 9.79 9.79 8 12 8h16C30.21 8 32 9.79 32 12v16c0 2.21-1.79 4-4 4H12C9.79 32 8 30.21 8 28V12Z" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" fill="none"/>
              </svg>
            </div>
            {/* glow */}
            <div className="bw-glow-pulse absolute -inset-3 rounded-3xl -z-10"
              style={{ background: 'radial-gradient(circle, rgba(124,101,245,0.35) 0%, transparent 70%)' }}/>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="text-[2rem] font-bold tracking-[-0.04em]" style={{ color: '#EEEEFF' }}>BeWith</h1>
            <p className="text-sm mt-1.5" style={{ color: 'rgba(238,238,255,0.42)' }}>
              Shared presence, without pressure
            </p>
          </motion.div>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="bw-glass rounded-3xl p-6"
          style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)' }}
        >
          {/* Tab toggle */}
          <div className="flex rounded-2xl p-1 mb-5" style={{ background: 'rgba(255,255,255,0.06)' }}>
            {(['signup', 'signin'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: mode === m ? 'rgba(124,101,245,0.28)' : 'transparent',
                  color:      mode === m ? '#C4B5FD' : 'rgba(238,238,255,0.35)',
                  boxShadow:  mode === m ? '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)' : 'none',
                }}>
                {m === 'signup' ? 'Create account' : 'Sign in'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <AnimatePresence initial={false}>
              {mode === 'signup' && (
                <motion.div key="uname"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
                >
                  <input
                    type="text" value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="Display name" required={mode === 'signup'} disabled={loading}
                    autoComplete="username"
                    className="bw-input w-full px-4 py-3 rounded-2xl text-sm"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email" required disabled={loading} autoComplete="email"
              className="bw-input w-full px-4 py-3 rounded-2xl text-sm"
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password (6+ characters)" required disabled={loading}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="bw-input w-full px-4 py-3 pr-11 rounded-2xl text-sm"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
                style={{ color: 'rgba(238,238,255,0.35)' }}>
                {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
              </button>
            </div>

            <button type="submit" disabled={loading}
              className="bw-btn-primary w-full py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 mt-1"
              style={{ boxShadow: '0 4px 20px rgba(124,101,245,0.35)' }}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin"/> {mode === 'signup' ? 'Creating…' : 'Signing in…'}</>
                : <>{mode === 'signup' ? 'Get started' : 'Continue'} <ArrowRight className="w-4 h-4"/></>
              }
            </button>
          </form>

          {testUserReady && (
            <div className="mt-4 text-center">
              <button onClick={handleTestLogin} disabled={loading}
                className="text-xs transition-opacity hover:opacity-80"
                style={{ color: 'rgba(124,101,245,0.7)' }}>
                Try test account
              </button>
            </div>
          )}
        </motion.div>

        {/* Bottom pills */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="flex justify-center gap-3 mt-6 flex-wrap"
        >
          {[
            { emoji: '🔒', text: 'Private by default' },
            { emoji: '🤫', text: 'No pressure' },
            { emoji: '💜', text: 'Just presence' },
          ].map(p => (
            <div key={p.text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-sm">{p.emoji}</span>
              <span className="text-xs" style={{ color: 'rgba(238,238,255,0.38)' }}>{p.text}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
