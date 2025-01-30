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
        {/* NLB Lotteries */}
        <LotteryCard name="Mahajana Sampatha" imageUrl="https://r.nlb.lk/resources/112/logo.png" type="NLB" />
        <LotteryCard name="Govisetha" imageUrl="https://r.nlb.lk/resources/109/logo.png" type="NLB" />
        <LotteryCard name="Mega Power" imageUrl="https://r.nlb.lk/resources/181/logo.png" type="NLB" />
        <LotteryCard name="Dhana Nidhanaya" imageUrl="https://r.nlb.lk/resources/260/logo.png" type="NLB" />
        <LotteryCard name="Handahana" imageUrl="https://r.nlb.lk/resources/606/logo.png" type="NLB" />
        <LotteryCard name="Lucky 7" imageUrl="https://r.nlb.lk/resources/690/logo.png" type="NLB" />
        <LotteryCard name="Ada Sampatha" imageUrl="https://r.nlb.lk/resources/724/logo.png" type="NLB" />
        
        {/* DLB Lotteries */}
        <LotteryCard name="Supiri Dhana Sampatha" imageUrl="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrhap_QlZ_5czRmd1b1-y0nB48XOALYIShxQ&s" type="DLB" />
        <LotteryCard name="Kapruka" imageUrl="https://javalounge.lk/lottery/assets/image/kotipathi-kapruka.jpg" type="DLB" />
        <LotteryCard name="Ada Kotipathi" imageUrl="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRR44xCZgNBwI3o3sGsUm_1pSWRXw5Q0uMA5Q&s" type="DLB" />
        <LotteryCard name="Lagna Wasana" imageUrl="https://archives1.dailynews.lk/sites/default/files/styles/large/public/news/2018/02/21/z_pviii-DLB.jpg?itok=WOO3hzR5" type="DLB" />
        <LotteryCard name="Super Ball" imageUrl="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNodxVU1lIt4X6Qh7Ntw3Ld1U6Q6VY0ZrlKQ&s" type="DLB" />
        <LotteryCard name="Shanida" imageUrl="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0caUMfjnS8I1xkJt5l2DOtwL5KNrmfcpnvA&s" type="DLB" />
        <LotteryCard name="Jayoda" imageUrl="https://www.dlb.lk/front_img/16989076821-06.jpg" type="DLB" />
        <LotteryCard name="Sasiri" imageUrl="https://www.lankayp.com/img/site/lotto/lk2-sasiri.png?v=5" type="DLB" />
      </div>
    </div>
  );
};

export default Index;