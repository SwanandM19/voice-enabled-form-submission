'use client';

import { useState, useEffect } from 'react';
import { X, Mic, MicOff, Volume2, VolumeX, ChevronRight, ChevronLeft } from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import toast from 'react-hot-toast';

interface FormData {
  fullName: string;
  age: string;
  gender: string;
  contactNumber: string;
  email: string;
  address: string;
  chiefComplaint: string;
  medicalHistory: string;
  allergies: string;
  currentMedications: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  consentGiven: boolean;
}

interface Question {
  id: keyof FormData;
  question: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox';
  options?: string[];
  required: boolean;
}

const questions: Question[] = [
  { id: 'fullName', question: 'What is your full name?', type: 'text', required: true },
  { id: 'age', question: 'What is your age?', type: 'number', required: true },
  { id: 'gender', question: 'What is your gender?', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
  { id: 'contactNumber', question: 'What is your contact number?', type: 'text', required: true },
  { id: 'email', question: 'What is your email address? (Optional)', type: 'text', required: false },
  { id: 'address', question: 'What is your address?', type: 'textarea', required: true },
  { id: 'chiefComplaint', question: 'What is the reason for your visit today?', type: 'textarea', required: true },
  { id: 'medicalHistory', question: 'Do you have any past medical conditions? (Optional)', type: 'textarea', required: false },
  { id: 'allergies', question: 'Do you have any allergies? (Optional)', type: 'textarea', required: false },
  { id: 'currentMedications', question: 'Are you currently taking any medications? (Optional)', type: 'textarea', required: false },
  { id: 'emergencyContactName', question: 'Emergency contact name?', type: 'text', required: true },
  { id: 'emergencyContactRelationship', question: 'Emergency contact relationship?', type: 'text', required: true },
  { id: 'emergencyContactPhone', question: 'Emergency contact phone number?', type: 'text', required: true },
];

export default function VoiceOnboardingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    age: '',
    gender: '',
    contactNumber: '',
    email: '',
    address: '',
    chiefComplaint: '',
    medicalHistory: '',
    allergies: '',
    currentMedications: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    consentGiven: false,
  });

  const { 
    isListening, 
    transcript, 
    interimTranscript, 
    isSupported: voiceSupported, 
    startListening, 
    stopListening, 
    resetTranscript 
  } = useVoiceInput();

  const { speak, stop: stopSpeaking, isSpeaking, isSupported: ttsSupported } = useTextToSpeech();
  const [autoSpeak, setAutoSpeak] = useState(true);

  useEffect(() => {
    if (isOpen && currentStep === 0 && autoSpeak) {
      setTimeout(() => {
        speak('Welcome to our clinic. I will ask you a few questions to complete your onboarding. Let\'s begin.');
      }, 500);
    }
  }, [isOpen]);

  useEffect(() => {
    if (transcript && !showPreview) {
      const currentQuestion = questions[currentStep];
      setFormData((prev) => ({
        ...prev,
        [currentQuestion.id]: prev[currentQuestion.id] + transcript,
      }));
      resetTranscript();
    }
  }, [transcript, currentStep, showPreview]);

  useEffect(() => {
    if (!showPreview && autoSpeak && currentStep < questions.length) {
      setTimeout(() => {
        speak(questions[currentStep].question);
      }, 300);
    }
  }, [currentStep, showPreview, autoSpeak]);

  const handleNext = () => {
    const currentQuestion = questions[currentStep];
    const value = formData[currentQuestion.id];

    if (currentQuestion.required && !value) {
      toast.error('This field is required');
      return;
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowPreview(true);
      stopSpeaking();
      speak('Please review your information before submitting.');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.consentGiven) {
      toast.error('Please provide consent to proceed');
      return;
    }

    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          age: parseInt(formData.age),
          gender: formData.gender,
          contactNumber: formData.contactNumber,
          email: formData.email,
          address: formData.address,
          chiefComplaint: formData.chiefComplaint,
          medicalHistory: formData.medicalHistory,
          allergies: formData.allergies,
          currentMedications: formData.currentMedications,
          emergencyContact: {
            name: formData.emergencyContactName,
            relationship: formData.emergencyContactRelationship,
            phone: formData.emergencyContactPhone,
          },
          consentGiven: formData.consentGiven,
        }),
      });

      if (response.ok) {
        toast.success('Registration successful!');
        speak('Thank you for registering. Our team will contact you shortly.');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        toast.error('Failed to submit form');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  if (!isOpen) return null;

  const currentQuestion = questions[currentStep];
  const currentValue = formData[currentQuestion?.id] || '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-800">Patient Onboarding</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {!showPreview ? (
          <div className="p-6">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">
                  Question {currentStep + 1} of {questions.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAutoSpeak(!autoSpeak)}
                    className={`p-2 rounded-lg ${autoSpeak ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                    title={autoSpeak ? 'Auto-speak On' : 'Auto-speak Off'}
                  >
                    {autoSpeak ? <Volume2 size={20} /> : <VolumeX size={20} />}
                  </button>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-lg font-medium text-gray-900 mb-4">
                {currentQuestion.question}
              </label>

              {currentQuestion.type === 'select' ? (
                <select
                  value={currentValue}
                  onChange={(e) => setFormData({ ...formData, [currentQuestion.id]: e.target.value })}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select...</option>
                  {currentQuestion.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : currentQuestion.type === 'textarea' ? (
                <textarea
                  value={currentValue}
                  onChange={(e) => setFormData({ ...formData, [currentQuestion.id]: e.target.value })}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none min-h-[120px]"
                  placeholder="Type or use voice..."
                />
              ) : (
                <input
                  type={currentQuestion.type}
                  value={currentValue}
                  onChange={(e) => setFormData({ ...formData, [currentQuestion.id]: e.target.value })}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Type or use voice..."
                />
              )}

              {interimTranscript && (
                <div className="mt-2 text-sm text-gray-500 italic">
                  Listening: {interimTranscript}
                </div>
              )}
            </div>

            {voiceSupported && currentQuestion.type !== 'select' && (
              <div className="flex justify-center mb-6">
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`p-6 rounded-full transition-all ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : 'bg-blue-500 hover:bg-blue-600'
                  } text-white shadow-lg`}
                >
                  {isListening ? <MicOff size={32} /> : <Mic size={32} />}
                </button>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {currentStep === questions.length - 1 ? 'Preview' : 'Next'}
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">Review Your Information</h3>
            
            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {questions.map((q) => (
                <div key={q.id} className="border-b pb-2">
                  <p className="text-sm text-gray-600">{q.question}</p>
                  <p className="text-gray-900 font-medium">{formData[q.id] || 'Not provided'}</p>
                </div>
              ))}
            </div>

            <div className="mb-6 flex items-start gap-3 bg-blue-50 p-4 rounded-lg">
              <input
                type="checkbox"
                checked={formData.consentGiven}
                onChange={(e) => setFormData({ ...formData, consentGiven: e.target.checked })}
                className="mt-1"
                id="consent"
              />
              <label htmlFor="consent" className="text-sm text-gray-700">
                I consent to the collection and use of my health information for medical purposes in accordance with HIPAA regulations.
              </label>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setShowPreview(false)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                <ChevronLeft size={20} />
                Edit
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.consentGiven}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
