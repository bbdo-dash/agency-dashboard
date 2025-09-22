import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images');
    const uploadsDir = path.join(process.cwd(), 'public/uploads');

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Process each uploaded file
    for (const file of files) {
      if (!(file instanceof File)) continue;

      // Validate file type
      if (!file.type.match(/^image\/(jpeg|png|jpg)$/i)) {
        return NextResponse.json(
          { error: 'Invalid file type. Only JPEG and PNG are allowed.' },
          { status: 400 }
        );
      }

      // Create a safe filename
      const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filepath = path.join(uploadsDir, filename);

      // Convert File to Buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      fs.writeFileSync(filepath, buffer);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json(
      { error: 'Failed to process file upload' },
      { status: 500 }
    );
  }
} 