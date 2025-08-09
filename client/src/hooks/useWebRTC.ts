import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAppContext } from './useAppContext';
import { useWebSocket } from './useWebSocket';

type RemoteStreamsMap = Map<string, MediaStream>;

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:global.stun.twilio.com:3478',
      ],
    },
  ],
};

type ZoneName = string | null | undefined;

export function useWebRTC(currentZone: ZoneName) {
  const { currentUser, users } = useAppContext();
  const { send, on, off } = useWebSocket();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const remoteStreamsRef = useRef<RemoteStreamsMap>(new Map());
  const [version, setVersion] = useState(0);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteZonesRef = useRef<Map<string, ZoneName>>(new Map());

  const remoteStreams = useMemo(() => {
    return Array.from(remoteStreamsRef.current.entries()).map(
      ([userId, stream]) => ({ userId, stream })
    );
  }, [version]);

  const bump = () => setVersion((n) => (n + 1) % 1_000_000);

  const getSameZonePeerIds = useCallback((): string[] => {
    if (!currentZone) return [];
    const ids: string[] = [];
    if (users) {
      users.forEach((u, id) => {
        if (id === currentUser?.id) return;
        const z = (u as any).zone ?? remoteZonesRef.current.get(id) ?? null;
        if (z === currentZone) ids.push(id);
      });
    }
    return ids;
  }, [currentZone, users, currentUser?.id]);

  const ensureLocalMedia = useCallback(async () => {
    if (!audioEnabled && !videoEnabled) {
      if (localStream) localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
      return null;
    }

    if (localStream) {
      const hasA = localStream.getAudioTracks().length > 0;
      const hasV = localStream.getVideoTracks().length > 0;
      const needA = audioEnabled && !hasA;
      const needV = videoEnabled && !hasV;
      if (!needA && !needV) {
        localStream.getAudioTracks().forEach((t) => (t.enabled = audioEnabled));
        localStream.getVideoTracks().forEach((t) => (t.enabled = videoEnabled));
        return localStream;
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioEnabled,
        video: videoEnabled,
      });
      if (localStream) localStream.getTracks().forEach((t) => t.stop());
      stream.getAudioTracks().forEach((t) => (t.enabled = audioEnabled));
      stream.getVideoTracks().forEach((t) => (t.enabled = videoEnabled));
      setLocalStream(stream);
      setError(null);
      return stream;
    } catch (e: any) {
      console.error('getUserMedia error:', e);
      setError(e?.message || 'Failed to acquire media');
      setLocalStream(null);
      return null;
    }
  }, [audioEnabled, videoEnabled, localStream]);

  const closePeer = useCallback((peerId: string) => {
    const pc = peersRef.current.get(peerId);
    if (pc) {
      try {
        pc.ontrack = null;
        pc.onicecandidate = null;
        pc.onconnectionstatechange = null;
        pc.close();
      } catch (error) {
        console.error('Error closing peer connection:', error);
      }
      peersRef.current.delete(peerId);
    }
    const stream = remoteStreamsRef.current.get(peerId);
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      remoteStreamsRef.current.delete(peerId);
      bump();
    }
  }, []);

  const closeAllPeers = useCallback(() => {
    Array.from(peersRef.current.keys()).forEach(closePeer);
  }, [closePeer]);

  const createPeer = useCallback(
    (peerId: string): RTCPeerConnection => {
      let pc = peersRef.current.get(peerId);
      if (pc) return pc;

      pc = new RTCPeerConnection(RTC_CONFIG);

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          try {
            pc!.addTrack(track, localStream);
          } catch (error) {
            console.error('Error adding track to peer connection:', error);
          }
        });
      }

      pc.ontrack = (event) => {
        const existing = remoteStreamsRef.current.get(peerId);
        if (existing) {
          event.streams.forEach((s) =>
            s.getTracks().forEach((t) => {
              if (!existing.getTracks().find((x) => x.id === t.id))
                existing.addTrack(t);
            })
          );
          remoteStreamsRef.current.set(peerId, existing);
        } else {
          const stream = new MediaStream();
          event.streams.forEach((s) =>
            s.getTracks().forEach((t) => stream.addTrack(t))
          );
          remoteStreamsRef.current.set(peerId, stream);
        }
        bump();
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          send('ice-candidate', {
            targetUserId: peerId,
            candidate: e.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        const st = pc!.connectionState;
        if (st === 'failed' || st === 'disconnected' || st === 'closed') {
          closePeer(peerId);
        }
      };

      peersRef.current.set(peerId, pc);
      return pc;
    },
    [localStream, send, closePeer]
  );

  const makeOffer = useCallback(
    async (peerId: string) => {
      const pc = createPeer(peerId);
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);
        send('offer', {
          targetUserId: peerId,
          sdp: offer.sdp,
          type: offer.type,
        });
      } catch (e) {
        console.error('Failed to create/send offer:', e);
      }
    },
    [createPeer, send]
  );

  const handleOffer = useCallback(
    async (fromUserId: string, sdp: string, type: RTCSdpType) => {
      const pc = createPeer(fromUserId);
      try {
        await pc.setRemoteDescription({ sdp, type });
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        send('answer', {
          targetUserId: fromUserId,
          sdp: answer.sdp,
          type: answer.type,
        });
      } catch (e) {
        console.error('Failed to handle offer:', e);
      }
    },
    [createPeer, send]
  );

  const handleAnswer = useCallback(
    async (fromUserId: string, sdp: string, type: RTCSdpType) => {
      const pc = peersRef.current.get(fromUserId);
      if (!pc) return;
      try {
        await pc.setRemoteDescription({ sdp, type });
      } catch (e) {
        console.error('Failed to handle answer:', e);
      }
    },
    []
  );

  const handleRemoteCandidate = useCallback(
    async (fromUserId: string, candidate: RTCIceCandidateInit) => {
      const pc = peersRef.current.get(fromUserId);
      if (!pc) return;
      try {
        await pc.addIceCandidate(candidate);
      } catch (e) {
        console.error('Failed to add ICE candidate:', e);
      }
    },
    []
  );

  const reconcilePeers = useCallback(async () => {
    if (!currentZone) {
      closeAllPeers();
      return;
    }

    await ensureLocalMedia();
    const shouldHave = new Set(getSameZonePeerIds());

    for (const id of shouldHave) {
      if (!peersRef.current.has(id)) {
        await makeOffer(id);
      }
    }

    for (const id of Array.from(peersRef.current.keys())) {
      if (!shouldHave.has(id)) closePeer(id);
    }
  }, [
    currentZone,
    getSameZonePeerIds,
    ensureLocalMedia,
    makeOffer,
    closePeer,
    closeAllPeers,
  ]);

  useEffect(() => {
    reconcilePeers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentZone, audioEnabled, videoEnabled, users]);

  useEffect(() => {
    const onOffer = (msg: any) => {
      const { data } = msg;
      if (!data?.fromUserId || !data?.sdp || !data?.type) return;
      const peerZone =
        remoteZonesRef.current.get(data.fromUserId) ??
        (users?.get(data.fromUserId) as any)?.zone ??
        null;
      if (currentZone && peerZone === currentZone) {
        handleOffer(data.fromUserId, data.sdp, data.type);
      }
    };

    const onAnswer = (msg: any) => {
      const { data } = msg;
      if (!data?.fromUserId || !data?.sdp || !data?.type) return;
      handleAnswer(data.fromUserId, data.sdp, data.type);
    };

    const onIce = (msg: any) => {
      const { data } = msg;
      if (!data?.fromUserId || !data?.candidate) return;
      handleRemoteCandidate(data.fromUserId, data.candidate);
    };

    const onUserLeft = (msg: any) => {
      const { data } = msg;
      if (!data?.userId) return;
      closePeer(data.userId);
      remoteZonesRef.current.delete(data.userId);
    };

    const onZoneEnter = (msg: any) => {
      const { data } = msg;
      if (!data?.userId) return;
      remoteZonesRef.current.set(data.userId, data.zoneName ?? null);
      if (currentZone && data.zoneName === currentZone) reconcilePeers();
    };

    const onZoneExit = (msg: any) => {
      const { data } = msg;
      if (!data?.userId) return;
      remoteZonesRef.current.set(data.userId, null);
      if (peersRef.current.has(data.userId)) closePeer(data.userId);
    };

    const onJoined = (msg: any) => {
      const { data } = msg;
      if (data?.users && Array.isArray(data.users)) {
        for (const u of data.users) {
          if (!u?.id) continue;
          remoteZonesRef.current.set(u.id, (u as any)?.zone ?? null);
        }
      }
      reconcilePeers();
    };

    on('offer', onOffer);
    on('answer', onAnswer);
    on('ice-candidate', onIce);
    on('user-left', onUserLeft);
    on('zone-enter', onZoneEnter);
    on('zone-exit', onZoneExit);
    on('joined', onJoined);

    return () => {
      off('offer', onOffer);
      off('answer', onAnswer);
      off('ice-candidate', onIce);
      off('user-left', onUserLeft);
      off('zone-enter', onZoneEnter);
      off('zone-exit', onZoneExit);
      off('joined', onJoined);
    };
  }, [
    on,
    off,
    users,
    currentZone,
    reconcilePeers,
    handleOffer,
    handleAnswer,
    handleRemoteCandidate,
    closePeer,
  ]);

  const toggleAudio = useCallback(async () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    const stream = await ensureLocalMedia();

    for (const pc of peersRef.current.values()) {
      const senders = pc.getSenders().filter((s) => s.track?.kind === 'audio');
      const track = (stream ?? localStream)?.getAudioTracks()[0];
      if (track) track.enabled = next;
      if (senders.length === 0 && next && track && stream) {
        try {
          pc.addTrack(track, stream);
        } catch (error) {
          console.error('Error adding track to peer connection:', error);
        }
      } else if (!next) {
        for (const s of senders) {
          try {
            pc.removeTrack(s);
          } catch (error) {
            console.error('Error removing track from peer connection:', error);
          }
        }
      }
    }
  }, [audioEnabled, ensureLocalMedia, localStream]);

  const toggleVideo = useCallback(async () => {
    const next = !videoEnabled;
    setVideoEnabled(next);
    const stream = await ensureLocalMedia();

    for (const pc of peersRef.current.values()) {
      const senders = pc.getSenders().filter((s) => s.track?.kind === 'video');
      const track = (stream ?? localStream)?.getVideoTracks()[0];
      if (track) track.enabled = next;
      if (senders.length === 0 && next && track && stream) {
        try {
          pc.addTrack(track, stream);
        } catch (error) {
          console.error('Error adding track to peer connection:', error);
        }
      } else if (!next) {
        for (const s of senders) {
          try {
            pc.removeTrack(s);
          } catch (error) {
            console.error('Error removing track from peer connection:', error);
          }
        }
      }
    }
  }, [videoEnabled, ensureLocalMedia, localStream]);

  useEffect(() => {
    return () => {
      closeAllPeers();
      if (localStream) localStream.getTracks().forEach((t) => t.stop());
    };
  }, [closeAllPeers, localStream]);

  return {
    localStream,
    remoteStreams,
    audioEnabled,
    videoEnabled,
    error,
    toggleAudio,
    toggleVideo,
  };
}
