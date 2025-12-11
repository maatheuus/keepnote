import React, { useState, useRef } from 'react';
import { Microphone, Stop, CircleNotch, Trash } from '@phosphor-icons/react';
import { transcribeAudio } from '../services/geminiService';

interface AudioRecorderProps {
  onAudioReady: (base64: string, transcript: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioReady }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        // Convert to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64String = reader.result as string;
          setIsProcessing(true);
          
          try {
            // Send to Gemini for transcription
            const transcript = await transcribeAudio(base64String, 'audio/webm');
            onAudioReady(base64String, transcript);
          } catch (err) {
            console.error("Transcription failed", err);
          } finally {
            setIsProcessing(false);
          }
        };
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      {!isRecording && !isProcessing && (
        <button
          type="button"
          onClick={startRecording}
          className="p-2 rounded-full bg-paper hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-alert transition-colors"
          title="Record Audio Note"
        >
          <Microphone size={20} weight="bold" />
        </button>
      )}

      {isRecording && (
        <button
          type="button"
          onClick={stopRecording}
          className="p-2 rounded-full bg-alert text-white animate-pulse"
          title="Stop Recording"
        >
          <Stop size={20} weight="fill" />
        </button>
      )}

      {isProcessing && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <CircleNotch size={20} className="animate-spin text-marker" />
          <span>Transcribing with Gemini...</span>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
