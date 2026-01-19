import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { SYSTEM_INSTRUCTION } from '../services/geminiService';
import { convertFloat32ToInt16, encodeAudioChunk, decodeAudioChunk } from '../utils/audioUtils';

interface UseLiveSessionReturn {
  isConnected: boolean;
  isConnecting: boolean;
  isError: boolean;
  errorMessage: string;
  volume: number; // For visualization (0-1)
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const useLiveSession = (): UseLiveSessionReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [volume, setVolume] = useState(0);

  // Refs for cleanup
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sessionRef = useRef<any>(null); // Type is ambiguous in SDK for now
  
  // Playback refs
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      // sessionRef.current.close() might not exist depending on SDK version or it might be async.
      // The guidelines say `session.close()`.
      try {
        sessionRef.current.close();
      } catch (e) {
        console.warn("Error closing session:", e);
      }
      sessionRef.current = null;
    }

    // Stop Microphone
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop Output
    scheduledSourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    scheduledSourcesRef.current.clear();
    
    if (outputContextRef.current) {
      outputContextRef.current.close();
      outputContextRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setVolume(0);
  }, []);

  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    setIsError(false);
    setErrorMessage('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Initialize Audio Contexts
      // Input: 16kHz as per guidelines recommendation for input
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = inputCtx;
      
      // Output: 24kHz as per guidelines recommendation for output
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputContextRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      // Request Mic
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Setup Gemini Live Connection
      // Using the model from guidelines: gemini-2.5-flash-native-audio-preview-09-2025
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: async () => {
            console.log("Live Session Opened");
            setIsConnected(true);
            setIsConnecting(false);

            // Start Audio Stream
            const source = inputCtx.createMediaStreamSource(stream);
            sourceRef.current = source;
            
            // Buffer size 4096, 1 input channel, 1 output channel
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate volume for visualizer
              let sum = 0;
              for(let i=0; i<inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              setVolume(Math.min(1, rms * 5)); // Boost generic sensitivity

              // Convert to PCM and Send
              const pcmInt16 = convertFloat32ToInt16(inputData);
              const base64Data = encodeAudioChunk(pcmInt16);
              
              sessionPromise.then(session => {
                  session.sendRealtimeInput({
                      media: {
                          mimeType: 'audio/pcm;rate=16000',
                          data: base64Data
                      }
                  });
              });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
             // Handle Audio Output
             const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio && outputCtx) {
                 const rawBytes = decodeAudioChunk(base64Audio);
                 
                 // Decode PCM manually because Web Audio decodeAudioData expects file headers (WAV/MP3)
                 // The API sends raw PCM (Int16, 24kHz likely based on model config)
                 // But wait, guidelines say: "audio bytes returned by the API is raw PCM data... contains no header information"
                 // And guideline provides `decodeAudioData` implementation.
                 
                 const dataInt16 = new Int16Array(rawBytes.buffer);
                 const buffer = outputCtx.createBuffer(1, dataInt16.length, 24000);
                 const channelData = buffer.getChannelData(0);
                 for (let i = 0; i < dataInt16.length; i++) {
                     channelData[i] = dataInt16[i] / 32768.0;
                 }
                 
                 // Schedule Playback
                 const source = outputCtx.createBufferSource();
                 source.buffer = buffer;
                 source.connect(outputCtx.destination);
                 
                 // Ensure gapless playback
                 const now = outputCtx.currentTime;
                 // If we fell behind, reset start time to now
                 const startTime = Math.max(nextStartTimeRef.current, now);
                 source.start(startTime);
                 nextStartTimeRef.current = startTime + buffer.duration;
                 
                 scheduledSourcesRef.current.add(source);
                 source.onended = () => {
                     scheduledSourcesRef.current.delete(source);
                 };
             }

             // Handle Interruption
             if (msg.serverContent?.interrupted) {
                 console.log("Interrupted");
                 scheduledSourcesRef.current.forEach(s => {
                     try { s.stop(); } catch(e) {}
                 });
                 scheduledSourcesRef.current.clear();
                 nextStartTimeRef.current = 0;
             }
          },
          onclose: () => {
             console.log("Live Session Closed");
             disconnect();
          },
          onerror: (err) => {
             console.error("Live Session Error:", err);
             setErrorMessage("Connection error");
             setIsError(true);
             disconnect();
          }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            },
            systemInstruction: SYSTEM_INSTRUCTION
        }
      });

      sessionRef.current = await sessionPromise;

    } catch (err: any) {
      console.error("Failed to connect:", err);
      setErrorMessage(err.message || "Failed to start session");
      setIsError(true);
      setIsConnecting(false);
      disconnect();
    }
  }, [disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    isError,
    errorMessage,
    volume,
    connect,
    disconnect
  };
};
