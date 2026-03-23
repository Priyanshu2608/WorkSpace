import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
  title: string;
  content: string;
  template?: string;
  projectId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String, default: '' },
  template: { type: String },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
});

export const Note = mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);
