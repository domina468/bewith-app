import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Bell, Flame, Plus, Users, ChevronRight, Settings } from 'lucide-react';

interface Room {
  id: string; name: string; category: string; description: string;
  currentUsers: number; maxUsers: number; imageUrl: string;
  isActive: boolean; isFavorite?: boolean;
}

interface HomeScreenProps {
  user: { username: string; email: string; streak?: number };
  rooms?: Room[];
  onJoinRoom: (room: Room) => void;
  onProfileClick: () => void;
  onNotificationsClick: () => void;
  onCreateRoom: () => void;
  onSettingsClick: () => void;
}

const CAT_CFG: Record<string, { emoji: string; color: string; glow: string }> = {
  Study:    { emoji: '📖', color: '#93C5FD', glow: 'rgba(147,197,253,0.25)' },
  Work:     { emoji: '💼', color: '#A78BFA', glow: 'rgba(167,139,250,0.25)' },
  Cleaning: { emoji: '✨', color: '#34D399', glow: 'rgba(52,211,153,0.25)'  },
  Morning:  { emoji: '🌅', color: '#FBBF24', glow: 'rgba(251,191,36,0.25)'  },
  Relax:    { emoji: '🎵', color: '#F472B6', glow: 'rgba(244,114,182,0.25)' },
};

const MOCK_ROOMS: Room[] = [
  { id:'1', name:'Study Together',  category:'Study',    description:'Focus alongside others in silence or soft music', currentUsers:12, maxUsers:50,  imageUrl:'https://images.unsplash.com/photo-1763890965393-1cea435581ab?w=800&q=80', isActive:true,  isFavorite:true },
  { id:'2', name:'Deep Work',       category:'Work',     description:'Accountability sessions for focused deep work',   currentUsers:24, maxUsers:100, imageUrl:'https://images.unsplash.com/photo-1675434301703-6b7b9ca9f28d?w=800&q=80', isActive:true  },
  { id:'3', name:'Cleaning Vibes',  category:'Cleaning', description:'Get motivated to tidy up together',               currentUsers:8,  maxUsers:30,  imageUrl:'https://images.unsplash.com/photo-1758272422189-b10f36fd4ddd?w=800&q=80', isActive:true  },
  { id:'4', name:'Morning Routine', category:'Morning',  description:'Start your day alongside early risers',           currentUsers:5,  maxUsers:20,  imageUrl:'https://images.unsplash.com/photo-1617037201980-ddc9c1ebbd83?w=800&q=80', isActive:false },
  { id:'5', name:'Chill & Music',   category:'Relax',    description:'Unwind with ambient sounds and good company',     currentUsers:18, maxUsers:50,  imageUrl:'https://images.unsplash.com/photo-1543244916-b3da1ba6252c?w=800&q=80', isActive:true,  isFavorite:true },
];

const CATEGORIES = ['All', 'Study', 'Work', 'Cleaning', 'Morning', 'Relax'];

