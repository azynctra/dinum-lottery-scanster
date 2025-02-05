
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { parseMegaPowerTicket, fetchMegaPowerResult, compareMegaPowerTicket, scrapeLotteryResult } from '@/services/lotteryService';
import LotteryResult from './LotteryResult';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

interface QRScannerProps {
  onClose: () => void;
}

const QRScanner = ({ onClose }: QRScannerProps) => {
  const { toast } = useToast();
  const [url, setUrl] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(true);
  const [scrapedContent, setScrapedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [matchResult, setMatchResult] = useState<any>(null);

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
      
      // Parse ticket data from QR code
      const ticket = parseMegaPowerTicket(result);
      if (!ticket) {
        toast({
          title: "Error",
          description: "Invalid QR code format",
          variant: "destructive",
        });
        return;
      }

      setTicketData(ticket);
      setShowScanner(false);
      setIsLoading(true);

      try {
        // Fetch result from database
        const result = await fetchMegaPowerResult(ticket.drawId);
        setResultData(result);

        // Compare ticket with result
        const comparison = compareMegaPowerTicket(ticket, result);
        setMatchResult(comparison);

        // Also fetch the webpage content for additional information
        const urlMatch = result.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          const extractedUrl = urlMatch[0];
          setUrl(extractedUrl);
          const content = await scrapeLotteryResult(extractedUrl);
          setScrapedContent(content);
        }

        toast({
          title: "Success",
          description: "Lottery result fetched successfully",
        });
      } catch (error) {
        console.error('Error processing ticket:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to fetch lottery result",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
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
    setTicketData(null);
    setResultData(null);
    setMatchResult(null);
    onClose();
  };

  const handleRetry = () => {
    setShowScanner(true);
    setUrl(null);
    setScrapedContent(null);
    setTicketData(null);
    setResultData(null);
    setMatchResult(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4">
          <Button variant="ghost" onClick={handleRetry}>
            Scan Again
          </Button>
          <Button variant="ghost" onClick={handleClose}>
            Close
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto">
          {showScanner ? (
            <div id="reader" className="w-full"></div>
          ) : (
            <div className="w-full h-full p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : ticketData && resultData ? (
                <LotteryResult 
                  ticketData={ticketData}
                  resultData={resultData}
                  matchResult={matchResult}
                  content={scrapedContent}
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
