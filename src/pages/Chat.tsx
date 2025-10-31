import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { MessageSquare, Users, UserPlus, Radio } from "lucide-react";
import DirectMessages from "@/components/chat/DirectMessages";
import Channels from "@/components/chat/Channels";
import Groups from "@/components/chat/Groups";
import Friends from "@/components/chat/Friends";
import { useNavigate } from "react-router-dom";

const Chat = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("friends");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
              چت ایزی درس
            </h1>
            <p className="text-muted-foreground">
              با دوستان، گروه‌ها و کانال‌ها در ارتباط باشید
            </p>
          </div>
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            بازگشت به داشبورد
          </Button>
        </div>

        <Card className="p-6 backdrop-blur-sm bg-card/95 shadow-glow">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="friends" className="gap-2">
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">دوستان</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">پیام‌ها</span>
              </TabsTrigger>
              <TabsTrigger value="groups" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">گروه‌ها</span>
              </TabsTrigger>
              <TabsTrigger value="channels" className="gap-2">
                <Radio className="w-4 h-4" />
                <span className="hidden sm:inline">کانال‌ها</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="friends">
              <Friends />
            </TabsContent>

            <TabsContent value="messages">
              <DirectMessages />
            </TabsContent>

            <TabsContent value="groups">
              <Groups />
            </TabsContent>

            <TabsContent value="channels">
              <Channels />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
