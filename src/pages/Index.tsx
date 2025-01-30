import LotteryCard from "@/components/LotteryCard";

const NLB_LOTTERIES = [
  { name: "Mahajana Sampatha", image: "https://r.nlb.lk/resources/112/logo.png" },
  { name: "Govisetha", image: "https://r.nlb.lk/resources/109/logo.png" },
  { name: "Mega Power", image: "https://r.nlb.lk/resources/181/logo.png" },
  { name: "Dhana Nidhanaya", image: "https://r.nlb.lk/resources/260/logo.png" },
  { name: "Handahana", image: "https://r.nlb.lk/resources/606/logo.png" },
  { name: "Lucky 7", image: "https://r.nlb.lk/resources/690/logo.png" },
  { name: "Ada Sampatha", image: "https://r.nlb.lk/resources/724/logo.png" },
];

const DLB_LOTTERIES = [
  { name: "Supiri Dhana Sampatha", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrhap_QlZ_5czRmd1b1-y0nB48XOALYIShxQ&s" },
  { name: "Kapruka", image: "https://javalounge.lk/lottery/assets/image/kotipathi-kapruka.jpg" },
  { name: "Ada Kotipathi", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRR44xCZgNBwI3o3sGsUm_1pSWRXw5Q0uMA5Q&s" },
  { name: "Lagna Wasana", image: "https://archives1.dailynews.lk/sites/default/files/styles/large/public/news/2018/02/21/z_pviii-DLB.jpg?itok=WOO3hzR5" },
  { name: "Super Ball", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNodxVU1lIt4X6Qh7Ntw3Ld1U6Q6VY0ZrlKQ&s" },
  { name: "Shanida", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0caUMfjnS8I1xkJt5l2DOtwL5KNrmfcpnvA&s" },
  { name: "Jayoda", image: "https://www.dlb.lk/front_img/16989076821-06.jpg" },
  { name: "Sasiri", image: "https://www.lankayp.com/img/site/lotto/lk2-sasiri.png?v=5" },
];

const Index = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="lottery-section">
        <h2 className="text-2xl font-bold mb-4">NLB Lotteries</h2>
        <div className="lottery-grid">
          {NLB_LOTTERIES.map((lottery) => (
            <LotteryCard
              key={lottery.name}
              name={lottery.name}
              imageUrl={lottery.image}
              type="NLB"
            />
          ))}
        </div>
      </div>

      <div className="lottery-section">
        <h2 className="text-2xl font-bold mb-4">DLB Lotteries</h2>
        <div className="lottery-grid">
          {DLB_LOTTERIES.map((lottery) => (
            <LotteryCard
              key={lottery.name}
              name={lottery.name}
              imageUrl={lottery.image}
              type="DLB"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;