
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface MatchResult {
  letter: boolean;
  numbers: boolean;
  matchingSpecials: string[];
}

interface LotteryResultProps {
  content?: string;
  className?: string;
  ticketData?: {
    drawId: string;
    letter: string;
    numbers: string[];
  };
  resultData?: any;
  matchResult?: MatchResult;
}

const LotteryResult = ({ content, className, ticketData, resultData, matchResult }: LotteryResultProps) => {
  if (content) {
    return (
      <div className={cn("max-w-md mx-auto p-6 bg-white rounded-lg shadow-md", className)}>
        <div 
          className="prose max-w-none space-y-6"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    );
  }

  if (ticketData && resultData && matchResult) {
    return (
      <div className="space-y-6 p-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Ticket Information</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>Draw Number:</div>
            <div>{ticketData.drawId}</div>
            <div>Letter:</div>
            <div className={matchResult.letter ? "text-green-600" : "text-red-600"}>
              {ticketData.letter}
            </div>
            <div>Numbers:</div>
            <div className={matchResult.numbers ? "text-green-600" : "text-red-600"}>
              {ticketData.numbers.join(", ")}
            </div>
          </div>
        </div>

        <Alert variant={matchResult.letter && matchResult.numbers ? "default" : "destructive"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Result</AlertTitle>
          <AlertDescription>
            {matchResult.letter && matchResult.numbers ? (
              <>
                <CheckCircle2 className="h-4 w-4 inline-block mr-2" />
                Numbers match!
              </>
            ) : (
              "Numbers don't match"
            )}
          </AlertDescription>
        </Alert>

        {matchResult.matchingSpecials.length > 0 && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Special Prize Match!</AlertTitle>
            <AlertDescription>
              Your numbers match the following special draws:
              <ul className="list-disc pl-4 mt-2">
                {matchResult.matchingSpecials.map((specialDraw, index) => (
                  <li key={index}>{specialDraw.replace('mega_power_', '').replace(/_/g, ' ')}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return null;
};

export default LotteryResult;
