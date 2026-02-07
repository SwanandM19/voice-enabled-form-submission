'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
}

export default function PreviewModal({ isOpen, onClose, formData }: PreviewModalProps) {
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState(formData || {});
  const [consentGiven, setConsentGiven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update editedData when formData changes
  useEffect(() => {
    if (formData) {
      setEditedData(formData);
    }
  }, [formData]);

  const handleEdit = (field: string, value: string) => {
    setEditedData({ ...editedData, [field]: value });
  };

  const handleSubmit = async () => {
    if (!consentGiven) {
      toast.error('Please provide consent to proceed');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editedData.fullName,
          age: parseInt(editedData.age),
          gender: editedData.gender,
          contactNumber: editedData.contactNumber,
          email: editedData.email || '',
          address: editedData.address,
          chiefComplaint: editedData.chiefComplaint,
          medicalHistory: editedData.medicalHistory || '',
          allergies: editedData.allergies || '',
          currentMedications: editedData.currentMedications || '',
          emergencyContact: {
            name: editedData.emergencyContactName,
            relationship: editedData.emergencyContactRelationship,
            phone: editedData.emergencyContactPhone,
          },
          consentGiven: consentGiven,
        }),
      });

      if (response.ok) {
        toast.success('Registration successful!');
        setTimeout(() => {
          onClose();
          // Reset state
          setEditedData({});
          setConsentGiven(false);
          setEditMode(false);
        }, 1500);
      } else {
        toast.error('Failed to submit form');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render if modal is closed or no data
  if (!isOpen || !formData) return null;

  const fields = [
    { key: 'fullName', label: 'Full Name', required: true },
    { key: 'age', label: 'Age', required: true, type: 'number' },
    { key: 'gender', label: 'Gender', required: true },
    { key: 'contactNumber', label: 'Contact Number', required: true },
    { key: 'email', label: 'Email Address', required: false },
    { key: 'address', label: 'Address', required: true, multiline: true },
    { key: 'chiefComplaint', label: 'Chief Complaint', required: true, multiline: true },
    { key: 'medicalHistory', label: 'Medical History', required: false, multiline: true },
    { key: 'allergies', label: 'Allergies', required: false, multiline: true },
    { key: 'currentMedications', label: 'Current Medications', required: false, multiline: true },
    { key: 'emergencyContactName', label: 'Emergency Contact Name', required: true },
    { key: 'emergencyContactRelationship', label: 'Emergency Contact Relationship', required: true },
    { key: 'emergencyContactPhone', label: 'Emergency Contact Phone', required: true },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-800">
            {editMode ? 'Edit Information' : 'Review Your Information'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!editMode ? (
            // Preview Mode
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.key} className="border-b pb-3">
                  <p className="text-sm text-gray-600 mb-1">{field.label}</p>
                  <p className="text-gray-900 font-medium">
                    {editedData?.[field.key] || 'Not provided'}
                  </p>
                </div>
              ))}

              {/* Edit Button */}
              <button
                onClick={() => setEditMode(true)}
                className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit2 size={20} />
                Edit Information
              </button>
            </div>
          ) : (
            // Edit Mode
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.multiline ? (
                    <textarea
                      value={editedData?.[field.key] || ''}
                      onChange={(e) => handleEdit(field.key, e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  ) : (
                    <input
                      type={field.type || 'text'}
                      value={editedData?.[field.key] || ''}
                      onChange={(e) => handleEdit(field.key, e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                </div>
              ))}

              {/* Back to Preview */}
              <button
                onClick={() => setEditMode(false)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                <ChevronLeft size={20} />
                Back to Preview
              </button>
            </div>
          )}

          {/* Consent Checkbox */}
          {!editMode && (
            <div className="mt-6 flex items-start gap-3 bg-blue-50 p-4 rounded-lg">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1"
                id="consent"
              />
              <label htmlFor="consent" className="text-sm text-gray-700">
                I consent to the collection and use of my health information for medical purposes in accordance with HIPAA regulations.
              </label>
            </div>
          )}

          {/* Submit Button */}
          {!editMode && (
            <button
              onClick={handleSubmit}
              disabled={!consentGiven || isSubmitting}
              className="w-full mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Registration'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}