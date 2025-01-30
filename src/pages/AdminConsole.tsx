import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleScrape = async (lotteryName: string) => {
    setIsLoading(lotteryName);
    
    try {
      if (lotteryName === "Mega Power") {
        const { data, error } = await supabase.functions.invoke('scrape-mega-power');
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: data.message,
        });
      } else {
        console.log(`Scraping for ${lotteryName} not implemented yet`);
        toast({
          title: "Not Implemented",
          description: `Scraping for ${lotteryName} will be implemented soon`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Scraping error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to scrape lottery results",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
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
              <h3 className="text-sm font-medium text-center">
                {isLoading === name ? (
                  <span className="text-blue-500">Scraping...</span>
                ) : (
                  `Scrape ${name}`
                )}
              </h3>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminConsole;