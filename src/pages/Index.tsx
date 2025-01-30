import { useNavigate } from "react-router-dom";
import LotteryCard from "@/components/LotteryCard";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

const LOTTERIES = [
  "Mahajana Sampatha",
  "Govisetha",
  "Mega Power",
  "Dhana Nidhanaya",
  "Handahana",
  "Lucky 7",
  "Ada Sampatha",
  "Supiri Dhana Sampatha",
  "Kapruka",
  "Ada Kotipathi",
  "Lagna Wasana",
  "Super Ball",
  "Shanida",
  "Jayoda",
  "Sasiri"
];

const Index = () => {
  const navigate = useNavigate();

  const handleScrape = (lotteryName: string) => {
    console.log(`Scraping ${lotteryName}`);
    // Scraping functionality will be implemented later
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-end mb-6">
        <Button 
          onClick={() => navigate("/admin")}
          className="flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Admin Console
        </Button>
      </div>

      <div className="lottery-section">
        <h2 className="text-2xl font-bold mb-4">Lottery Scrapers</h2>
        <div className="lottery-grid">
          {LOTTERIES.map((lottery) => (
            <LotteryCard
              key={lottery}
              name={`Scrape ${lottery}`}
              imageUrl="/placeholder.svg"
              type="NLB"
              onClick={() => handleScrape(lottery)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
