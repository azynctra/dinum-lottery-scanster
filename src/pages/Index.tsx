import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import LotteryCard from "@/components/LotteryCard";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lottery Scanner</h1>
        <Button 
          onClick={() => navigate("/admin")}
          variant="outline"
        >
          Admin Console
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <LotteryCard name="Mahajana Sampatha" imageUrl="" type="NLB" />
        <LotteryCard name="Vasana Sampatha" imageUrl="" type="NLB" />
        <LotteryCard name="Super Ball" imageUrl="" type="NLB" />
        <LotteryCard name="Mega Power" imageUrl="" type="NLB" />
        <LotteryCard name="Development Fortune" imageUrl="" type="NLB" />
        <LotteryCard name="Dhana Nidhanaya" imageUrl="" type="NLB" />
        <LotteryCard name="Govisetha" imageUrl="" type="NLB" />
        <LotteryCard name="Jathika Sampatha" imageUrl="" type="NLB" />
        <LotteryCard name="Saturday Fortune" imageUrl="" type="NLB" />
        <LotteryCard name="Shanida Wasana" imageUrl="" type="NLB" />
        <LotteryCard name="Super 50" imageUrl="" type="NLB" />
        <LotteryCard name="Ada Kotipathi" imageUrl="" type="NLB" />
        <LotteryCard name="Dhana Rekha" imageUrl="" type="NLB" />
        <LotteryCard name="Dollar Fortune" imageUrl="" type="NLB" />
        <LotteryCard name="Kotipathi Kapruka" imageUrl="" type="NLB" />
      </div>
    </div>
  );
};

export default Index;
