import React from 'react';
import { User, Check, Briefcase, Lightbulb, Volume2 } from 'lucide-react';
import { ChatMessage, MentorResponse } from '../types';

interface MessageCardProps {
  message: ChatMessage;
}

const MessageCard: React.FC<MessageCardProps> = ({ message }) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[85%] sm:max-w-[70%]">
          <div className="flex items-center justify-end gap-2 mb-1">
            <span className="text-xs font-medium text-gray-400">Nadir</span>
            <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
              <User size={14} className="text-indigo-600" />
            </div>
          </div>
          <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-sm">
            {message.audioUrl ? (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-full">
                  <Volume2 size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-indigo-200">Audio Message</span>
                  <audio 
                    src={message.audioUrl} 
                    controls 
                    className="h-8 w-48 mt-1 accent-indigo-200 opacity-90"
                  />
                </div>
              </div>
            ) : (
              <p className="leading-relaxed whitespace-pre-wrap">{message.content as string}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const mentorContent = message.content as MentorResponse;

  return (
    <div className="flex justify-start mb-8">
      <div className="max-w-full sm:max-w-[85%] w-full">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-sm font-bold text-teal-700">M</span>
          </div>
          <span className="text-sm font-semibold text-gray-700">Mentor</span>
        </div>

        <div className="bg-white rounded-3xl rounded-tl-sm shadow-md border border-gray-100 overflow-hidden">
          
          {/* Section 1: Corrected Version */}
          <div className="p-5 border-b border-gray-50 bg-gradient-to-r from-teal-50/50 to-transparent">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 bg-teal-100 rounded text-teal-700">
                <Check size={16} strokeWidth={3} />
              </div>
              <h3 className="text-sm font-bold text-teal-900 uppercase tracking-wide">Corrected Version</h3>
            </div>
            <p className="text-gray-800 text-lg leading-relaxed">
              {mentorContent.correctedVersion}
            </p>
          </div>

          {/* Section 2: Professional Version */}
          <div className="p-5 border-b border-gray-50 bg-gradient-to-r from-blue-50/50 to-transparent">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 bg-blue-100 rounded text-blue-700">
                <Briefcase size={16} strokeWidth={2.5} />
              </div>
              <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide">Professional Version</h3>
            </div>
            <p className="text-gray-800 text-lg leading-relaxed font-medium">
              {mentorContent.professionalVersion}
            </p>
          </div>

          {/* Section 3: Mentor Tip (Optional) */}
          {mentorContent.tip && (
            <div className="p-4 bg-yellow-50/80">
              <div className="flex gap-3 items-start">
                <Lightbulb size={20} className="text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" fillOpacity={0.2} />
                <p className="text-amber-800 text-sm italic">
                  <span className="font-semibold not-italic">Mentor Tip: </span>
                  {mentorContent.tip}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageCard;
