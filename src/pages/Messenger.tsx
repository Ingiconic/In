import { useState } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { 
  ChatList, 
  ChatArea, 
  NewChatDialog,
  useMessenger 
} from "@/components/messenger";
import { MessageCircle, Loader2 } from "lucide-react";

const Messenger = () => {
  const {
    currentUser,
    chats,
    selectedChat,
    setSelectedChat,
    messages,
    loading,
    sendingMessage,
    sendMessage,
    deleteMessage,
    togglePinChat,
    loadChats,
  } = useMessenger();

  const [showNewChat, setShowNewChat] = useState(false);

  const handleChatCreated = (chat: any) => {
    setSelectedChat(chat);
    loadChats();
  };

  // Loading state
  if (!currentUser) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground">در حال بارگذاری...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] flex overflow-hidden rounded-xl border border-border/40 shadow-xl bg-gradient-to-br from-background via-background to-primary/5">
        {/* Chat List - hide on mobile when chat is selected */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-shrink-0`}
        >
          <ChatList
            chats={chats}
            selectedChat={selectedChat}
            currentUser={currentUser}
            loading={loading}
            onSelectChat={setSelectedChat}
            onNewChat={() => setShowNewChat(true)}
          />
        </motion.div>

        {/* Chat Area */}
        <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
          {selectedChat ? (
            <motion.div 
              key={selectedChat.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full"
            >
              <ChatArea
                chat={selectedChat}
                messages={messages}
                currentUser={currentUser}
                sendingMessage={sendingMessage}
                onBack={() => setSelectedChat(null)}
                onSendMessage={sendMessage}
                onDeleteMessage={deleteMessage}
                onTogglePin={togglePinChat}
              />
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-gradient-to-b from-background to-muted/20">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <MessageCircle className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2 text-foreground">پیام‌رسان ایزی درس</h2>
                <p className="text-sm max-w-xs mx-auto leading-relaxed">
                  یک گفتگو انتخاب کنید یا چت جدید شروع کنید
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
                  <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full">چت خصوصی</span>
                  <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full">گروه‌ها</span>
                  <span className="px-3 py-1.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full">کانال‌ها</span>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* New Chat Dialog */}
        <NewChatDialog
          open={showNewChat}
          onOpenChange={setShowNewChat}
          currentUser={currentUser}
          existingChats={chats}
          onChatCreated={handleChatCreated}
        />
      </div>
    </AppLayout>
  );
};

export default Messenger;
