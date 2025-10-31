import Friends from "@/components/chat/Friends";
import { Button } from "@/components/ui/button";
import { ArrowRight, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ChatFriends = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/chat")}
              className="hover:shadow-glow"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="gradient-primary p-2 rounded-lg shadow-glow">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gradient">مدیریت دوستان</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Friends />
      </main>
    </div>
  );
};

export default ChatFriends;
