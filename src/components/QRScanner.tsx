import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useState } from 'react';

interface QRScannerProps {
  onClose: () => void;
}

const QRScanner = ({ onClose }: QRScannerProps) => {
  const [url, setUrl] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(true);

  useEffect(() => {
    if (!showScanner) return;

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
        setShowScanner(false);
        console.log('Extracted URL:', extractedUrl);
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
  }, [showScanner]);

  const handleClose = () => {
    setUrl(null);
    setShowScanner(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 h-[80vh] flex flex-col">
        <div className="flex justify-end p-4">
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {showScanner ? (
            <div id="reader" className="w-full"></div>
          ) : url ? (
            <div className="w-full h-full">
              <iframe
                src={url}
                className="w-full h-full border-none"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                referrerPolicy="no-referrer"
                loading="lazy"
                title="Lottery Result"
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;