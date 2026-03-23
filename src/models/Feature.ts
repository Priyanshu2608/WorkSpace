import mongoose, { Schema, Document } from 'mongoose';

export interface IFeature extends Document {
  title: string;
  description?: string;
  status: string;
  priority: string;
  labels?: string;
  order: number;
  featureNumber: number;
  dueDate?: Date;
  projectId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FeatureSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, default: 'Backlog' },
  priority: { type: String, default: 'Medium' },
  labels: { type: String },
  order: { type: Number, default: 0 },
  featureNumber: { type: Number, default: 0 },
  dueDate: { type: Date },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
}, {
  timestamps: true,
});

export const Feature = mongoose.models.Feature || mongoose.model<IFeature>('Feature', FeatureSchema);
