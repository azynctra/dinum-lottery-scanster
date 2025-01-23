import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import QRScanner from "./QRScanner";

interface LotteryCardProps {
  name: string;
  imageUrl: string;
  type: "NLB" | "DLB";
}

const LotteryCard = ({ name, imageUrl, type }: LotteryCardProps) => {
  const [showScanner, setShowScanner] = useState(false);

  const handleClick = () => {
    if (type === "NLB") {
      setShowScanner(true);
    }
  };

  return (
    <>
      <Card 
        className="lottery-card overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        onClick={handleClick}
      >
        <CardContent className="p-0">
          <div className="aspect-[4/3] relative">
            <img
              src={imageUrl}
              alt={name}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="p-4">
            <h3 className="text-sm font-medium text-center">{name}</h3>
          </div>
        </CardContent>
      </Card>

      {showScanner && (
        <QRScanner onClose={() => setShowScanner(false)} />
      )}
    </>
  );
};

export default LotteryCard;