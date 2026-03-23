import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  done: boolean;
  priority: string;
  dueDate?: Date;
  featureId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema({
  title: { type: String, required: true },
  done: { type: Boolean, default: false },
  priority: { type: String, default: 'Medium' },
  dueDate: { type: Date },
  featureId: { type: Schema.Types.ObjectId, ref: 'Feature' },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
});

export const Task = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