export function HomeScreen({ user, rooms, onJoinRoom, onProfileClick, onNotificationsClick, onCreateRoom, onSettingsClick }: HomeScreenProps) {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [searchFocus, setSearchFocus] = useState(false);

  const allRooms = rooms?.length ? rooms : MOCK_ROOMS;
  const totalLive = allRooms.filter(r => r.isActive).reduce((a, r) => a + r.currentUsers, 0);

  const filtered = allRooms.filter(r => {
    const q = query.toLowerCase();
    return (!q || r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q))
        && (!cat || cat === 'All' || r.category === cat);
  });

  const hero = allRooms.find(r => r.isActive && r.currentUsers >= 12) ?? allRooms[0];
  const rest  = filtered.filter(r => r.id !== hero?.id || !!query || !!cat);
  const favs  = allRooms.filter(r => r.isFavorite && r.id !== hero?.id);

  return (
    <div className="min-h-screen" style={{ background: '#080B12' }}>

      {/* ── Subtle top glow ── */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 h-64 z-0"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,101,245,0.14) 0%, transparent 70%)' }}/>

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 px-5 py-3.5"
        style={{ background: 'rgba(8,11,18,0.82)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="max-w-xl mx-auto flex items-center gap-3">
          {/* Avatar */}
          <button onClick={onProfileClick} className="flex-shrink-0 relative">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg,#7C65F5,#5BA4F5)' }}>
              {user.username[0].toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: '#080B12', background: '#34D399' }}/>
          </button>

          {/* Name + streak */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-none truncate" style={{ color: '#EEEEFF' }}>
              {user.username}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <Flame className="w-3 h-3 text-amber-400"/>
              <span className="text-xs" style={{ color: 'rgba(238,238,255,0.38)' }}>{user.streak ?? 3} day streak</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <HeaderBtn onClick={onSettingsClick}><Settings className="w-4 h-4"/></HeaderBtn>
            <HeaderBtn onClick={onNotificationsClick} dot>
              <Bell className="w-4 h-4"/>
            </HeaderBtn>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-xl mx-auto px-4 pb-28 pt-5 space-y-4">

        {/* ── Live pill ── */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
          className="flex items-center justify-between px-4 py-3 rounded-2xl"
          style={{ background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.18)' }}>
          <div className="flex items-center gap-2.5">
            <div className="relative flex-shrink-0">
              <div className="w-2 h-2 rounded-full" style={{ background:'#34D399' }}/>
              <div className="bw-live-ring absolute inset-0 rounded-full" style={{ background:'#34D399' }}/>
            </div>
            <p className="text-sm font-semibold" style={{ color:'#34D399' }}>
              {totalLive} people present right now
            </p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background:'rgba(52,211,153,0.15)', color:'#34D399' }}>Live</span>
        </motion.div>

        {/* ── Search ── */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.05 }} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: searchFocus ? '#7C65F5' : 'rgba(238,238,255,0.28)' }}/>
          <input value={query} onChange={e => setQuery(e.target.value)}
            onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)}
            placeholder="Search rooms…"
            className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm transition-all duration-200 focus:outline-none"
            style={{
              background: searchFocus ? 'rgba(124,101,245,0.08)' : 'rgba(255,255,255,0.06)',
              border: `1.5px solid ${searchFocus ? 'rgba(124,101,245,0.5)' : 'rgba(255,255,255,0.08)'}`,
              color: '#EEEEFF',
              boxShadow: searchFocus ? '0 0 0 3px rgba(124,101,245,0.12)' : 'none',
            }}/>
        </motion.div>

        {/* ── Category pills ── */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-4 px-4" style={{ scrollbarWidth:'none' }}>
          {CATEGORIES.map(c => {
            const cfg = CAT_CFG[c];
            const active = cat === c || (c === 'All' && !cat);
            return (
              <button key={c} onClick={() => setCat(c === 'All' ? null : c)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-sm font-medium transition-all duration-200"
                style={{
                  background: active ? (cfg ? `${cfg.glow}` : 'rgba(124,101,245,0.18)') : 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${active ? (cfg?.color ?? '#7C65F5') + '55' : 'rgba(255,255,255,0.07)'}`,
                  color:  active ? (cfg?.color ?? '#C4B5FD') : 'rgba(238,238,255,0.38)',
                }}>
                {cfg?.emoji ?? '✦'} {c}
              </button>
            );
          })}
        </div>

        {/* ── Hero room ── */}
        <AnimatePresence>
          {!query && !cat && hero && (
            <motion.div key="hero"
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              transition={{ delay:0.1, duration:0.55, ease:[0.22,1,0.36,1] }}
            >
              <SectionLabel>Most Active</SectionLabel>
              <HeroCard room={hero} onJoin={onJoinRoom}/>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Favourites ── */}
        {!query && !cat && favs.length > 0 && (
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.18 }}>
            <SectionLabel>Your Favourites</SectionLabel>
            <div className="space-y-2.5">
              {favs.map((r, i) => <RoomRow key={r.id} room={r} onJoin={onJoinRoom} index={i}/>)}
            </div>
          </motion.div>
        )}

        {/* ── All rooms ── */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.22 }}>
          {(query || cat) ? (
            <div className="flex items-center justify-between mb-3">
              <SectionLabel inline>{query ? `"${query}"` : cat}</SectionLabel>
              <span className="text-xs" style={{ color:'rgba(238,238,255,0.28)' }}>{filtered.length} rooms</span>
            </div>
          ) : (
            <SectionLabel>All Rooms</SectionLabel>
          )}

          <div className="space-y-2.5">
            {(query || cat ? filtered : rest).map((r, i) => (
              <RoomRow key={r.id} room={r} onJoin={onJoinRoom} index={i}/>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">🌌</p>
              <p className="text-sm font-semibold" style={{ color:'#EEEEFF' }}>No rooms found</p>
              <p className="text-xs mt-1" style={{ color:'rgba(238,238,255,0.35)' }}>Try different search or create a new one</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── FAB ── */}
      <motion.button
        whileHover={{ scale:1.07 }} whileTap={{ scale:0.94 }}
        onClick={onCreateRoom}
        className="fixed bottom-6 right-5 z-30 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl"
        style={{
          background: 'linear-gradient(135deg,#7C65F5,#5BA4F5)',
          boxShadow: '0 8px 32px rgba(124,101,245,0.45)',
        }}
      >
        <Plus className="w-6 h-6"/>
      </motion.button>
    </div>
  );
}

/* ─── Sub-components ────────────────────────────── */

function HeaderBtn({ onClick, dot, children }: { onClick:()=>void; dot?:boolean; children:React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/8"
      style={{ color:'rgba(238,238,255,0.45)' }}>
      {children}
      {dot && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-400"/>}
    </button>
  );
}

function SectionLabel({ children, inline }: { children: React.ReactNode; inline?: boolean }) {
  const cls = "text-xs font-semibold uppercase tracking-widest mb-3";
  const style = { color:'rgba(238,238,255,0.3)', letterSpacing:'0.1em' };
  return inline
    ? <span className={cls} style={style}>{children}</span>
    : <p className={cls} style={style}>{children}</p>;
}

function HeroCard({ room, onJoin }: { room:Room; onJoin:(r:Room)=>void }) {
  const cfg = CAT_CFG[room.category];
  const pct = Math.round((room.currentUsers / room.maxUsers) * 100);
  return (
    <motion.div
      whileHover={{ scale:1.01, y:-2 }} whileTap={{ scale:0.99 }}
      onClick={() => onJoin(room)}
      className="relative rounded-3xl overflow-hidden cursor-pointer"
      style={{
        height: 220,
        boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)`,
      }}
    >
      {/* Photo */}
      <img src={room.imageUrl} alt={room.name} className="absolute inset-0 w-full h-full object-cover"/>

      {/* Overlays */}
      <div className="absolute inset-0"
        style={{ background:'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.05) 100%)' }}/>
      <div className="absolute inset-0"
        style={{ background:'linear-gradient(135deg, rgba(124,101,245,0.12) 0%, transparent 60%)' }}/>

      {/* Live badge */}
      <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
        style={{ background:'rgba(0,0,0,0.45)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.12)' }}>
        <div className="relative">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>
          <div className="bw-live-ring absolute inset-0 rounded-full bg-emerald-400"/>
        </div>
        <span className="text-xs font-semibold text-white">Live</span>
      </div>

      {/* Category */}
      {cfg && (
        <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ background:`${cfg.glow}`, border:`1px solid ${cfg.color}44`, color:cfg.color, backdropFilter:'blur(8px)' }}>
          {cfg.emoji} {room.category}
        </div>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white text-xl font-bold leading-tight mb-0.5 tracking-tight">{room.name}</h3>
        <p className="text-white/60 text-xs mb-3">{room.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {Array.from({ length: Math.min(4, room.currentUsers) }).map((_, i) => (
                <div key={i} className="w-5 h-5 rounded-full border border-black/40 flex items-center justify-center text-[8px] font-bold"
                  style={{ background: ['#7C65F5','#5BA4F5','#34D399','#F472B6'][i] }}>
                  {['S','M','E','J'][i]}
                </div>
              ))}
            </div>
            <span className="text-xs text-white/60">{room.currentUsers} present</span>
          </div>

          {/* Occupancy */}
          <div className="flex items-center gap-2">
            <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.15)' }}>
              <div className="h-full rounded-full" style={{ width:`${pct}%`, background:'linear-gradient(90deg,#7C65F5,#34D399)' }}/>
            </div>
            <span className="text-xs text-white/40">{pct}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RoomRow({ room, onJoin, index }: { room:Room; onJoin:(r:Room)=>void; index:number }) {
  const cfg = CAT_CFG[room.category];
  return (
    <motion.div
      initial={{ opacity:0, y:14 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay: index * 0.05, duration:0.4, ease:[0.22,1,0.36,1] }}
      whileHover={{ scale:1.01, x:2 }} whileTap={{ scale:0.99 }}
      onClick={() => onJoin(room)}
      className="bw-glass bw-glass-hover flex items-center gap-4 p-3.5 rounded-2xl cursor-pointer"
      style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.3)' }}
    >
      {/* Thumbnail */}
      <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
        <img src={room.imageUrl} alt={room.name} className="w-full h-full object-cover"/>
        {!room.isActive && <div className="absolute inset-0" style={{ background:'rgba(8,11,18,0.55)' }}/>}
        {room.isActive && (
          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400"
            style={{ boxShadow:'0 0 4px rgba(52,211,153,0.8)' }}/>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="text-sm font-semibold truncate" style={{ color:'#EEEEFF' }}>{room.name}</h4>
          {!room.isActive && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background:'rgba(255,255,255,0.07)', color:'rgba(238,238,255,0.3)' }}>quiet</span>
          )}
        </div>
        <p className="text-xs truncate mb-1.5" style={{ color:'rgba(238,238,255,0.38)' }}>{room.description}</p>
        <div className="flex items-center gap-2">
          {cfg && (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background:`${cfg.glow}`, color:cfg.color }}>
              {cfg.emoji} {room.category}
            </span>
          )}
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" style={{ color:'rgba(238,238,255,0.28)' }}/>
            <span className="text-xs" style={{ color:'rgba(238,238,255,0.32)' }}>{room.currentUsers}</span>
          </div>
        </div>
      </div>

      <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color:'rgba(238,238,255,0.18)' }}/>
    </motion.div>
  );
}
