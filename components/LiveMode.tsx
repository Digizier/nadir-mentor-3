import React from 'react';
import { X, Mic, Activity } from 'lucide-react';

interface LiveModeProps {
  isOpen: boolean;
  onClose: () => void;
  volume: number; // 0 to 1
  isConnecting: boolean;
}

const LiveMode: React.FC<LiveModeProps> = ({ isOpen, onClose, volume, isConnecting }) => {
  if (!isOpen) return null;

  // Scale volume for visualization
  const scale = 1 + Math.min(volume * 2, 0.5); 

  return (
    <div className="fixed inset-0 z-50 bg-indigo-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-white transition-opacity duration-300">
      <div className="absolute top-6 right-6">
        <button 
          onClick={onClose}
          className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md px-6">
        <h2 className="text-2xl font-bold mb-2">Live Mentor Session</h2>
        <p className="text-indigo-200 mb-12 text-center">
          Speak naturally. I'm listening and ready to help.
        </p>

        <div className="relative mb-12">
          {/* Pulse Effects */}
          {isConnecting ? (
            <div className="relative flex items-center justify-center">
                <div className="w-24 h-24 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-xs uppercase tracking-widest text-indigo-300 animate-pulse">
                    Connecting
                </div>
            </div>
          ) : (
            <div className="relative flex items-center justify-center w-64 h-64">
                {/* Outer Rings */}
                <div 
                    className="absolute w-full h-full bg-indigo-500/20 rounded-full blur-xl transition-transform duration-100 ease-out"
                    style={{ transform: `scale(${scale * 1.5})` }}
                />
                <div 
                    className="absolute w-48 h-48 bg-indigo-500/30 rounded-full blur-lg transition-transform duration-100 ease-out"
                    style={{ transform: `scale(${scale * 1.2})` }}
                />
                
                {/* Core Circle */}
                <div className="relative w-32 h-32 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full shadow-2xl flex items-center justify-center z-10 transition-transform duration-100"
                     style={{ transform: `scale(${1 + volume * 0.2})` }}
                >
                    <Mic size={48} className="text-white opacity-90" />
                </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm font-medium text-indigo-300 bg-black/20 px-4 py-2 rounded-full">
            <Activity size={16} className={isConnecting ? "" : "animate-pulse"} />
            {isConnecting ? "Establishing Connection..." : "Listening to you"}
        </div>
      </div>
      
      <div className="pb-12 text-xs text-indigo-400/60">
        Powered by Gemini Live
      </div>
    </div>
  );
};

export default LiveMode;
