import { cn } from "@/lib/utils";

interface LotteryResultProps {
  content: string;
  className?: string;
}

const LotteryResult = ({ content, className }: LotteryResultProps) => {
  return (
    <div className={cn("max-w-md mx-auto p-6 bg-white rounded-lg shadow-md", className)}>
      <div 
        className="prose max-w-none space-y-6"
        dangerouslySetInnerHTML={{ __html: content }}
      />
      <style>{`
        .prose h2 {
          color: #ef4444;
          font-size: 1.5rem;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .prose strong {
          color: #1f2937;
          font-size: 1.25rem;
          display: block;
          margin-bottom: 1rem;
        }
        .prose ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .prose a {
          color: #3b82f6;
          text-decoration: none;
        }
        .prose a:hover {
          text-decoration: underline;
        }
        .prose em {
          font-style: italic;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default LotteryResult;