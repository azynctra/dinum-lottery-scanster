import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface QRScannerProps {
  onClose: () => void;
}

const QRScanner = ({ onClose }: QRScannerProps) => {
  const { toast } = useToast();
  const [url, setUrl] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(true);
  const [scrapedContent, setScrapedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!showScanner) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(success, error);

    async function success(result: string) {
      scanner.clear();
      // Extract URL from the scanned result
      const urlMatch = result.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        const extractedUrl = urlMatch[0];
        setUrl(extractedUrl);
        setShowScanner(false);
        console.log('Extracted URL:', extractedUrl);
        
        // Start scraping process
        try {
          setIsLoading(true);
          const response = await supabase.functions.invoke('scrape-lottery-result', {
            body: { url: extractedUrl }
          });

          console.log('Scraping response:', response);

          if (response.error) {
            throw new Error(response.error.message || 'Failed to fetch lottery result');
          }

          if (response.data?.success && response.data?.content) {
            setScrapedContent(response.data.content);
            toast({
              title: "Success",
              description: "Lottery result fetched successfully",
            });
          } else {
            throw new Error(response.data?.error || 'Failed to fetch lottery result');
          }
        } catch (error) {
          console.error('Error scraping content:', error);
          toast({
            title: "Error",
            description: error.message || "Failed to fetch lottery result",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        console.warn('No URL found in scanned result:', result);
        toast({
          title: "Error",
          description: "No valid URL found in QR code",
          variant: "destructive",
        });
      }
    }

    function error(err: any) {
      console.warn('QR Scanner error:', err);
    }

    return () => {
      scanner.clear();
    };
  }, [showScanner]);

  const handleClose = () => {
    setUrl(null);
    setShowScanner(true);
    setScrapedContent(null);
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
        
        <div className="flex-1 overflow-auto">
          {showScanner ? (
            <div id="reader" className="w-full"></div>
          ) : (
            <div className="w-full h-full p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
              ) : scrapedContent ? (
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: scrapedContent }}
                />
              ) : (
                <div className="text-center text-gray-500">
                  No content available
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;