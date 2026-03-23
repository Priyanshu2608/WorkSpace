import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { User } from '@/models/User';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  await connectToDatabase();
  const user = await User.findById(session.userId).select('name email githubToken');

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Mask the token if it exists so the frontend knows it's set without exposing it
  const hasGithubToken = !!user.githubToken;

  return NextResponse.json({ 
    user: { id: user._id.toString(), name: user.name, email: user.email }, 
    hasGithubToken 
  }, { status: 200 });
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { githubToken } = await req.json();
    await connectToDatabase();
    await User.findByIdAndUpdate(session.userId, { githubToken: githubToken || null });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
