import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Task } from '@/models/Task';
import { getSession } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;
  const data = await req.json();
  
  const task = await Task.create({
    title: data.title,
    done: data.done || false,
    priority: data.priority || 'Medium',
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    featureId: id,
    userId: session.userId,
  });
  
  const created: any = task.toObject();
  created.id = created._id.toString();

  return NextResponse.json(created, { status: 201 });
}
