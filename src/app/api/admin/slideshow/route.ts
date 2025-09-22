import { NextRequest, NextResponse } from 'next/server';
import { put, del, list } from '@vercel/blob';

// Helper function to check if we're in development mode
function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

// Fallback to local storage in development
async function ensureUploadDir() {
  if (isDevelopment()) {
    const fs = await import('fs');
    const path = await import('path');
    const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
    try {
      await fs.promises.access(UPLOAD_DIR);
    } catch {
      await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
    }
  }
}

// Get all slideshow images
export async function GET() {
  try {
    if (isDevelopment()) {
      // Fallback to local storage in development
      const fs = await import('fs');
      const path = await import('path');
      const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
      
      await ensureUploadDir();
      const files = await fs.promises.readdir(UPLOAD_DIR);
      const imageFiles = files
        .filter((file: string) => {
          const ext = path.extname(file).toLowerCase();
          return ext === '.png' || ext === '.jpg' || ext === '.jpeg';
        })
        .map((file: string) => ({
          name: file,
          path: `/uploads/${file}`,
          size: 0,
          lastModified: 0
        }))
        .sort((a: any, b: any) => {
          const aNum = parseInt(a.name.match(/\d+/)?.[0] || '0');
          const bNum = parseInt(b.name.match(/\d+/)?.[0] || '0');
          return aNum - bNum;
        });

      return NextResponse.json({ images: imageFiles });
    } else {
      // Use Vercel Blob Storage in production
      const { blobs } = await list({
        prefix: 'slideshow/',
        limit: 1000
      });

      const imageFiles = blobs
        .filter(blob => {
          const ext = blob.pathname.split('.').pop()?.toLowerCase();
          return ext === 'png' || ext === 'jpg' || ext === 'jpeg';
        })
        .map(blob => ({
          name: blob.pathname.split('/').pop() || blob.pathname,
          path: blob.url,
          size: blob.size,
          lastModified: new Date(blob.uploadedAt).getTime()
        }))
        .sort((a, b) => {
          const aNum = parseInt(a.name.match(/\d+/)?.[0] || '0');
          const bNum = parseInt(b.name.match(/\d+/)?.[0] || '0');
          return aNum - bNum;
        });

      return NextResponse.json({ images: imageFiles });
    }
  } catch (error) {
    console.error('Error reading slideshow images:', error);
    return NextResponse.json({ error: 'Failed to read slideshow images' }, { status: 500 });
  }
}

// Upload new slideshow images
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const replaceAll = formData.get('replaceAll') === 'true';

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (isDevelopment()) {
      // Fallback to local storage in development
      const fs = await import('fs');
      const path = await import('path');
      const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
      
      await ensureUploadDir();
      
      // If replacing all, clear existing images first
      if (replaceAll) {
        const existingFiles = await fs.promises.readdir(UPLOAD_DIR);
        for (const file of existingFiles) {
          const ext = path.extname(file).toLowerCase();
          if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
            await fs.promises.unlink(path.join(UPLOAD_DIR, file));
          }
        }
      }

      const uploadedFiles = [];
      
      for (const file of files) {
        const ext = path.extname(file.name).toLowerCase();
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
          continue; // Skip non-image files
        }

        const buffer = await file.arrayBuffer();
        const baseName = path.basename(file.name);
        const filename = `${Date.now()}-${baseName}`;
        const filepath = path.join(UPLOAD_DIR, filename);
        
        await fs.promises.writeFile(filepath, Buffer.from(buffer));
        uploadedFiles.push({
          name: filename,
          path: `/uploads/${filename}`,
          originalName: baseName
        });
      }

      return NextResponse.json({ 
        message: `${uploadedFiles.length} images uploaded successfully`,
        files: uploadedFiles
      });
    } else {
      // Use Vercel Blob Storage in production
      if (replaceAll) {
        // Clear existing images first
        const { blobs } = await list({ prefix: 'slideshow/' });
        for (const blob of blobs) {
          await del(blob.url);
        }
      }

      const uploadedFiles = [];
      
      for (const file of files) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext !== 'png' && ext !== 'jpg' && ext !== 'jpeg') {
          continue; // Skip non-image files
        }

        const buffer = await file.arrayBuffer();
        const baseName = file.name;
        const filename = `slideshow/${Date.now()}-${baseName}`;
        
        const blob = await put(filename, buffer, {
          access: 'public',
          contentType: file.type
        });
        
        uploadedFiles.push({
          name: baseName,
          path: blob.url,
          originalName: baseName
        });
      }

      return NextResponse.json({ 
        message: `${uploadedFiles.length} images uploaded successfully`,
        files: uploadedFiles
      });
    }
  } catch (error) {
    console.error('Error uploading slideshow images:', error);
    return NextResponse.json({ error: 'Failed to upload images' }, { status: 500 });
  }
}

// Delete specific slideshow image
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename required' }, { status: 400 });
    }

    if (isDevelopment()) {
      // Fallback to local storage in development
      const fs = await import('fs');
      const path = await import('path');
      const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
      const filepath = path.join(UPLOAD_DIR, filename);
      
      try {
        await fs.promises.unlink(filepath);
        return NextResponse.json({ message: 'Image deleted successfully' });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }
        throw error;
      }
    } else {
      // Use Vercel Blob Storage in production
      try {
        // Find the blob by filename
        const { blobs } = await list({ prefix: 'slideshow/' });
        const blob = blobs.find(b => b.pathname.includes(filename));
        
        if (!blob) {
          return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }
        
        await del(blob.url);
        return NextResponse.json({ message: 'Image deleted successfully' });
      } catch (error) {
        console.error('Error deleting blob:', error);
        return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Error deleting slideshow image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
