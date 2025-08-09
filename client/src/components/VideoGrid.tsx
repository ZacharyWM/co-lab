import { useEffect, useRef } from "react";

type VideoItem = {
  userId: string;
  stream: MediaStream;
};

export default function VideoGrid({
  localStream,
  remoteStreams,
}: {
  localStream: MediaStream | null;
  remoteStreams: VideoItem[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2 w-[420px] max-w-[80vw]">
      {localStream && (
        <VideoTile key="local" stream={localStream} muted label="You" />
      )}
      {remoteStreams.map(({ userId, stream }) => (
        <VideoTile key={userId} stream={stream} label={userId} />
      ))}
    </div>
  );
}

function VideoTile({
  stream,
  muted = false,
  label,
}: {
  stream: MediaStream;
  muted?: boolean;
  label?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if ("srcObject" in el) {
      (el as any).srcObject = stream;
    } else {
      // @ts-expect-error Fallback for very old browsers without HTMLMediaElement.srcObject
      el.src = URL.createObjectURL(stream);
    }
  }, [stream]);

  return (
    <div className="relative rounded-lg overflow-hidden bg-black shadow">
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover aspect-video"
      />
      {label && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1">
          {label}
        </div>
      )}
    </div>
  );
}
