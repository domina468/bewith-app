import { useState, useEffect, useRef } from 'react';
import { Video, Mic, MicOff, VideoOff, PhoneOff, MessageCircle, Users,
         Music, Headphones, Volume2, EyeOff, Flag, Ban, AlertCircle, X, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useDaily } from '../hooks/useDaily';
import { VideoTile } from './VideoTile';
import { videoAPI } from '/src/utils/api';
import { supabase } from '/src/utils/supabase/client';

interface Room {
  id: string; name: string; category: string; description: string;
  currentUsers: number; maxUsers: number; imageUrl: string; isActive: boolean;
}

interface RoomDetailProps {
  room: Room;
  user: { id?: string; username: string; email: string };
  onLeave: () => void;
  onOpenChat: () => void;
}

interface PresenceMember {
  userId: string;
  username: string;
  mood: string;
  joinedAt: string;
}

const MOOD_CFG: Record<string, { emoji: string; color: string; bg: string }> = {
  Focused:   { emoji:'🎯', color:'#93C5FD', bg:'rgba(147,197,253,0.15)' },
  Calm:      { emoji:'😌', color:'#34D399', bg:'rgba(52,211,153,0.15)'  },
  Motivated: { emoji:'⚡', color:'#FBBF24', bg:'rgba(251,191,36,0.15)'  },
  Tired:     { emoji:'😴', color:'#A78BFA', bg:'rgba(167,139,250,0.15)' },
};

const SOUNDS = [
  { id:'silence', name:'Silence',      emoji:'🤫' },
  { id:'focus',   name:'Focus Sounds', emoji:'🌊' },
  { id:'lofi',    name:'Lo-fi',        emoji:'🎵' },
  { id:'nature',  name:'Nature',       emoji:'🌿' },
  { id:'rain',    name:'Rain',         emoji:'🌧️' },
];

const REACTIONS = ['👍','🌱','✨','☕','💪','🙏'];


