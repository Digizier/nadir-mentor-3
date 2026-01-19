import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './types';
import { processText, processAudio } from './services/geminiService';
import InputArea from './components/InputArea';
import MessageCard from './components/MessageCard';
import LiveMode from './components/LiveMode';
import { useLiveSession } from './hooks/useLiveSession';
import { Sparkles, MessageSquare, Radio, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Live Session State
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const { isConnected, isConnecting, volume, connect, disconnect, errorMessage } = useLiveSession();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle live session toggle
  const toggleLiveSession = async () => {
    if (isLiveOpen) {
      setIsLiveOpen(false);
      disconnect();
    } else {
      setIsLiveOpen(true);
      await connect();
    }
  };

  const addMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    addMessage(userMsg);
    setIsLoading(true);

    try {
      const response = await processText(text);
      
      const mentorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'mentor',
        content: response,
        timestamp: Date.now(),
      };
      addMessage(mentorMsg);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'mentor',
        content: {
          correctedVersion: "I'm having trouble connecting right now.",
          professionalVersion: "We are currently experiencing technical difficulties. Please try again later.",
          tip: "Check your internet connection."
        },
        timestamp: Date.now()
      };
      addMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAudio = async (audioBlob: Blob, base64: string, mimeType: string) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: "Audio message", // Fallback text
      timestamp: Date.now(),
      audioUrl: audioUrl
    };
    addMessage(userMsg);
    setIsLoading(true);

    try {
      const response = await processAudio(base64, mimeType);
      
      const mentorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'mentor',
        content: response,
        timestamp: Date.now(),
      };
      addMessage(mentorMsg);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'mentor',
        content: {
          correctedVersion: "I couldn't hear that clearly.",
          professionalVersion: "The audio quality was insufficient for analysis. Please try recording again.",
          tip: "Try speaking closer to the microphone."
        },
        timestamp: Date.now()
      };
      addMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Live Mode Overlay */}
      <LiveMode 
        isOpen={isLiveOpen} 
        onClose={toggleLiveSession}
        volume={volume}
        isConnecting={isConnecting}
      />

      {/* Header */}
      <header className="flex-none bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Sparkles className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">Nadir's Mentor</h1>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight sm:hidden">Nadir's Mentor</h1>
            <p className="text-xs text-gray-500 font-medium hidden sm:block">Communication Coach</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleLiveSession}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-100 transition-all border border-rose-100 font-medium text-sm group"
          >
            <div className="relative w-2 h-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </div>
            Start Live Call
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-20 lg:px-64 scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <MessageSquare size={40} className="text-indigo-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-400 mb-2">Hello, Nadir!</h2>
            <p className="text-gray-400 max-w-md mb-8">
              I'm ready to help you polish your English. Type a message, record audio, or start a live call to practice.
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {messages.map((msg) => (
              <MessageCard key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-8">
                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-gray-500 font-medium">Analyzing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Footer / Input Area */}
      <footer className="flex-none bg-white/80 backdrop-blur-md border-t border-gray-200">
        <InputArea 
          onSendMessage={handleSendMessage} 
          onSendAudio={handleSendAudio}
          isLoading={isLoading} 
        />
      </footer>
    </div>
  );
};

export default App;
