import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createUser, getUserByUsername } from '../../../../lib/users'; // Adjust path as needed

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
    }

    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    await createUser(username, hashedPassword);

    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
