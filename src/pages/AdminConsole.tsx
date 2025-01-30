import { Card, CardContent } from "@/components/ui/card";

const LOTTERY_NAMES = [
  "Mahajana Sampatha",
  "Vasana Sampatha",
  "Super Ball",
  "Mega Power",
  "Development Fortune",
  "Dhana Nidhanaya",
  "Govisetha",
  "Jathika Sampatha",
  "Saturday Fortune",
  "Shanida Wasana",
  "Super 50",
  "Ada Kotipathi",
  "Dhana Rekha",
  "Dollar Fortune",
  "Kotipathi Kapruka"
];

const AdminConsole = () => {
  const handleScrape = (lotteryName: string) => {
    console.log(`Scraping lottery: ${lotteryName}`);
    // Scraping functionality will be implemented later
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Console</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {LOTTERY_NAMES.map((name) => (
          <Card 
            key={name}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleScrape(name)}
          >
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-center">Scrape {name}</h3>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminConsole;