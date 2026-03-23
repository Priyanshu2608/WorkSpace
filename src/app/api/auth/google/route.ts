import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import connectToDatabase from '@/lib/mongoose';
import { User } from '@/models/User';
import { setSession } from '@/lib/auth';

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(req: Request) {
  try {
    const { credential } = await req.json();

    if (!credential) {
      return NextResponse.json({ error: 'Missing credential' }, { status: 400 });
    }

    // Verify the Google JWT token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.name) {
      return NextResponse.json({ error: 'Invalid Google payload' }, { status: 400 });
    }

    await connectToDatabase();
    
    // Find or create the user securely via Google Email
    let user = await User.findOne({ email: payload.email });
    
    if (!user) {
      // Create user if they don't exist. They won't have a password, which is fine
      // because they authenticate via Google OAuth.
      user = await User.create({
        email: payload.email,
        name: payload.name,
      });
    }

    // Persist session for 30 days automatically for Google Auth users
    await setSession({ userId: user._id.toString(), email: user.email, name: user.name }, true);

    return NextResponse.json({ 
      user: { id: user._id.toString(), name: user.name, email: user.email } 
    }, { status: 200 });

  } catch (error) {
    console.error('Google Auth Error:', error);
    return NextResponse.json({ error: 'Failed to authenticate with Google' }, { status: 500 });
  }
}
