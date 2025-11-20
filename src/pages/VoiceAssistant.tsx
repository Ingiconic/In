import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useWebSpeech } from '@/hooks/useWebSpeech';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Volume2, VolumeX, ArrowRight, Loader2 } from 'lucide-react';
import { getUserCoins, checkAndDeductCoins } from '@/lib/coinHelpers';
import { COIN_COSTS } from '@/lib/coinCosts';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const VoiceAssistant = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userCoins, setUserCoins] = useState(0);

  const {
    isListening,
    isSpeaking,
    transcript,
    error,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSupported,
  } = useWebSpeech();

  useEffect(() => {
    loadUserCoins();
  }, []);

  useEffect(() => {
    if (transcript && !isListening) {
      handleUserMessage(transcript);
    }
  }, [transcript, isListening]);

  const loadUserCoins = async () => {
    const coins = await getUserCoins();
    setUserCoins(coins);
  };

  const handleUserMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    const costInCoins = COIN_COSTS.QUESTION_ANSWER;

    if (userCoins < costInCoins) {
      toast({
        title: 'سکه کافی نیست',
        description: `برای استفاده از دستیار صوتی به ${costInCoins} سکه نیاز دارید`,
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const success = await checkAndDeductCoins(costInCoins);
      
      if (!success) {
        toast({
          title: 'خطا',
          description: 'کسر سکه با مشکل مواجه شد',
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }

      await loadUserCoins();

      const { data, error: functionError } = await supabase.functions.invoke('ai-answer', {
        body: { question: text },
      });

      if (functionError) throw functionError;

      const aiResponse = data?.answer || 'متاسفانه پاسخی دریافت نشد';

      const aiMsg: Message = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      speak(aiResponse);

      toast({
        title: 'موفق',
        description: `${costInCoins} سکه کسر شد`,
      });
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: 'خطا',
        description: 'خطایی در پردازش درخواست رخ داد',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
  };

  if (!isSupported) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4 text-destructive">
              مرورگر شما پشتیبانی نمی‌کند
            </h2>
            <p className="text-muted-foreground mb-6">
              متاسفانه مرورگر شما از قابلیت تشخیص گفتار پشتیبانی نمی‌کند. 
              لطفاً از مرورگرهای Chrome یا Edge استفاده کنید.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              بازگشت به داشبورد
            </Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gradient">دستیار صوتی</h1>
              <p className="text-sm text-muted-foreground">
                {COIN_COSTS.QUESTION_ANSWER} سکه به ازای هر سوال
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-yellow-500/10 px-4 py-2 rounded-lg border border-yellow-500/30">
            <span className="text-lg font-bold text-yellow-600">{userCoins}</span>
            <span className="text-sm text-muted-foreground">سکه</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-6 bg-destructive/10 border-destructive/30">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}

        {/* Conversation History */}
        <Card className="mb-6 p-6 min-h-[400px] max-h-[500px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Volume2 className="w-16 h-16 text-primary/50 mb-4" />
              <h3 className="text-xl font-bold mb-2">سلام! چطور می‌تونم کمکت کنم؟</h3>
              <p className="text-muted-foreground">
                روی دکمه میکروفون کلیک کن و سوالت رو بپرس
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-primary/10 border border-primary/30'
                        : 'bg-secondary/10 border border-secondary/30'
                    }`}
                  >
                    <p className="text-sm font-semibold mb-1">
                      {msg.role === 'user' ? 'شما' : 'دستیار'}
                    </p>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {msg.timestamp.toLocaleTimeString('fa-IR')}
                    </p>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-end">
                  <div className="bg-secondary/10 border border-secondary/30 p-4 rounded-lg">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            size="lg"
            variant={isSpeaking ? 'destructive' : 'outline'}
            onClick={toggleSpeaking}
            disabled={!isSpeaking}
            className="w-16 h-16 rounded-full"
          >
            {isSpeaking ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </Button>

          <Button
            size="lg"
            onClick={toggleListening}
            disabled={isProcessing}
            className={`w-20 h-20 rounded-full ${
              isListening ? 'animate-pulse bg-destructive hover:bg-destructive/90' : 'gradient-primary'
            }`}
          >
            {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </Button>
        </div>

        {/* Status */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {isListening && 'در حال گوش دادن...'}
            {isProcessing && 'در حال پردازش...'}
            {isSpeaking && 'در حال پخش...'}
            {!isListening && !isProcessing && !isSpeaking && 'آماده دریافت دستور'}
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default VoiceAssistant;
