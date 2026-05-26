"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Monitor, Phone, Video, VideoOff } from "lucide-react";

interface CallProps {
  conversationId: string;
  callId: string;
  remoteUserName: string;
  onEndCall: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function CallInterface({
  callId,
  remoteUserName,
  onEndCall,
}: CallProps) {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setDuration((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initializeMedia() {
      if (isVideoOff) {
        stopStream();
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: !isMuted,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Impossible d’accéder à la caméra ou au micro", error);
      }
    }

    initializeMedia();

    return () => {
      cancelled = true;
    };
  }, [isMuted, isVideoOff]);

  async function handleEndCall() {
    stopStream();

    try {
      await fetch(`${API_URL}/api/module4/calls/${callId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          endedAt: new Date().toISOString(),
        }),
      });
    } catch {
      // L’appel peut être terminé côté UI même si l’API locale est indisponible.
    }

    onEndCall();
  }

  function stopStream() {
    if (!streamRef.current) return;
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  return (
    <div className="flex h-screen flex-col bg-white text-slate-950">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <p className="text-xs font-bold uppercase text-blue-600">
            Appel vidéo en cours
          </p>
          <h1 className="text-lg font-black">{remoteUserName}</h1>
        </div>
        <p className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
          {formatDuration(duration)}
        </p>
      </div>

      <div className="relative flex-1 bg-slate-100">
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="mx-auto mb-4 grid h-28 w-28 place-items-center rounded-full bg-blue-600 text-3xl font-black text-white">
              {remoteUserName
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join("")}
            </div>
            <h2 className="text-2xl font-black">{remoteUserName}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Connexion sécurisée Communium
            </p>
          </div>
        </div>

        {!isVideoOff && (
          <div className="absolute bottom-5 right-5 h-44 w-32 overflow-hidden rounded-[8px] border border-white bg-slate-900 shadow-xl">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
            />
            <span className="absolute bottom-2 left-2 rounded bg-slate-950/70 px-2 py-1 text-xs font-bold text-white">
              Ma caméra
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setIsMuted((value) => !value)}
            className={`grid h-12 w-12 place-items-center rounded-[8px] ${
              isMuted ? "bg-red-600 text-white" : "bg-slate-100 text-slate-700"
            }`}
            title={isMuted ? "Activer le micro" : "Désactiver le micro"}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          <button
            onClick={() => setIsVideoOff((value) => !value)}
            className={`grid h-12 w-12 place-items-center rounded-[8px] ${
              isVideoOff ? "bg-red-600 text-white" : "bg-slate-100 text-slate-700"
            }`}
            title={isVideoOff ? "Activer la caméra" : "Désactiver la caméra"}
          >
            {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
          </button>

          <button
            onClick={() => setIsScreenSharing((value) => !value)}
            className={`grid h-12 w-12 place-items-center rounded-[8px] ${
              isScreenSharing
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
            title="Partager l’écran"
          >
            <Monitor size={22} />
          </button>

          <button
            onClick={handleEndCall}
            className="inline-flex h-12 items-center gap-2 rounded-[8px] bg-red-600 px-5 font-black text-white hover:bg-red-700"
            title="Quitter l’appel"
          >
            <Phone size={21} />
            Quitter l’appel
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
