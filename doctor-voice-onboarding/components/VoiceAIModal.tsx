'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface VoiceAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (formData: any) => void;
}

export default function VoiceAIModal({ isOpen, onClose, onComplete }: VoiceAIModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [conversationLog, setConversationLog] = useState<Array<{ role: string; content: string }>>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const conversationLogRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false; // Single-shot mode
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcriptText = event.results[0][0].transcript;
          console.log('🎤 Captured:', transcriptText);
          
          setTranscript(transcriptText);
          
          if (sessionIdRef.current) {
            handleUserSpeech(transcriptText, sessionIdRef.current);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.log('Speech recognition error:', event.error);
          setIsListening(false);
          
          if (event.error === 'no-speech') {
            // User didn't speak, restart
            if (sessionActive && !isSpeaking && !isProcessing) {
              scheduleRestart();
            }
          } else if (event.error === 'audio-capture') {
            toast.error('Microphone not detected.');
          } else if (event.error === 'not-allowed') {
            toast.error('Microphone permission denied.');
            setSessionActive(false);
          } else if (event.error === 'aborted') {
            // Normal stop
            return;
          }
        };

        recognitionRef.current.onend = () => {
          console.log('Recognition ended');
          setIsListening(false);
          // Auto-restart if session is active and not speaking/processing
          if (sessionActive && !isSpeaking && !isProcessing) {
            scheduleRestart();
          }
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, [sessionActive, isSpeaking, isProcessing]);

  // Auto-scroll
  useEffect(() => {
    if (conversationLogRef.current) {
      conversationLogRef.current.scrollTop = conversationLogRef.current.scrollHeight;
    }
  }, [conversationLog]);

  // When AI stops speaking, restart mic
  useEffect(() => {
    if (!isSpeaking && !isProcessing && sessionActive && !isListening) {
      console.log('✅ AI finished speaking, restarting mic...');
      scheduleRestart(800); // 800ms delay after AI speech
    }
  }, [isSpeaking, sessionActive, isProcessing]);

  // Start session when modal opens
  useEffect(() => {
    if (isOpen) {
      setConversationLog([]);
      setSessionId(null);
      sessionIdRef.current = null;
      setTranscript('');
      setSessionActive(false);
      startNewSession();
    } else {
      cleanup();
    }
  }, [isOpen]);

  const scheduleRestart = (delay: number = 500) => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    
    restartTimeoutRef.current = setTimeout(() => {
      if (sessionActive && !isSpeaking && !isProcessing && !isListening) {
        startRecognition();
      }
    }, delay);
  };

  const startRecognition = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        console.log('🎤 Mic activated');
      } catch (error: any) {
        if (error.message && error.message.includes('already started')) {
          console.log('Recognition already running');
          setIsListening(true);
        } else {
          console.error('Error starting recognition:', error);
        }
      }
    }
  };

  const stopRecognition = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
        console.log('🔇 Mic stopped');
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  };

  const startNewSession = async () => {
    setIsProcessing(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      
      if (data.session_id && data.message) {
        setSessionId(data.session_id);
        sessionIdRef.current = data.session_id;
        setConversationLog([{ role: 'assistant', content: data.message }]);
        setSessionActive(true);
        
        // Speak first message
        speakText(data.message);
      }
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to connect to AI assistant.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUserSpeech = async (userText: string, currentSessionId: string) => {
    // Stop mic immediately
    stopRecognition();
    
    setConversationLog(prev => [...prev, { role: 'user', content: userText }]);
    setIsProcessing(true);

    try {
      const response = await fetch('http://localhost:5000/api/process-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_input: userText,
          session_id: currentSessionId 
        }),
      });

      const data = await response.json();

      if (data.completed && data.form_data) {
        setSessionActive(false);
        setConversationLog(prev => [...prev, { role: 'assistant', content: data.message }]);
        speakText(data.message);
        
        setTimeout(() => {
          onComplete(data.form_data);
        }, 3000);
      } else if (data.message) {
        setConversationLog(prev => [...prev, { role: 'assistant', content: data.message }]);
        speakText(data.message);
      } else if (data.restart) {
        toast.error('Session expired.');
        onClose();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to process response');
    } finally {
      setIsProcessing(false);
      setTranscript('');
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Stop mic before speaking
      stopRecognition();
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.lang = 'en-US';

      utterance.onstart = () => {
        setIsSpeaking(true);
        console.log('🔊 AI speaking...');
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        console.log('🔊 AI finished');
        // Mic will auto-restart via useEffect
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const cleanup = () => {
    setSessionActive(false);
    stopRecognition();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Volume2 className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">AI Voice Assistant</h2>
              <p className="text-sm text-gray-600">
                {sessionActive ? '🎤 Microphone auto-activates after each question' : 'Initializing...'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div ref={conversationLogRef} className="flex-1 p-6 overflow-y-auto bg-gray-50">
          <div className="space-y-4">
            {conversationLog.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <p className="text-sm font-medium mb-1">
                    {message.role === 'user' ? 'You' : 'AI Assistant'}
                  </p>
                  <p>{message.content}</p>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 border border-gray-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={20} />
                    <p>Processing...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t bg-white">
          <div className="flex flex-col items-center gap-4">
            <div className="text-center min-h-[24px]">
              {isSpeaking && (
                <p className="text-green-600 font-medium">🔊 AI is speaking... (Mic off)</p>
              )}
              {isProcessing && !isSpeaking && (
                <p className="text-orange-600 font-medium">⏳ Processing...</p>
              )}
              {!isSpeaking && !isProcessing && isListening && (
                <p className="text-blue-600 font-medium animate-pulse">
                  🎤 Listening - Speak your answer now
                </p>
              )}
              {!isSpeaking && !isProcessing && !isListening && sessionActive && (
                <p className="text-gray-600 font-medium">
                  ⏱️ Mic activating...
                </p>
              )}
            </div>

            <div className="relative">
              <div className={`p-8 rounded-full transition-all shadow-lg ${
                isListening ? 'bg-green-500 animate-pulse' : isSpeaking ? 'bg-red-500' : 'bg-gray-400'
              } text-white`}>
                {isListening ? <Mic size={48} /> : <MicOff size={48} />}
              </div>
              
              {isListening && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                  LIVE
                </div>
              )}
            </div>

            {transcript && (
              <div className="w-full p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">You said:</span> {transcript}
                </p>
              </div>
            )}
            
            <p className="text-xs text-gray-500 text-center max-w-md">
              💡 Mic turns OFF during AI speech, then auto-activates for your answer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}