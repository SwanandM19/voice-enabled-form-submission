import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Patient from '@/lib/models/Patient';
import { verifyToken } from '@/lib/auth';

// GET - Fetch all patients (Admin only)
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const patients = await Patient.find({}).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: patients });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new patient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    await dbConnect();
    const patient = await Patient.create(body);

    return NextResponse.json({ success: true, data: patient }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
