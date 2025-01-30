import { Card, CardContent } from "@/components/ui/card";

interface LotteryCardProps {
  name: string;
  imageUrl: string;
  type: "NLB" | "DLB";
  onClick?: () => void;
}

const LotteryCard = ({ name, imageUrl, type, onClick }: LotteryCardProps) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
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
  );
};

export default LotteryCard;