import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useState } from 'react';

interface QRScannerProps {
  onClose: () => void;
}

const QRScanner = ({ onClose }: QRScannerProps) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(success, error);

    function success(result: string) {
      scanner.clear();
      // Extract URL from the scanned result
      const urlMatch = result.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        const extractedUrl = urlMatch[0];
        setUrl(extractedUrl);
        console.log('Extracted URL:', extractedUrl);
        // Directly open the URL in a new window with specific features
        const newWindow = window.open(
          extractedUrl,
          '_blank',
          'noopener,noreferrer,width=800,height=600'
        );
        if (newWindow) {
          newWindow.focus();
        }
        // Close the scanner after successful scan
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        console.warn('No URL found in scanned result:', result);
      }
    }

    function error(err: any) {
      console.warn(err);
    }

    return () => {
      scanner.clear();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg w-full max-w-lg mx-4">
        <div className="flex justify-end">
          <button 
            onClick={onClose}
            className="mb-4 text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
        <div id="reader" className="w-full"></div>
      </div>
    </div>
  );
};

export default QRScanner;