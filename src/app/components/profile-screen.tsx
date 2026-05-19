import { ArrowLeft, Flame, Trophy, Clock, Heart, Target, Sparkles, Star } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileScreenProps {
  user: { username: string; email: string; streak?: number };
  onBack: () => void;
}

const BADGES = [
  { id:'1', name:'First Steps',       emoji:'🎉', earned:true,  progress:null, max:null },
  { id:'2', name:'Consistency King',  emoji:'👑', earned:false, progress:3,    max:7    },
  { id:'3', name:'Social Butterfly',  emoji:'🦋', earned:true,  progress:null, max:null },
  { id:'4', name:'Early Bird',        emoji:'🌅', earned:true,  progress:null, max:null },
  { id:'5', name:'Night Owl',         emoji:'🦉', earned:false, progress:null, max:null },
  { id:'6', name:'Study Champion',    emoji:'📚', earned:false, progress:23,   max:50   },
];

const FAV_ROOMS = [
  { id:'1', name:'Study Together',  cat:'Study',   hours:48, visits:24, emoji:'📖', color:'#93C5FD' },
  { id:'2', name:'Chill & Music',   cat:'Relax',   hours:36, visits:18, emoji:'🎵', color:'#F472B6' },
  { id:'3', name:'Deep Work',       cat:'Work',    hours:28, visits:12, emoji:'💼', color:'#A78BFA' },
];

const INSIGHTS = [
  { label:'Most Active', value:'Evenings', detail:'7–10 PM'         },
  { label:'Top Activity',value:'Study',    detail:'48h total'        },
  { label:'Longest',     value:'3h 45m',  detail:'in Deep Work'     },
  { label:'This Week',   value:'12h 30m', detail:'+2h vs last week' },
];

