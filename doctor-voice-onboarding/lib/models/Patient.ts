import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPatient extends Document {
  fullName: string;
  age: number;
  gender: string;
  contactNumber: string;
  email?: string;
  address: string;
  chiefComplaint: string;
  medicalHistory?: string;
  allergies?: string;
  currentMedications?: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  consentGiven: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema: Schema = new Schema(
  {
    fullName: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    contactNumber: { type: String, required: true },
    email: { type: String },
    address: { type: String, required: true },
    chiefComplaint: { type: String, required: true },
    medicalHistory: { type: String },
    allergies: { type: String },
    currentMedications: { type: String },
    emergencyContact: {
      name: { type: String, required: true },
      relationship: { type: String, required: true },
      phone: { type: String, required: true },
    },
    consentGiven: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
  }
);

const Patient: Model<IPatient> = 
  mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema);

export default Patient;
