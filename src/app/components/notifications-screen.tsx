import { useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationsScreenProps { onBack: () => void; }

interface Notif {
  id: string; title: string; message: string;
  ts: Date; read: boolean; emoji: string; accent: string;
}

const INITIAL: Notif[] = [
  { id:'1', title:'Friend Activity',       message:'Sarah joined "Study Together"',              ts: new Date(Date.now()-300000),    read:false, emoji:'👋', accent:'#93C5FD' },
  { id:'2', title:'Badge Unlocked!',        message:'You earned the "Social Butterfly" badge',   ts: new Date(Date.now()-3600000),   read:false, emoji:'🦋', accent:'#A78BFA' },
  { id:'3', title:'Favourite Room Active',  message:'"Chill & Music" has 12 people waiting',     ts: new Date(Date.now()-7200000),   read:true,  emoji:'🎵', accent:'#F472B6' },
  { id:'4', title:'Popular Room',           message:'"Deep Work" is trending right now',          ts: new Date(Date.now()-86400000),  read:true,  emoji:'🔥', accent:'#FBBF24' },
  { id:'5', title:'Friend Activity',        message:'Mike joined "Morning Routine"',              ts: new Date(Date.now()-172800000), read:true,  emoji:'🌅', accent:'#34D399' },
];

const rel = (d: Date) => {
  const s = Math.floor((Date.now()-d.getTime())/1000);
  if (s<60) return 'just now';
  if (s<3600) return `${Math.floor(s/60)}m ago`;
  if (s<86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

export function NotificationsScreen({ onBack }: NotificationsScreenProps) {
  const [items, setItems] = useState(INITIAL);
  const dismiss = (id: string) => setItems(p => p.filter(n => n.id !== id));
  const markAll = () => setItems(p => p.map(n => ({ ...n, read:true })));

  const unread = items.filter(n => !n.read);
  const read   = items.filter(n => n.read);

  return (
    <div className="min-h-screen" style={{ background:'#080B12' }}>

      <div className="pointer-events-none fixed top-0 inset-x-0 h-48 z-0"
        style={{ background:'radial-gradient(ellipse 60% 50% at 50% -5%, rgba(124,101,245,0.15) 0%, transparent 70%)' }}/>

      <header className="sticky top-0 z-20 px-5 py-4 flex items-center justify-between"
        style={{ background:'rgba(8,11,18,0.82)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/8"
            style={{ color:'#A78BFA' }}>
            <ArrowLeft className="w-5 h-5"/>
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none" style={{ color:'#EEEEFF' }}>Updates</h1>
            <p className="text-xs mt-0.5" style={{ color:'rgba(238,238,255,0.32)' }}>No urgency, just gentle notes</p>
          </div>
        </div>
        {unread.length > 0 && (
          <button onClick={markAll}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
            style={{ background:'rgba(124,101,245,0.12)', color:'#A78BFA' }}>
            Mark all read
          </button>
        )}
      </header>

      <div className="relative z-10 max-w-md mx-auto px-4 py-5 pb-24 space-y-5">

        {/* Calm note */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          className="px-4 py-3 rounded-2xl text-center"
          style={{ background:'rgba(124,101,245,0.08)', border:'1px solid rgba(124,101,245,0.15)' }}>
          <p className="text-sm" style={{ color:'rgba(167,139,250,0.8)' }}>
            Check these whenever you feel like it — no FOMO here.
          </p>
        </motion.div>

        <AnimatePresence>
          {unread.length > 0 && (
            <motion.div key="unread" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-3 px-1"
                style={{ color:'rgba(238,238,255,0.28)', letterSpacing:'0.12em' }}>New · {unread.length}</p>
              <div className="space-y-2.5">
                <AnimatePresence>
                  {unread.map((n,i) => <NCard key={n.id} n={n} i={i} onDismiss={dismiss}/>)}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {read.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-3 px-1"
              style={{ color:'rgba(238,238,255,0.28)', letterSpacing:'0.12em' }}>Earlier</p>
            <div className="space-y-2.5">
              <AnimatePresence>
                {read.map((n,i) => <NCard key={n.id} n={n} i={i} onDismiss={dismiss}/>)}
              </AnimatePresence>
            </div>
          </div>
        )}

        {items.length === 0 && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="text-center py-20">
            <p className="text-4xl mb-4">🌌</p>
            <p className="text-sm font-semibold" style={{ color:'#EEEEFF' }}>All clear</p>
            <p className="text-xs mt-1" style={{ color:'rgba(238,238,255,0.32)' }}>Enjoy the quiet. We'll let you know when something comes up.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function NCard({ n, i, onDismiss }: { n: Notif; i:number; onDismiss:(id:string)=>void }) {
  return (
    <motion.div
      initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
      exit={{ opacity:0, x:10, height:0, marginBottom:0, paddingTop:0, paddingBottom:0 }}
      transition={{ delay:i*0.04, duration:0.3 }}
      className="flex items-start gap-3 p-4 rounded-2xl"
      style={{
        background: n.read ? 'rgba(255,255,255,0.04)' : `${n.accent}0D`,
        border: `1px solid ${n.read ? 'rgba(255,255,255,0.07)' : n.accent+'28'}`,
      }}>

      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background:`${n.accent}15` }}>
        {n.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-sm font-semibold truncate" style={{ color:'#EEEEFF' }}>{n.title}</p>
          <span className="text-[10px] flex-shrink-0" style={{ color:'rgba(238,238,255,0.28)' }}>{rel(n.ts)}</span>
        </div>
        <p className="text-xs" style={{ color:'rgba(238,238,255,0.4)' }}>{n.message}</p>
      </div>

      <div className="flex flex-col items-center gap-2 flex-shrink-0">
        {!n.read && <div className="w-2 h-2 rounded-full" style={{ background:n.accent }}/>}
        <button onClick={() => onDismiss(n.id)}
          className="w-5 h-5 flex items-center justify-center rounded-lg hover:bg-white/8 transition-colors"
          style={{ color:'rgba(238,238,255,0.2)' }}>
          <X className="w-3.5 h-3.5"/>
        </button>
      </div>
    </motion.div>
  );
}
