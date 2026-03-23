import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Wireframe } from '@/models/Wireframe';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const wireframes = await Wireframe.find({ userId: session.userId }).sort({ updatedAt: -1 }).lean();
  
  return NextResponse.json(wireframes.map(w => ({ ...w, id: w._id.toString() })));
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const data = await req.json();
  
  const wireframe = await Wireframe.create({
    userId: session.userId,
    name: data.name || 'Untitled Board',
    data: data.data || '{}',
    projectId: data.projectId || null,
  });
  
  const created: any = wireframe.toObject();
  created.id = created._id.toString();

  return NextResponse.json(created, { status: 201 });
}
