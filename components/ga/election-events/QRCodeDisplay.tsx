'use client';

import { useState } from 'react';
import { QrCodeIcon, ShareIcon, DownloadIcon } from 'lucide-react';

interface QRCodeDisplayProps {
  eventId: string;
  eventTitle: string;
}

export default function QRCodeDisplay({ eventId, eventTitle }: QRCodeDisplayProps) {
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState(false);

  const qrCodeUrl = `/api/ga/election-events/${eventId}/qr`;
  const currentPageUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleDownload = async () => {
    try {
      setQrLoading(true);
      const response = await fetch(qrCodeUrl);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-code-${eventTitle.toLowerCase().replace(/\s+/g, '-')}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setQrLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: eventTitle,
          text: `Register for: ${eventTitle}`,
          url: currentPageUrl,
        });
      } catch (error) {
        // User cancelled sharing or share failed
        fallbackShare();
      }
    } else {
      fallbackShare();
    }
  };

  const fallbackShare = () => {
    // Copy URL to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentPageUrl);
      // You could show a toast notification here
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <QrCodeIcon className="h-5 w-5 mr-2" />
          Quick Access
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={handleShare}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            title="Share this event"
          >
            <ShareIcon className="h-4 w-4" />
          </button>
          <button
            onClick={handleDownload}
            disabled={qrLoading}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 disabled:opacity-50"
            title="Download QR code"
          >
            <DownloadIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="text-center">
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          {qrError ? (
            <div className="text-center py-8">
              <QrCodeIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">QR code unavailable</p>
            </div>
          ) : (
            <img
              src={qrCodeUrl}
              alt={`QR code for ${eventTitle}`}
              className="mx-auto max-w-full h-auto"
              style={{ maxWidth: '200px' }}
              onError={() => setQrError(true)}
            />
          )}
        </div>
        
        <p className="text-sm text-gray-600 mb-2">
          Scan to access this registration page on your mobile device
        </p>
        
        <div className="text-xs text-gray-500 break-all">
          {currentPageUrl}
        </div>
      </div>
    </div>
  );
} 