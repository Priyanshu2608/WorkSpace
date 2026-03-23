import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  githubToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional for OAuth users in the future
  githubToken: { type: String },
}, {
  timestamps: true,
});

// Use existing model if it exists (for hot reloading in dev)
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
