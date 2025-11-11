import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, ShoppingCart } from "lucide-react";

export default function CoinShop() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8 text-center">
          <Coins className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold text-foreground mb-2">فروشگاه سکه</h1>
          <p className="text-muted-foreground">
            برای استفاده از ابزارهای هوش مصنوعی به سکه نیاز دارید
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow border-2 hover:border-primary">
            <Coins className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-2xl font-bold mb-2">۱۰۰ سکه</h3>
            <p className="text-3xl font-bold text-primary mb-4">۱۰,۰۰۰ تومان</p>
            <Button className="w-full" variant="outline">
              <ShoppingCart className="ml-2 w-4 h-4" />
              خرید
            </Button>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow border-2 hover:border-primary">
            <Coins className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-2xl font-bold mb-2">۵۰۰ سکه</h3>
            <p className="text-3xl font-bold text-primary mb-4">۴۵,۰۰۰ تومان</p>
            <span className="inline-block bg-green-500 text-white text-xs px-2 py-1 rounded mb-2">
              ۱۰٪ تخفیف
            </span>
            <Button className="w-full" variant="outline">
              <ShoppingCart className="ml-2 w-4 h-4" />
              خرید
            </Button>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow border-2 hover:border-primary">
            <Coins className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-2xl font-bold mb-2">۱۰۰۰ سکه</h3>
            <p className="text-3xl font-bold text-primary mb-4">۸۰,۰۰۰ تومان</p>
            <span className="inline-block bg-green-500 text-white text-xs px-2 py-1 rounded mb-2">
              ۲۰٪ تخفیف
            </span>
            <Button className="w-full" variant="outline">
              <ShoppingCart className="ml-2 w-4 h-4" />
              خرید
            </Button>
          </Card>
        </div>

        <Card className="p-8 text-center bg-gradient-to-br from-primary/10 to-primary/5">
          <h2 className="text-2xl font-bold mb-4">برای خرید سکه</h2>
          <p className="text-lg mb-6">
            به آیدی <span className="font-bold text-primary">@IngIconic</span> در ایتا پیام دهید
          </p>
          <div className="flex justify-center gap-4">
            <Button 
              size="lg"
              onClick={() => window.open("eitaa://resolve?domain=IngIconic", "_blank")}
            >
              ارتباط با پشتیبانی
            </Button>
          </div>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p className="mb-2">💰 هزینه استفاده از ابزارها:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="font-bold">آزمون‌ساز</p>
              <p className="text-primary">۱۰ سکه</p>
            </div>
            <div>
              <p className="font-bold">نقشه ذهنی</p>
              <p className="text-primary">۱۰ سکه</p>
            </div>
            <div>
              <p className="font-bold">فلش کارت</p>
              <p className="text-primary">۵ سکه</p>
            </div>
            <div>
              <p className="font-bold">خلاصه‌ساز</p>
              <p className="text-primary">۳ سکه</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
