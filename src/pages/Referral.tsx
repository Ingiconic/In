import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Gift, Users, Coins } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface ReferralStats {
  referral_code: string;
  total_referrals: number;
  total_earned: number;
}

const Referral = () => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", user.id)
        .single();

      // Generate referral code if missing
      if (!profile?.referral_code) {
        const { data: newCode } = await supabase.rpc("generate_referral_code");
        if (newCode) {
          await supabase
            .from("profiles")
            .update({ referral_code: newCode })
            .eq("id", user.id);
          
          setStats({
            referral_code: newCode,
            total_referrals: 0,
            total_earned: 0,
          });
        }
      } else {
        const { count } = await supabase
          .from("referrals")
          .select("*", { count: "exact", head: true })
          .eq("referrer_id", user.id);

        setStats({
          referral_code: profile.referral_code,
          total_referrals: count || 0,
          total_earned: (count || 0) * 500,
        });
      }
    } catch (error) {
      console.error("Error loading referral data:", error);
      toast.error("خطا در بارگذاری اطلاعات دعوت");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-48 w-full mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">دعوت از دوستان</h1>
          <p className="text-muted-foreground">
            با دعوت از دوستان خود، هر نفر 500 سکه دریافت کنید!
          </p>
        </div>

        <Card className="mb-6 border-2 border-primary/30">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 pb-8">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Gift className="w-8 h-8 text-primary" />
              کد دعوت شما
            </CardTitle>
            <CardDescription className="text-base">
              این کد را به دوستان خود بدهید تا هنگام ثبت‌نام وارد کنند و شما به ازای هر نفر 500 سکه دریافت کنید!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex gap-3">
              <Input 
                value={stats?.referral_code || ''} 
                readOnly 
                className="font-mono text-2xl h-16 text-center font-bold" 
                dir="ltr"
              />
              <Button 
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(stats?.referral_code || '');
                    toast.success("کد دعوت کپی شد!");
                  } catch (error) {
                    toast.error("خطا در کپی کردن کد");
                  }
                }} 
                size="lg" 
                className="gap-2"
              >
                <Copy className="w-5 h-5" />
                کپی
              </Button>
            </div>
            <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl p-6 text-center border border-primary/30">
              <p className="text-base text-muted-foreground mb-3">کد دعوت شما:</p>
              <p className="text-4xl font-bold text-primary tracking-wider">{stats?.referral_code}</p>
              <p className="text-sm text-muted-foreground mt-3">
                دوستان شما می‌توانند هنگام ثبت‌نام از این کد استفاده کنند
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                افراد دعوت شده
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.total_referrals || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">تعداد کل دعوت‌های موفق</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-500" />
                سکه‌های کسب شده
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.total_earned || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">از طریق دعوت دوستان</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>چگونه کار می‌کند؟</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">1</span>
              </div>
              <div>
                <p className="font-medium">کد دعوت خود را کپی کنید</p>
                <p className="text-sm text-muted-foreground">از دکمه کپی بالا استفاده کنید</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">2</span>
              </div>
              <div>
                <p className="font-medium">کد را به دوستان خود بدهید</p>
                <p className="text-sm text-muted-foreground">دوستان شما هنگام ثبت‌نام کد را وارد می‌کنند</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">3</span>
              </div>
              <div>
                <p className="font-medium">سکه دریافت کنید</p>
                <p className="text-sm text-muted-foreground">وقتی دوستتان با کد شما ثبت‌نام کند، هر دوی شما 500 سکه دریافت می‌کنید!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Referral;
