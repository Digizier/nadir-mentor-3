import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Square, Loader2 } from 'lucide-react';
import { blobToBase64, getMimeType } from '../utils/audioUtils';

interface InputAreaProps {
  onSendMessage: (text: string) => void;
  onSendAudio: (audioBlob: Blob, base64Data: string, mimeType: string) => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, onSendAudio, isLoading }) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputText]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const base64 = await blobToBase64(audioBlob);
        onSendAudio(audioBlob, base64, mimeType);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      setRecordingDuration(0);
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleSendText = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="relative flex items-end gap-2 bg-white rounded-3xl shadow-lg border border-gray-100 p-2 transition-all duration-200 focus-within:ring-2 focus-within:ring-indigo-100">
        
        {isRecording ? (
          <div className="flex-1 flex items-center justify-between px-4 py-3 bg-red-50 rounded-2xl animate-pulse">
            <div className="flex items-center gap-2 text-red-600 font-medium">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-bounce"></div>
              Recording... {formatTime(recordingDuration)}
            </div>
            <button
              onClick={stopRecording}
              className="p-2 bg-white text-red-600 rounded-full shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Square size={20} fill="currentColor" />
            </button>
          </div>
        ) : (
          <>
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type or ask for advice..."
              className="flex-1 max-h-32 min-h-[44px] py-3 px-4 bg-transparent border-none focus:ring-0 resize-none text-gray-700 placeholder-gray-400 leading-relaxed"
              rows={1}
              disabled={isLoading}
            />
            
            <div className="flex items-center gap-1 pb-1">
              {inputText.trim() ? (
                <button
                  onClick={handleSendText}
                  disabled={isLoading}
                  className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-md"
                >
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  disabled={isLoading}
                  className="p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 hover:text-indigo-600 disabled:opacity-50 transition-all active:scale-95"
                  title="Record audio"
                >
                  <Mic size={22} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
      <p className="text-center text-xs text-gray-400 mt-2">
        Nadir's personal English mentor. Powered by Gemini.
      </p>
    </div>
  );
};

export default InputArea;