export function RoomDetail({ room, user, onLeave, onOpenChat }: RoomDetailProps) {
  const { callState, participants, localParticipant, error, join, leave, toggleMic, toggleCamera } = useDaily();

  const [mode, setMode]           = useState<'video'|'audio'|'silent'>('video');
  const [sessionMins, setMins]    = useState(0);
  const [sound, setSound]         = useState('silence');
  const [mood, setMood]           = useState<keyof typeof MOOD_CFG>('Focused');
  const [floats, setFloats]       = useState<{ id:string; emoji:string; x:number }[]>([]);
  const [presenceMembers, setPresenceMembers] = useState<PresenceMember[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const [showParticipants, setShowParticipants] = useState(false);
  const [showSoundSheet,   setShowSoundSheet]   = useState(false);
  const [showSafetySheet,  setShowSafetySheet]  = useState(false);
  const [showMoodSheet,    setShowMoodSheet]     = useState(false);
  const [showReactions,    setShowReactions]     = useState(false);

  // Session timer
  useEffect(() => {
    const t = setInterval(() => setMins(m => m + 1), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (sessionMins === 45) toast.info('Take a short break if you need one');
    if (sessionMins === 90) toast.info("You've been here 90 minutes — consider a break");
  }, [sessionMins]);

  // Supabase Realtime Presence — live zoznam ľudí v roomke
  useEffect(() => {
    const channelName = `room:${room.id}`;
    const channel = supabase.channel(channelName, {
      config: { presence: { key: user.id || user.username } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceMember>();
        const members = Object.values(state).flatMap(presences => presences);
        setPresenceMembers(members);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: user.id || user.username,
            username: user.username,
            mood,
            joinedAt: new Date().toISOString(),
          } as PresenceMember);
        }
      });

    channelRef.current = channel;

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [room.id, user.id, user.username]);

  // Aktualizuj mood v presence keď sa zmení
  useEffect(() => {
    if (channelRef.current) {
      channelRef.current.track({
        userId: user.id || user.username,
        username: user.username,
        mood,
        joinedAt: new Date().toISOString(),
      } as PresenceMember);
    }
  }, [mood]);

  // Join Daily call on mount
  useEffect(() => {
    const initCall = async () => {
      try {
        const data = await videoAPI.getToken(room.id);
        if (data.success) {
          await join(data.url, data.token, user.username);
        }
      } catch (e: any) {
        toast.error('Could not connect video — showing presence mode');
      }
    };
    initCall();
    return () => { leave(); };
  }, [room.id]);

  // Reflect mode change on camera/mic
  useEffect(() => {
    if (callState !== 'joined') return;
    if (mode === 'silent') {
      // mute both when silent
    }
  }, [mode, callState]);

  useEffect(() => {
    if (error) toast.error(`Video error: ${error}`);
  }, [error]);

  const sendReaction = (emoji: string) => {
    const id = Date.now().toString();
    const x = Math.random() * 70 + 15;
    setFloats(p => [...p, { id, emoji, x }]);
    setTimeout(() => setFloats(p => p.filter(r => r.id !== id)), 2600);
    setShowReactions(false);
  };

  const handleLeave = async () => {
    await leave();
    onLeave();
  };

  const handleToggleMic    = () => toggleMic();
  const handleToggleCamera = () => toggleCamera();

  const fmt = (m: number) => m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`;
  const moodCfg = MOOD_CFG[mood];

  // Video tiles — len reálni Daily účastníci
  const realTiles = participants.slice(0, 6);

  // Presence tiles — účastníci bez videa (z presence, nie v Daily)
  const dailyUserNames = new Set(participants.map(p => p.userName.toLowerCase()));
  const presenceOnly = presenceMembers.filter(
    m => !dailyUserNames.has(m.username.toLowerCase())
  );

  const isVideoOff = !localParticipant?.videoOn;
  const isMuted    = !localParticipant?.audioOn;

  return (
    <div className="min-h-screen flex flex-col" style={{ background:'#080B12' }}>

      {/* Ambient bg */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img src={room.imageUrl} alt="" className="w-full h-full object-cover opacity-10 blur-2xl scale-110"/>
        <div className="absolute inset-0"
          style={{ background:'linear-gradient(to bottom,rgba(8,11,18,0.7) 0%,rgba(8,11,18,0.92) 50%,#080B12 100%)' }}/>
      </div>

      {/* Floating emoji reactions */}
      <AnimatePresence>
        {floats.map(r => (
          <motion.div key={r.id}
            initial={{ opacity:0, y:0, scale:0.5 }}
            animate={{ opacity:[0,1,1,0], y:-170, scale:[0.5,1.4,1.2,0.8] }}
            exit={{ opacity:0 }}
            transition={{ duration:2.5, ease:'easeOut' }}
            className="fixed bottom-44 text-3xl pointer-events-none z-50"
            style={{ left:`${r.x}%` }}>
            {r.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="relative z-10 px-5 pt-5 pb-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-emerald-400"/>
              <div className="bw-live-ring absolute inset-0 rounded-full bg-emerald-400"/>
            </div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Live</span>
          </div>
          <h2 className="text-white text-xl font-bold tracking-tight leading-tight">{room.name}</h2>
          <p className="text-white/40 text-xs mt-0.5">
            Together for <span className="text-emerald-400/80">{fmt(sessionMins)}</span>
            <span className="mx-1.5">·</span>
            {presenceMembers.length || room.currentUsers} present
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mood */}
          <button onClick={() => setShowMoodSheet(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background:moodCfg.bg, color:moodCfg.color, border:`1px solid ${moodCfg.color}40` }}>
            {moodCfg.emoji} {mood}
            <ChevronDown className="w-3 h-3 opacity-60"/>
          </button>
          {/* Participants */}
          <button onClick={() => setShowParticipants(true)}
            className="w-9 h-9 rounded-2xl flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ background:'rgba(255,255,255,0.08)' }}>
            <Users className="w-4 h-4 text-white/60"/>
          </button>
        </div>
      </div>

      {/* ── Video grid ── */}
      <div className="relative z-10 flex-1 px-4 py-2 overflow-y-auto">
        {callState === 'joining' && (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin"/>
            <span className="ml-2 text-white/50 text-sm">Connecting…</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {/* Real Daily participants */}
          {realTiles.map((p, i) => (
            <VideoTile key={p.sessionId} participant={p} index={i}
              mood={p.isLocal ? `${moodCfg.emoji} ${mood}` : undefined}/>
          ))}

          {/* Presence-only tiles — ľudia v roomke bez videa */}
          {presenceOnly.map((m) => {
            const mc = MOOD_CFG[m.mood as keyof typeof MOOD_CFG];
            return (
              <div key={m.userId} className="aspect-[3/4] rounded-3xl overflow-hidden relative flex flex-col items-center justify-center gap-2"
                style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white"
                  style={{ background:'linear-gradient(135deg,#A78BFA,#7C65F5)' }}>
                  {m.username[0].toUpperCase()}
                </div>
                <p className="text-white/60 text-sm font-medium">{m.username}</p>
                {mc && <p className="text-white/35 text-xs">{mc.emoji} {m.mood}</p>}
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                  <span className="text-xs text-white/50 bg-black/30 px-2 py-0.5 rounded-full">{m.username}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Privacy note */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:2 }}
        className="relative z-10 flex items-center justify-center gap-1.5 py-2">
        <EyeOff className="w-3 h-3 text-white/15"/>
        <p className="text-white/15 text-xs">No recording · No screenshots</p>
      </motion.div>

      {/* ── Controls ── */}
      <div className="relative z-10 px-5 pb-8 pt-3">
        {/* Mode switcher */}
        <div className="flex rounded-2xl p-1 mb-4 mx-auto max-w-xs"
          style={{ background:'rgba(255,255,255,0.07)' }}>
          {(['video','audio','silent'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{
                background: mode===m ? 'rgba(124,101,245,0.3)' : 'transparent',
                color:      mode===m ? '#C4B5FD' : 'rgba(238,238,255,0.35)',
                boxShadow:  mode===m ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'none',
              }}>
              {m==='video'  && <Video     className="w-3.5 h-3.5"/>}
              {m==='audio'  && <Mic       className="w-3.5 h-3.5"/>}
              {m==='silent' && <Headphones className="w-3.5 h-3.5"/>}
              <span className="capitalize">{m}</span>
            </button>
          ))}
        </div>

        {/* Main buttons */}
        <div className="flex items-center justify-center gap-3">
          {mode !== 'silent' && (
            <CtrlBtn onClick={handleToggleMic} off={isMuted} size="md">
              {isMuted ? <MicOff className="w-5 h-5"/> : <Mic className="w-5 h-5"/>}
            </CtrlBtn>
          )}
          {mode === 'video' && (
            <CtrlBtn onClick={handleToggleCamera} off={isVideoOff} size="md">
              {isVideoOff ? <VideoOff className="w-5 h-5"/> : <Video className="w-5 h-5"/>}
            </CtrlBtn>
          )}

          {/* Leave */}
          <CtrlBtn onClick={handleLeave} danger size="lg">
            <PhoneOff className="w-6 h-6"/>
          </CtrlBtn>

          <CtrlBtn onClick={onOpenChat} size="md">
            <MessageCircle className="w-5 h-5"/>
          </CtrlBtn>
          <CtrlBtn onClick={() => setShowSoundSheet(true)} size="md">
            <Music className="w-5 h-5"/>
          </CtrlBtn>
          <CtrlBtn onClick={() => setShowSafetySheet(true)} size="md">
            <AlertCircle className="w-5 h-5"/>
          </CtrlBtn>
        </div>

        {/* Reactions */}
        <div className="flex items-center justify-center mt-4">
          <AnimatePresence>
            {showReactions ? (
              <motion.div key="picker"
                initial={{ opacity:0, y:8, scale:0.9 }} animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0, y:8, scale:0.9 }}
                className="flex items-center gap-1 px-3 py-2 rounded-2xl"
                style={{ background:'rgba(255,255,255,0.09)', backdropFilter:'blur(12px)' }}>
                {REACTIONS.map(e => (
                  <button key={e} onClick={() => sendReaction(e)}
                    className="text-xl w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors">
                    {e}
                  </button>
                ))}
                <button onClick={() => setShowReactions(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-xl text-white/35 hover:text-white/70">
                  <X className="w-3.5 h-3.5"/>
                </button>
              </motion.div>
            ) : (
              <motion.button key="toggle" initial={{ opacity:0 }} animate={{ opacity:1 }}
                onClick={() => setShowReactions(true)}
                className="px-4 py-2 rounded-2xl text-xs font-semibold transition-colors"
                style={{ background:'rgba(255,255,255,0.07)', color:'rgba(238,238,255,0.4)' }}>
                React ✨
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-white/18 text-xs mt-3">Leave quietly · No pressure to talk</p>
      </div>

      {/* Sound active pill */}
      {sound !== 'silence' && (
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full"
          style={{ background:'rgba(0,0,0,0.55)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.1)' }}>
          <Volume2 className="w-3.5 h-3.5 text-emerald-400"/>
          <span className="text-white/70 text-xs">{SOUNDS.find(s=>s.id===sound)?.emoji} {SOUNDS.find(s=>s.id===sound)?.name}</span>
          <button onClick={() => setSound('silence')} className="text-white/35 hover:text-white/70 ml-1">
            <X className="w-3 h-3"/>
          </button>
        </motion.div>
      )}

      {/* ── Participants panel ── */}
      <AnimatePresence>
        {showParticipants && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="fixed inset-0 z-40" style={{ background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }}
              onClick={() => setShowParticipants(false)}/>
            <motion.div
              initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
              transition={{ type:'spring', damping:28, stiffness:280 }}
              className="fixed top-0 right-0 bottom-0 w-72 z-50 overflow-y-auto"
              style={{ background:'#0E1120', borderLeft:'1px solid rgba(255,255,255,0.08)' }}>
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-white font-bold">Present ({presenceMembers.length})</h3>
                  <button onClick={() => setShowParticipants(false)} className="text-white/35 hover:text-white/70"><X className="w-5 h-5"/></button>
                </div>
                <div className="space-y-2">
                  {presenceMembers.map((p) => {
                    const isMe = p.userId === (user.id || user.username);
                    const mc = MOOD_CFG[p.mood as keyof typeof MOOD_CFG];
                    return (
                      <div key={p.userId} className="flex items-center gap-3 p-3 rounded-2xl"
                        style={{ background: isMe ? 'rgba(124,101,245,0.12)' : 'rgba(255,255,255,0.04)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                          style={{ background:'linear-gradient(135deg,#7C65F5,#5BA4F5)' }}>
                          {p.username[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-semibold">{isMe ? 'You' : p.username}</p>
                          {mc && <p className="text-white/40 text-xs">{mc.emoji} {p.mood}</p>}
                        </div>
                      </div>
                    );
                  })}
                  {presenceMembers.length === 0 && (
                    <p className="text-white/30 text-sm text-center py-4">Connecting…</p>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Mood sheet ── */}
      <Sheet open={showMoodSheet} onClose={() => setShowMoodSheet(false)} title="How are you feeling?">
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(MOOD_CFG) as [keyof typeof MOOD_CFG, typeof MOOD_CFG[keyof typeof MOOD_CFG]][]).map(([key, cfg]) => (
            <button key={key} onClick={() => { setMood(key); setShowMoodSheet(false); }}
              className="flex items-center gap-3 p-4 rounded-2xl transition-all"
              style={{
                background: mood===key ? cfg.bg : 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${mood===key ? cfg.color : 'transparent'}`,
              }}>
              <span className="text-2xl">{cfg.emoji}</span>
              <span className="text-white text-sm font-semibold">{key}</span>
            </button>
          ))}
        </div>
      </Sheet>

      {/* ── Sound sheet ── */}
      <Sheet open={showSoundSheet} onClose={() => setShowSoundSheet(false)} title="Room Atmosphere">
        <div className="space-y-2">
          {SOUNDS.map(s => (
            <button key={s.id} onClick={() => { setSound(s.id); setShowSoundSheet(false); if (s.id!=='silence') toast.success(`${s.emoji} ${s.name} playing`); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all"
              style={{
                background: sound===s.id ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${sound===s.id ? 'rgba(52,211,153,0.5)' : 'transparent'}`,
              }}>
              <span className="text-xl">{s.emoji}</span>
              <span className="text-white text-sm font-semibold flex-1 text-left">{s.name}</span>
              {sound===s.id && <span className="text-emerald-400 text-xs font-bold">Active</span>}
            </button>
          ))}
        </div>
      </Sheet>

      {/* ── Safety sheet ── */}
      <Sheet open={showSafetySheet} onClose={() => setShowSafetySheet(false)} title="Safety & Comfort">
        <div className="space-y-3">
          <div className="p-4 rounded-2xl flex items-start gap-3" style={{ background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.2)' }}>
            <EyeOff className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0"/>
            <div>
              <p className="text-white text-sm font-semibold mb-0.5">Privacy Protected</p>
              <p className="text-white/45 text-xs">BeWith never records sessions or allows screenshots.</p>
            </div>
          </div>
          {[
            { icon:Flag, color:'#F472B6', label:'Report a Participant', msg:'Report submitted — thank you.' },
            { icon:Ban,  color:'#FBBF24', label:'Block a Participant',  msg:"Blocked — you won't see them again." },
          ].map(item => (
            <div key={item.label} className="p-4 rounded-2xl" style={{ background:'rgba(255,255,255,0.05)' }}>
              <p className="text-white text-sm font-semibold mb-1 flex items-center gap-2">
                <item.icon className="w-4 h-4" style={{ color:item.color }}/> {item.label}
              </p>
              <select className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none mt-2"
                style={{ background:'rgba(255,255,255,0.08)' }} defaultValue=""
                onChange={e => { if (e.target.value) { toast.success(item.msg); setShowSafetySheet(false); } }}>
                <option value="" disabled>Choose participant…</option>
                {participants.filter(p => !p.isLocal).map(p => (
                  <option key={p.sessionId} value={p.sessionId}>{p.userName}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

/* ─── Helpers ───────────────────────────────────── */

function CtrlBtn({ onClick, children, size='md', danger=false, off=false }:
  { onClick:()=>void; children:React.ReactNode; size?:'sm'|'md'|'lg'; danger?:boolean; off?:boolean }) {
  const dims = size==='lg' ? 'w-16 h-16' : size==='md' ? 'w-12 h-12' : 'w-10 h-10';
  const bg   = danger ? '#E05252' : off ? 'rgba(224,82,82,0.18)' : 'rgba(255,255,255,0.09)';
  const color= danger ? 'white'   : off ? '#F87171'              : 'rgba(238,238,255,0.75)';
  return (
    <motion.button whileHover={{ scale:1.06 }} whileTap={{ scale:0.93 }}
      onClick={onClick}
      className={`${dims} rounded-2xl flex items-center justify-center transition-colors`}
      style={{ background:bg, color }}>
      {children}
    </motion.button>
  );
}

function Sheet({ open, onClose, title, children }:
  { open:boolean; onClose:()=>void; title:string; children:React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-40" style={{ background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }}
            onClick={onClose}/>
          <motion.div
            initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
            transition={{ type:'spring', damping:30, stiffness:300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl px-5 pt-5 pb-10 max-h-[85vh] overflow-y-auto"
            style={{ background:'#0E1120', borderTop:'1px solid rgba(255,255,255,0.09)' }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background:'rgba(255,255,255,0.15)' }}/>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">{title}</h3>
              <button onClick={onClose} className="text-white/35 hover:text-white/70"><X className="w-5 h-5"/></button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
