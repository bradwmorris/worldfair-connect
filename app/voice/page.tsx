"use client";
import { useEffect, useRef, useState } from "react";
import { RTVIClient } from "@pipecat-ai/client-js";
import { SmallWebRTCTransport } from "@pipecat-ai/small-webrtc-transport";

export default function Voice() {
  const clientRef = useRef<RTVIClient | null>(null);
  const [listening, setListening] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_PIPECAT_BASE_URL!; // e.g. http://localhost:7860
    const wsUrl = process.env.NEXT_PUBLIC_PIPECAT_WS_URL!; // e.g. ws://localhost:7860/voice
    const client = new RTVIClient({
      transport: new SmallWebRTCTransport({
        // No 'url' property here; wsUrl is handled internally by the SDK
      }),
      params: {
        baseUrl,
        endpoints: {
          connect: "/connect",
        },
      },
    });
    clientRef.current = client;
    client.connect().then(() => setConnected(true));
    return () => {
      client.disconnect();
      setConnected(false);
    };
  }, []);

  const handleTalk = () => {
    if (!clientRef.current) return;
    if (listening) {
      clientRef.current.enableMic(false);
      setListening(false);
    } else {
      clientRef.current.enableMic(true);
      setListening(true);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: 40 }}>
      <button
        onClick={handleTalk}
        disabled={!connected}
        style={{ fontSize: 24, padding: "1em 2em" }}
      >
        {listening ? "🛑 Stop" : "🎤 Talk"}
      </button>
      <div style={{ marginTop: 20, fontSize: 18 }}>
        Status: {connected ? (listening ? "Listening..." : "Idle") : "Connecting..."}
      </div>
    </div>
  );
}