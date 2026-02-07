'use client';

import { useState, useEffect } from 'react';
import RegistrationModeModal from '@/components/RegistrationModeModal';
import VoiceOnboardingModal from '@/components/VoiceOnboardingModal';
import VoiceAIModal from '@/components/VoiceAIModal';
import PreviewModal from '@/components/PreviewModal';
import { Stethoscope, Calendar, Users, Shield } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [showModeModal, setShowModeModal] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showVoiceAI, setShowVoiceAI] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    // Auto-open mode selection after 1 second
    const timer = setTimeout(() => {
      setShowModeModal(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleModeSelection = (mode: 'manual' | 'voice') => {
    setShowModeModal(false);
    
    if (mode === 'manual') {
      setShowManualForm(true);
    } else {
      setShowVoiceAI(true);
    }
  };

  const handleVoiceAIComplete = (data: any) => {
    setShowVoiceAI(false);
    setFormData(data);
    setShowPreview(true);
  };

  const handlePreviewClose = () => {
    setShowPreview(false);
    setFormData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Stethoscope className="text-blue-600" size={32} />
            <h1 className="text-2xl font-bold text-gray-800">MediCare Clinic</h1>
          </div>
          <Link
            href="/admin/login"
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
          >
            Admin Login
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to MediCare Clinic
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Your health is our priority. Experience seamless voice-enabled registration.
          </p>
          <button
            onClick={() => setShowModeModal(true)}
            className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 shadow-lg transform transition hover:scale-105"
          >
            Start Registration
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition">
            <Calendar className="text-blue-600 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Easy Scheduling</h3>
            <p className="text-gray-600">
              Book appointments online or walk-in anytime during business hours.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition">
            <Users className="text-blue-600 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Expert Care</h3>
            <p className="text-gray-600">
              Our experienced medical professionals provide personalized treatment.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition">
            <Shield className="text-blue-600 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Secure & Private</h3>
            <p className="text-gray-600">
              HIPAA compliant systems ensure your medical data stays confidential.
            </p>
          </div>
        </div>
      </main>

      {/* Modals */}
      <RegistrationModeModal
        isOpen={showModeModal}
        onClose={() => setShowModeModal(false)}
        onSelectMode={handleModeSelection}
      />

      <VoiceOnboardingModal
        isOpen={showManualForm}
        onClose={() => setShowManualForm(false)}
      />

      <VoiceAIModal
        isOpen={showVoiceAI}
        onClose={() => setShowVoiceAI(false)}
        onComplete={handleVoiceAIComplete}
      />

      <PreviewModal
        isOpen={showPreview}
        onClose={handlePreviewClose}
        formData={formData}
      />
    </div>
  );
}