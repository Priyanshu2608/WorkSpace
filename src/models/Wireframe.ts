import mongoose, { Schema, Document } from 'mongoose';

export interface IWireframe extends Document {
  name: string;
  data: string;
  projectId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WireframeSchema: Schema = new Schema({
  name: { type: String, required: true },
  data: { type: String, default: '{}' },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
});

export const Wireframe = mongoose.models.Wireframe || mongoose.model<IWireframe>('Wireframe', WireframeSchema);
