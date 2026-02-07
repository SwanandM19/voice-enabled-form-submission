import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAdmin extends Document {
  username: string;
  password: string;
}

const AdminSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const Admin: Model<IAdmin> = 
  mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);

export default Admin;
