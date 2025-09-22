import { NextRequest, NextResponse } from 'next/server';
import { list, del, put } from '@vercel/blob';

// Helper function to check if we're in development mode
function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

// Reorder slideshow images
export async function POST(request: NextRequest) {
  try {
    const { imageOrder } = await request.json();
    
    if (!Array.isArray(imageOrder)) {
      return NextResponse.json({ error: 'Image order must be an array' }, { status: 400 });
    }

    if (isDevelopment()) {
      // Fallback to local storage in development
      const fs = await import('fs');
      const path = await import('path');
      const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

      // Rename files to match the new order
      for (let i = 0; i < imageOrder.length; i++) {
        const currentFile = imageOrder[i];
        const newName = `slide${String(i + 1).padStart(2, '0')}.${path.extname(currentFile).slice(1)}`;
        
        const oldPath = path.join(UPLOAD_DIR, currentFile);
        const newPath = path.join(UPLOAD_DIR, newName);
        
        try {
          await fs.promises.rename(oldPath, newPath);
        } catch (error) {
          console.error(`Error renaming ${currentFile} to ${newName}:`, error);
          // Continue with other files even if one fails
        }
      }

      return NextResponse.json({ message: 'Images reordered successfully' });
    } else {
      // Use Vercel Blob Storage in production
      // Note: Blob storage doesn't support renaming, so we'll need to copy and delete
      const { blobs } = await list({ prefix: 'slideshow/' });
      
      // Create a mapping of current files to their new names
      const reorderMap = new Map();
      for (let i = 0; i < imageOrder.length; i++) {
        const currentFile = imageOrder[i];
        const newName = `slide${String(i + 1).padStart(2, '0')}.${currentFile.split('.').pop()}`;
        reorderMap.set(currentFile, newName);
      }

      // For each file that needs reordering, copy to new name and delete old
      for (const [oldName, newName] of reorderMap) {
        const blob = blobs.find(b => b.pathname.includes(oldName));
        if (blob) {
          try {
            // Download the current blob
            const response = await fetch(blob.url);
            const buffer = await response.arrayBuffer();
            
            // Upload with new name
            await put(`slideshow/${newName}`, buffer, {
              access: 'public',
              contentType: blob.contentType || 'image/jpeg'
            });
            
            // Delete the old blob
            await del(blob.url);
          } catch (error) {
            console.error(`Error reordering ${oldName} to ${newName}:`, error);
            // Continue with other files even if one fails
          }
        }
      }

      return NextResponse.json({ message: 'Images reordered successfully' });
    }
  } catch (error) {
    console.error('Error reordering slideshow images:', error);
    return NextResponse.json({ error: 'Failed to reorder images' }, { status: 500 });
  }
}
