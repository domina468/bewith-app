import { useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import type { ParticipantState } from '../hooks/useDaily';

const GRADIENTS = [
  'linear-gradient(135deg,#7C65F5,#5BA4F5)',
  'linear-gradient(135deg,#F472B6,#A78BFA)',
  'linear-gradient(135deg,#34D399,#5BA4F5)',
  'linear-gradient(135deg,#FBBF24,#F472B6)',
  'linear-gradient(135deg,#5BA4F5,#34D399)',
];

interface VideoTileProps {
  participant: ParticipantState;
  index: number;
  mood?: string;
}

export function VideoTile({ participant, index, mood }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const gradient = GRADIENTS[index % GRADIENTS.length];

  useEffect(() => {
    if (!videoRef.current || !participant.videoTrack) return;
    const stream = new MediaStream([participant.videoTrack]);
    videoRef.current.srcObject = stream;
    return () => { if (videoRef.current) videoRef.current.srcObject = null; };
  }, [participant.videoTrack]);

  const showVideo = participant.videoOn && !!participant.videoTrack;
  const initial = participant.userName.charAt(0).toUpperCase();

  return (
    <div className="aspect-[3/4] rounded-3xl overflow-hidden relative" style={{
      background: showVideo ? '#000' : gradient,
      boxShadow: participant.isLocal
        ? '0 0 0 2px rgba(124,101,245,0.6), 0 8px 32px rgba(0,0,0,0.5)'
        : '0 4px 20px rgba(0,0,0,0.4)',
    }}>
      {/* Video stream */}
      {showVideo && (
        <video
          ref={videoRef}
          autoPlay muted={participant.isLocal} playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Avatar fallback */}
      {!showVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white bg-black/20">
            {initial}
          </div>
          {mood && <p className="text-white/60 text-xs">{mood}</p>}
        </div>
      )}

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between"
        style={{ background:'linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 100%)' }}>
        <span className="text-white text-xs font-semibold px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-sm truncate max-w-[70%]">
          {participant.isLocal ? 'You' : participant.userName}
        </span>
        <div className="flex items-center gap-1">
          {participant.audioOn
            ? <Mic className="w-3 h-3 text-emerald-400"/>
            : <MicOff className="w-3 h-3 text-red-400"/>
          }
          {!participant.videoOn && <VideoOff className="w-3 h-3 text-white/40"/>}
        </div>
      </div>

      {/* Local indicator */}
      {participant.isLocal && (
        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
          style={{ background:'rgba(124,101,245,0.6)', backdropFilter:'blur(4px)' }}>
          You
        </div>
      )}
    </div>
  );
}
