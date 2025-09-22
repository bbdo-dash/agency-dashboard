import { useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { pdfjs } from 'react-pdf';

// Set up the worker using a direct CDN URL
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

interface PDFViewerProps {
  pdfUrl: string;
  pageInterval?: number; // Time in milliseconds between page changes
}

export default function PDFViewer({ pdfUrl, pageInterval = 5000 }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  function onDocumentLoadError(error: Error) {
    setError(error.message);
    setLoading(false);
  }

  useEffect(() => {
    if (numPages) {
      const interval = setInterval(() => {
        setCurrentPage((current) => (current % numPages) + 1);
      }, pageInterval);

      return () => clearInterval(interval);
    }
  }, [numPages, pageInterval]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        <p>Error loading PDF: {error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        <p>Loading PDF...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div className="text-white">
            Loading PDF...
          </div>
        }
        className="max-h-full"
      >
        <Page
          pageNumber={currentPage}
          className="max-h-full"
          renderTextLayer={false}
          renderAnnotationLayer={false}
          loading={
            <div className="text-white">
              Loading page...
            </div>
          }
        />
      </Document>
      {numPages && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/80 text-sm">
          Page {currentPage} of {numPages}
        </div>
      )}
    </div>
  );
} 