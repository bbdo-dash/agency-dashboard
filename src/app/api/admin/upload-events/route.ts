import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('csvFile') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV file' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Define the target path
    const targetPath = path.join(process.cwd(), 'docs', 'werbe_events_2025_2026.csv');

    // Create docs directory if it doesn't exist
    const docsDir = path.join(process.cwd(), 'docs');
    if (!existsSync(docsDir)) {
      await mkdir(docsDir, { recursive: true });
    }

    // Write the file
    await writeFile(targetPath, buffer);

    // Parse CSV to validate structure
    const csvContent = buffer.toString('utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file must contain at least a header and one data row' }, { status: 400 });
    }

    // Validate CSV structure (should have Name, Datum, Ort columns)
    const header = lines[0].toLowerCase();
    if (!header.includes('name') || !header.includes('datum') || !header.includes('ort')) {
      return NextResponse.json({ 
        error: 'CSV file must contain columns: Name, Datum, Ort' 
      }, { status: 400 });
    }

    // Test parse the CSV to ensure it's valid
    try {
      const { parseCSVToEvents } = await import('@/lib/csvParser');
      const testEvents = parseCSVToEvents(csvContent);
      
      if (testEvents.length === 0) {
        return NextResponse.json({ 
          error: 'No valid events found in CSV file. Please check date format and data structure.' 
        }, { status: 400 });
      }
      
      console.log(`CSV validation successful: ${testEvents.length} events parsed`);
    } catch (parseError) {
      console.error('CSV parsing error:', parseError);
      return NextResponse.json({ 
        error: 'Invalid CSV format. Please ensure dates are in DD.MM.YYYY format and all required columns are present.' 
      }, { status: 400 });
    }

    // Count events
    const eventCount = lines.length - 1; // Subtract header row

    return NextResponse.json({ 
      success: true, 
      message: 'Events successfully updated',
      eventCount: eventCount,
      filename: file.name
    });

  } catch (error) {
    console.error('Error uploading events file:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
