import { useState, useEffect, useRef, useCallback } from 'react';
import DailyIframe, { type DailyCall, type DailyParticipant } from '@daily-co/daily-js';

export type ParticipantState = {
  sessionId: string;
  userName: string;
  isLocal: boolean;
  videoOn: boolean;
  audioOn: boolean;
  videoTrack: MediaStreamTrack | null;
  audioTrack: MediaStreamTrack | null;
};

export type CallState = 'idle' | 'joining' | 'joined' | 'error';

function toParticipantState(p: DailyParticipant): ParticipantState {
  return {
    sessionId: p.session_id,
    userName: (p.user_name as string) || 'Guest',
    isLocal: p.local,
    videoOn: !!p.video,
    audioOn: !!p.audio,
    videoTrack: p.tracks?.video?.persistentTrack ?? null,
    audioTrack: p.tracks?.audio?.persistentTrack ?? null,
  };
}

export function useDaily() {
  const callRef = useRef<DailyCall | null>(null);
  const [callState, setCallState] = useState<CallState>('idle');
  const [participants, setParticipants] = useState<ParticipantState[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refreshParticipants = useCallback(() => {
    if (!callRef.current) return;
    const all = callRef.current.participants();
    setParticipants(Object.values(all).map(toParticipantState));
  }, []);

  const join = useCallback(async (roomUrl: string, token: string, userName: string) => {
    setCallState('joining');
    setError(null);
    try {
      const call = DailyIframe.createCallObject({
        audioSource: true,
        videoSource: true,
        dailyConfig: { experimentalChromeVideoMuteLightOff: true },
      });
      callRef.current = call;

      call.on('joined-meeting',    refreshParticipants);
      call.on('participant-joined', refreshParticipants);
      call.on('participant-updated', refreshParticipants);
      call.on('participant-left',  refreshParticipants);
      call.on('track-started',     refreshParticipants);
      call.on('track-stopped',     refreshParticipants);
      call.on('error', (e: any) => {
        setError(e?.errorMsg ?? 'Call error');
        setCallState('error');
      });

      await call.join({ url: roomUrl, token, userName });
      setCallState('joined');
    } catch (e: any) {
      setError(e.message ?? 'Failed to join');
      setCallState('error');
    }
  }, [refreshParticipants]);

  const leave = useCallback(async () => {
    if (!callRef.current) return;
    await callRef.current.leave();
    callRef.current.destroy();
    callRef.current = null;
    setCallState('idle');
    setParticipants([]);
  }, []);

  const toggleMic = useCallback(async () => {
    if (!callRef.current) return;
    const local = callRef.current.localAudio();
    await callRef.current.setLocalAudio(!local);
    refreshParticipants();
  }, [refreshParticipants]);

  const toggleCamera = useCallback(async () => {
    if (!callRef.current) return;
    const local = callRef.current.localVideo();
    await callRef.current.setLocalVideo(!local);
    refreshParticipants();
  }, [refreshParticipants]);

  const localParticipant = participants.find(p => p.isLocal) ?? null;

  useEffect(() => {
    return () => {
      if (callRef.current) {
        callRef.current.destroy();
        callRef.current = null;
      }
    };
  }, []);

  return { callState, participants, localParticipant, error, join, leave, toggleMic, toggleCamera };
}
