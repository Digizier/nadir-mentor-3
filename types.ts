export interface MentorResponse {
  correctedVersion: string;
  professionalVersion: string;
  tip?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'mentor';
  content: string | MentorResponse; // User sends string, Mentor sends structured response
  timestamp: number;
  audioUrl?: string; // If the user sent audio
}

export interface AudioState {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
}