export function ProfileScreen({ user, onBack }: ProfileScreenProps) {
  const streak  = user.streak ?? 3;
  const earned  = BADGES.filter(b => b.earned);
  const pending = BADGES.filter(b => !b.earned);

  return (
    <div className="min-h-screen" style={{ background:'#080B12' }}>

      {/* Top glow */}
      <div className="pointer-events-none fixed top-0 inset-x-0 h-48 z-0"
        style={{ background:'radial-gradient(ellipse 60% 50% at 50% -5%, rgba(124,101,245,0.2) 0%, transparent 70%)' }}/>

      {/* Header */}
      <header className="sticky top-0 z-20 px-5 py-4 flex items-center gap-3"
        style={{ background:'rgba(8,11,18,0.82)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/8"
          style={{ color:'#A78BFA' }}>
          <ArrowLeft className="w-5 h-5"/>
        </button>
        <h1 className="text-lg font-bold tracking-tight" style={{ color:'#EEEEFF' }}>Profile</h1>
      </header>

      <div className="relative z-10 max-w-md mx-auto px-4 py-5 pb-24 space-y-3.5">

        {/* ── Avatar card ── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          className="bw-glass rounded-3xl p-6 text-center"
          style={{ boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }}>

          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl font-black text-white shadow-2xl mx-auto"
              style={{ background:'linear-gradient(135deg,#7C65F5,#5BA4F5)', boxShadow:'0 12px 40px rgba(124,101,245,0.4)' }}>
              {user.username[0].toUpperCase()}
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background:'rgba(251,191,36,0.15)', border:'1px solid rgba(251,191,36,0.3)' }}>
              <Flame className="w-4.5 h-4.5 text-amber-400"/>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight mb-0.5" style={{ color:'#EEEEFF' }}>{user.username}</h2>
          <p className="text-sm mb-5" style={{ color:'rgba(238,238,255,0.38)' }}>{user.email}</p>

          {/* Streak */}
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl"
            style={{ background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.16)' }}>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400"/>
              <span className="text-sm font-semibold" style={{ color:'rgba(238,238,255,0.8)' }}>Day streak</span>
            </div>
            <div className="text-right">
              <p className="text-xl font-black" style={{ color:'#FBBF24' }}>{streak}</p>
              <p className="text-xs" style={{ color:'rgba(238,238,255,0.3)' }}>in a row</p>
            </div>
          </div>
        </motion.div>

        {/* ── Stats bento ── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.07 }}
          className="grid grid-cols-2 gap-3">
          {[
            { icon:Clock,  label:'Total Time',  value:'112h', color:'#93C5FD', glow:'rgba(147,197,253,0.12)' },
            { icon:Target, label:'Rooms Joined',value:'54',   color:'#34D399', glow:'rgba(52,211,153,0.12)'  },
            { icon:Heart,  label:'Connections', value:'8',    color:'#F472B6', glow:'rgba(244,114,182,0.12)' },
            { icon:Trophy, label:'Badges',      value:`${earned.length}/${BADGES.length}`, color:'#A78BFA', glow:'rgba(167,139,250,0.12)' },
          ].map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.1 + i*0.06 }}
              className="bw-glass rounded-3xl p-4"
              style={{ boxShadow:'0 4px 20px rgba(0,0,0,0.3)' }}>
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center mb-3"
                style={{ background:s.glow }}>
                <s.icon className="w-4.5 h-4.5" style={{ color:s.color }}/>
              </div>
              <p className="text-2xl font-black tracking-tight" style={{ color:'#EEEEFF' }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color:'rgba(238,238,255,0.35)' }}>{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Insights ── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          className="bw-glass rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4" style={{ color:'#A78BFA' }}/>
            <h3 className="text-sm font-bold" style={{ color:'#EEEEFF' }}>Presence Patterns</h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {INSIGHTS.map(ins => (
              <div key={ins.label} className="p-3 rounded-2xl" style={{ background:'rgba(255,255,255,0.04)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                  style={{ color:'rgba(238,238,255,0.28)' }}>{ins.label}</p>
                <p className="text-sm font-bold" style={{ color:'#EEEEFF' }}>{ins.value}</p>
                <p className="text-xs" style={{ color:'rgba(238,238,255,0.32)' }}>{ins.detail}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Favourite rooms ── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.27 }}
          className="bw-glass rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-amber-400"/>
            <h3 className="text-sm font-bold" style={{ color:'#EEEEFF' }}>Favourite Rooms</h3>
          </div>
          <div className="space-y-3">
            {FAV_ROOMS.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3">
                <span className="w-5 text-xs font-black text-center"
                  style={{ color: i===0 ? '#FBBF24' : i===1 ? 'rgba(238,238,255,0.3)' : 'rgba(238,238,255,0.2)' }}>
                  {i+1}
                </span>
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ background:`${r.color}15`, border:`1px solid ${r.color}30` }}>
                  {r.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color:'#EEEEFF' }}>{r.name}</p>
                  <p className="text-xs" style={{ color:'rgba(238,238,255,0.32)' }}>{r.hours}h · {r.visits} visits</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Badges ── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.34 }}
          className="bw-glass rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" style={{ color:'#A78BFA' }}/>
              <h3 className="text-sm font-bold" style={{ color:'#EEEEFF' }}>Badges</h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background:'rgba(167,139,250,0.15)', color:'#A78BFA' }}>
              {earned.length}/{BADGES.length}
            </span>
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2.5" style={{ color:'rgba(238,238,255,0.28)' }}>Earned</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {earned.map(b => (
              <motion.div key={b.id} whileHover={{ scale:1.05, y:-2 }}
                className="p-3 rounded-2xl text-center cursor-default"
                style={{ background:'rgba(167,139,250,0.1)', border:'1px solid rgba(167,139,250,0.2)' }}>
                <div className="text-3xl mb-1.5">{b.emoji}</div>
                <p className="text-xs font-semibold leading-tight" style={{ color:'#C4B5FD' }}>{b.name}</p>
              </motion.div>
            ))}
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2.5" style={{ color:'rgba(238,238,255,0.28)' }}>In Progress</p>
          <div className="space-y-2.5">
            {pending.map(b => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-2xl"
                style={{ background:'rgba(255,255,255,0.03)' }}>
                <span className="text-2xl opacity-35">{b.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold mb-1.5" style={{ color:'rgba(238,238,255,0.6)' }}>{b.name}</p>
                  {b.progress != null && b.max != null && (
                    <>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.07)' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width:`${(b.progress/b.max)*100}%`, background:'linear-gradient(90deg,#7C65F5,#34D399)' }}/>
                      </div>
                      <p className="text-[10px] mt-1" style={{ color:'rgba(238,238,255,0.25)' }}>{b.progress}/{b.max}</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-2xl text-center"
            style={{ background:'linear-gradient(135deg,rgba(124,101,245,0.08),rgba(52,211,153,0.06))' }}>
            <p className="text-xs" style={{ color:'rgba(238,238,255,0.32)' }}>
              Badges celebrate your journey — no pressure, just appreciation.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
