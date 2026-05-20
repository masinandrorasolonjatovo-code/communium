"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, Monitor, Phone, X } from "lucide-react";

interface CallProps {
  conversationId: string;
  callId: string;
  remoteUserName: string;
  onEndCall: () => void;
}

export default function CallInterface({
  conversationId,
  callId,
  remoteUserName,
  onEndCall,
}: CallProps) {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Démarrer le timer
    durationIntervalRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Initialiser les flux vidéo
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: !isVideoOff,
          audio: !isMuted,
        });

        if (localVideoRef.current && !isVideoOff) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Erreur d'accès à la caméra/micro:", error);
      }
    };

    initializeMedia();
  }, [isMuted, isVideoOff]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}:${String(secs).padStart(2, "0")}`;
    }

    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleEndCall = async () => {
    // Arrêter les flux
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }

    // Notifier le backend
    try {
      await fetch(`http://localhost:5000/api/module4/calls/${callId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          endedAt: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error("Erreur lors de la fin de l'appel:", error);
    }

    onEndCall();
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white relative">
      {/* Remote Video Stream (Full Screen) */}
      <div ref={remoteVideoRef} className="flex-1 bg-gray-900 relative flex items-center justify-center">
        {/* Placeholder pour le flux vidéo du correspondant */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4"></div>
          <h2 className="text-2xl font-semibold">{remoteUserName}</h2>
          <p className="text-gray-400">📞 Appel Vidéo En Cours</p>
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute bottom-20 right-4 w-32 h-40 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <p className="absolute bottom-1 left-1 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
            Ta caméra
          </p>
        </div>

        {/* Duration */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-xl font-semibold">
          Durée : {formatDuration(duration)}
        </div>

        {/* Title */}
        <div className="absolute top-4 right-4 text-sm text-gray-400">
          📹 Appel Vidéo En Cours
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-950 border-t border-gray-700 p-6 flex justify-center items-center gap-6">
        {/* Mute Button */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-4 rounded-full transition ${
            isMuted
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-gray-800 hover:bg-gray-700 text-white"
          }`}
          title={isMuted ? "Activer le micro" : "Désactiver le micro"}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        {/* Video Toggle */}
        <button
          onClick={() => setIsVideoOff(!isVideoOff)}
          className={`p-4 rounded-full transition ${
            isVideoOff
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-gray-800 hover:bg-gray-700 text-white"
          }`}
          title={isVideoOff ? "Activer la caméra" : "Désactiver la caméra"}
        >
          {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </button>

        {/* Screen Share */}
        <button
          onClick={() => setIsScreenSharing(!isScreenSharing)}
          className={`p-4 rounded-full transition ${
            isScreenSharing
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-800 hover:bg-gray-700 text-white"
          }`}
          title={isScreenSharing ? "Arrêter le partage" : "Partager l'écran"}
        >
          <Monitor size={24} />
        </button>

        {/* End Call (Red) */}
        <button
          onClick={handleEndCall}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition"
          title="Quitter l'appel"
        >
          <Phone size={24} className="transform rotate-135" />
        </button>
      </div>

      {/* Control Labels */}
      <div className="bg-gray-950 px-6 pb-4 flex justify-center gap-8 text-xs text-gray-400">
        <span>{isMuted ? "🔇 Muté" : "🎤 Micro activé"}</span>
        <span>{isVideoOff ? "📴 Caméra Off" : "📹 Caméra On"}</span>
        <span>{isScreenSharing ? "📲 Partage actif" : "📲 Partage"}</span>
      </div>
    </div>
  );
}
