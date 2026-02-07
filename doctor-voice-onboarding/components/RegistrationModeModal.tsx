'use client';

import { Bot, FileText, X } from 'lucide-react';

interface RegistrationModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'manual' | 'voice') => void;
}

export default function RegistrationModeModal({
  isOpen,
  onClose,
  onSelectMode,
}: RegistrationModeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Choose Registration Method</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          <p className="text-gray-600 text-center mb-8">
            How would you like to complete your registration?
          </p>

          <div className="space-y-4">
            {/* Manual Form Option */}
            <button
              onClick={() => onSelectMode('manual')}
              className="w-full p-6 border-2 border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-gray-100 rounded-full group-hover:bg-blue-100 transition-colors">
                  <FileText className="text-gray-600 group-hover:text-blue-600" size={40} />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Manual Form</h3>
                  <p className="text-sm text-gray-600">
                    Fill out the registration form manually with keyboard input
                  </p>
                </div>
              </div>
            </button>

            {/* Voice AI Option */}
            <button
              onClick={() => onSelectMode('voice')}
              className="w-full p-6 border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all group"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                  <Bot className="text-blue-600" size={40} />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    AI Voice Assistant
                    <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                      RECOMMENDED
                    </span>
                  </h3>
                  <p className="text-sm text-gray-600">
                    Have a natural conversation with our AI assistant to complete registration
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}   