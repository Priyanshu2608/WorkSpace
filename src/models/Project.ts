import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description?: string;
  status: string;
  githubUrl?: string;
  tags?: string;
  startDate?: Date;
  targetDate?: Date;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  status: { type: String, default: 'Planning' },
  githubUrl: { type: String },
  tags: { type: String },
  startDate: { type: Date },
  targetDate: { type: Date },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
});

export const Project = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
