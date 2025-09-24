"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SlideshowImage {
  name: string;
  path: string;
  size?: number;
  lastModified?: number;
}

interface SlideshowManagerProps {
  onClose: () => void;
}

export default function SlideshowManager({ onClose }: SlideshowManagerProps) {
  const [images, setImages] = useState<SlideshowImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const loadImages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/slideshow');
      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
      } else {
        console.error('Failed to load images');
      }
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load images on mount
  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const handleFileUpload = async (files: FileList | null, replaceAll: boolean = false) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('replaceAll', replaceAll.toString());
      
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch('/api/admin/slideshow', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setStatus({ type: 'success', message: result.message || 'Upload complete.' });
        await loadImages(); // Reload images
        // Signal to ImageViewer to refresh
        localStorage.setItem('slideshowUpdated', 'true');
        window.dispatchEvent(new StorageEvent('storage', { key: 'slideshowUpdated' }));
      } else {
        const error = await response.json();
        setStatus({ type: 'error', message: `Error uploading: ${error.error}` });
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      setStatus({ type: 'error', message: 'Error uploading files' });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files, false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files, true);
    }
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const handleReplaceAll = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAddImages = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDeleteImage = async (filename: string) => {

    try {
      const response = await fetch(`/api/admin/slideshow?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadImages(); // Reload images
        // Signal to ImageViewer to refresh
        localStorage.setItem('slideshowUpdated', 'true');
        window.dispatchEvent(new StorageEvent('storage', { key: 'slideshowUpdated' }));
      } else {
        const error = await response.json();
        setStatus({ type: 'error', message: `Error deleting: ${error.error}` });
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      setStatus({ type: 'error', message: 'Error deleting image' });
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHoverIndex(index);
  };

  const handleDragLeave = () => {
    setHoverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setHoverIndex(null);
      return;
    }

    const newImages = [...images];
    const draggedImage = newImages[dragIndex];
    newImages.splice(dragIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    
    setImages(newImages);
    setDragIndex(null);
    setHoverIndex(null);

    // Save new order to server
    try {
      setReordering(true);
      const imageOrder = newImages.map(img => img.name);
      const response = await fetch('/api/admin/slideshow/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageOrder }),
      });

      if (!response.ok) {
        // Revert on error
        await loadImages();
        setStatus({ type: 'error', message: 'Error saving new order' });
      } else {
        // Signal to ImageViewer to refresh
        localStorage.setItem('slideshowUpdated', 'true');
        window.dispatchEvent(new StorageEvent('storage', { key: 'slideshowUpdated' }));
      }
    } catch (error) {
      console.error('Error reordering images:', error);
      await loadImages(); // Revert on error
      setStatus({ type: 'error', message: 'Error saving new order' });
    } finally {
      setReordering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading images...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-h-full overflow-y-auto">
      {status && (
        <div className={`fixed top-4 right-4 z-[10010] px-4 py-2 rounded shadow text-sm ${status.type === 'success' ? 'bg-green-600 text-white' : status.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-700 text-white'}`}>{status.message}</div>
      )}
      <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Slideshow Management
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Upload Controls */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              📁 Upload Folder (replaces all)
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              All current images will be replaced by new ones
            </p>
            <input
              ref={folderInputRef}
              type="file"
              {...({ webkitdirectory: 'true', directory: 'true' } as any)}
              multiple
              accept=".png,.jpg,.jpeg"
              onChange={handleFolderSelect}
              className="hidden"
            />
            <button
              onClick={() => folderInputRef.current?.click()}
              disabled={uploading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload Folder'}
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              🖼️ Add Images
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Add new images to existing slideshow
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".png,.jpg,.jpeg"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={handleAddImages}
              disabled={uploading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {uploading ? 'Uploading...' : 'Add Images'}
            </button>
          </div>
        </div>
      </div>

      {/* Image Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Current Slideshow ({images.length} images)
          </h4>
          {reordering && (
            <div className="text-sm text-blue-600 dark:text-blue-400">
              Saving order...
            </div>
          )}
        </div>

        {images.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No images in slideshow
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            {images.map((image, index) => (
              <div
                key={image.name}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={`relative group cursor-move border-2 rounded-lg overflow-hidden transition-all ${
                  dragIndex === index
                    ? 'opacity-50 scale-95'
                    : hoverIndex === index
                    ? 'border-blue-500 scale-105'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <img
                  src={image.path}
                  alt={`Slide ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                    <span className="text-white text-xs font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
                      #{index + 1}
                    </span>
                    <button
                      onClick={() => setConfirmDelete(image.name)}
                      className="bg-red-600 hover:bg-red-700 text-white p-1 rounded"
                      title="Delete image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg sticky bottom-0">
        <h5 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
          💡 Instructions
        </h5>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• <strong>Drag & Drop:</strong> Drag images to change order</li>
          <li>• <strong>Delete:</strong> Click the red X symbol to delete</li>
          <li>• <strong>Upload Folder:</strong> Replaces all existing images</li>
          <li>• <strong>Add Images:</strong> Adds new images to existing slideshow</li>
          <li>• <strong>Scroll:</strong> Scroll in the image gallery to see all slides</li>
        </ul>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10020]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm mx-4 p-5">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Delete image?</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Are you sure you want to delete this image?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200">Cancel</button>
              <button onClick={async () => { const name = confirmDelete; setConfirmDelete(null); if (name) await handleDeleteImage(name); }} className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
