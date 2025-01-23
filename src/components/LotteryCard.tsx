import { Card, CardContent } from "@/components/ui/card";

interface LotteryCardProps {
  name: string;
  imageUrl: string;
}

const LotteryCard = ({ name, imageUrl }: LotteryCardProps) => {
  return (
    <Card className="lottery-card overflow-hidden">
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