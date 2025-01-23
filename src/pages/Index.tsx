import LotteryCard from "@/components/LotteryCard";

const NLB_LOTTERIES = [
  { name: "Mahajana Sampatha", image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e" },
  { name: "Govisetha", image: "https://images.unsplash.com/photo-1481349518771-20055b2a7b24" },
  { name: "Mega Power", image: "https://images.unsplash.com/photo-1500673922987-e212871fec22" },
  { name: "Dhana Nidhanaya", image: "https://images.unsplash.com/photo-1501854140801-50d01698950b" },
  { name: "Handahana", image: "https://images.unsplash.com/photo-1527576539890-dfa815648363" },
  { name: "Lucky 7", image: "https://images.unsplash.com/photo-1482881497185-d4a9ddbe4151" },
  { name: "Ada Sampatha", image: "https://images.unsplash.com/photo-1460574283810-2aab119d8511" },
  { name: "Development", image: "https://images.unsplash.com/photo-1473177104440-ffee2f376098" },
];

const DLB_LOTTERIES = [
  { name: "Supiri Dhana Sampatha", image: "https://images.unsplash.com/photo-1579547944212-c4f4961a8dd8" },
  { name: "Kapruka", image: "https://images.unsplash.com/photo-1579547945413-497e1b99dac0" },
  { name: "Ada Kotipathi", image: "https://images.unsplash.com/photo-1579547945026-69cf480bb0e5" },
  { name: "Lagna Wasana", image: "https://images.unsplash.com/photo-1579547945641-9dd424c7dbc3" },
  { name: "Super Ball", image: "https://images.unsplash.com/photo-1579547945652-7c28dbdc8e9d" },
  { name: "Shanida", image: "https://images.unsplash.com/photo-1579547945675-c9c0a06f8131" },
  { name: "Jayoda", image: "https://images.unsplash.com/photo-1579547945683-bc2b3f7c8f0e" },
  { name: "Sasiri", image: "https://images.unsplash.com/photo-1579547945690-9cf0e6e49b1e" },
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
              imageUrl={`${lottery.image}?auto=format&fit=crop&w=400&q=80`}
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
              imageUrl={`${lottery.image}?auto=format&fit=crop&w=400&q=80`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;