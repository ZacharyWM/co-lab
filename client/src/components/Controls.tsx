export default function Controls({
  audioEnabled,
  videoEnabled,
  onToggleAudio,
  onToggleVideo,
}: {
  audioEnabled: boolean;
  videoEnabled: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onToggleAudio}
        className={`px-3 py-2 rounded-lg shadow ${
          audioEnabled
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        {audioEnabled ? "Mute" : "Unmute"}
      </button>
      <button
        onClick={onToggleVideo}
        className={`px-3 py-2 rounded-lg shadow ${
          videoEnabled
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        {videoEnabled ? "Stop Video" : "Start Video"}
      </button>
    </div>
  );
}
