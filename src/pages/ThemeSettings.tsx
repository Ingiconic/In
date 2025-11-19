import AppLayout from "@/components/layout/AppLayout";
import { ThemeCustomizer } from "@/components/ThemeCustomizer";

const ThemeSettings = () => {
  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent mb-2">
            تنظیمات ظاهری 🎨
          </h1>
          <p className="text-muted-foreground">
            ظاهر برنامه را به سلیقه خود شخصی‌سازی کنید
          </p>
        </div>

        <ThemeCustomizer />
      </div>
    </AppLayout>
  );
};

export default ThemeSettings;
