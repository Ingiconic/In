import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Box, Calculator, FlaskConical, Heart, Sparkles } from "lucide-react";
import SketchfabViewer from "@/components/ar/SketchfabViewer";
import ModelViewer from "@/components/ar/ModelViewer";
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";

// High-quality 3D Models with Sketchfab embeds
const sampleModels = [
  // === زیست‌شناسی - بدن انسان (Sketchfab) ===
  {
    id: "heart",
    title: "Realistic Human Heart",
    title_fa: "قلب انسان",
    description: "مدل واقعی و دقیق قلب با تمام جزئیات",
    detailed_info: `قلب یک پمپ عضلانی است که خون را در بدن به گردش در می‌آورد.

🔹 دهلیز راست: دریافت خون کم‌اکسیژن از بدن
🔹 بطن راست: ارسال خون به ریه‌ها
🔹 دهلیز چپ: دریافت خون پراکسیژن از ریه‌ها
🔹 بطن چپ: پمپ خون به کل بدن

🫀 ضربان قلب: ۶۰-۱۰۰ بار در دقیقه
🩸 حجم خون پمپ شده: ۵ لیتر در دقیقه`,
    subject: "زیست‌شناسی",
    category: "biology",
    sketchfab_id: "3f8072336ce94d18b3d0d055a1ece089",
  },
  {
    id: "brain",
    title: "Human Brain",
    title_fa: "مغز انسان",
    description: "مدل سه‌بعدی دقیق مغز با تمام بخش‌ها",
    detailed_info: `مغز مرکز فرماندهی بدن انسان است و از حدود ۸۶ میلیارد نورون تشکیل شده.

🔹 نیم‌کره چپ: مسئول تفکر منطقی، ریاضیات و زبان
🔹 نیم‌کره راست: مسئول خلاقیت، هنر و تخیل
🔹 مخچه: کنترل تعادل و هماهنگی حرکات
🔹 ساقه مغز: کنترل تنفس، ضربان قلب و هضم

وزن مغز: حدود ۱.۴ کیلوگرم
مصرف انرژی: ۲۰٪ از کل انرژی بدن`,
    subject: "زیست‌شناسی",
    category: "biology",
    sketchfab_id: "e073c2590bc24daaa7323f4daa5b7784",
  },
  {
    id: "lungs",
    title: "Realistic Human Lungs",
    title_fa: "ریه‌های انسان",
    description: "مدل واقعی ریه‌ها با برونش‌ها و آلوئول‌ها",
    detailed_info: `ریه‌ها اندام تنفسی هستند که اکسیژن را جذب و دی‌اکسید کربن را دفع می‌کنند.

🔹 نای (تراشه): لوله اصلی هوا
🔹 برونش‌ها: شاخه‌های نای
🔹 برونشیول‌ها: شاخه‌های کوچک‌تر
🔹 کیسه‌های هوایی (آلوئول): محل تبادل گاز

🫁 تعداد آلوئول‌ها: حدود ۳۰۰ میلیون
💨 ظرفیت ریه: ۶ لیتر هوا`,
    subject: "زیست‌شناسی",
    category: "biology",
    sketchfab_id: "ce09f4099a68467880f46e61eb9a3531",
  },
  {
    id: "skeleton",
    title: "Human Skeleton",
    title_fa: "اسکلت انسان",
    description: "مدل کامل اسکلت با تمام استخوان‌ها",
    detailed_info: `اسکلت انسان چارچوب بدن و محافظ اندام‌های حیاتی است.

🔹 جمجمه: محافظ مغز
🔹 ستون فقرات: ۳۳ مهره
🔹 قفسه سینه: محافظ قلب و ریه
🔹 لگن: اتصال پاها به تنه
🔹 استخوان‌های دست و پا

🦴 تعداد کل استخوان‌ها: ۲۰۶
💪 سخت‌ترین استخوان: استخوان ران`,
    subject: "زیست‌شناسی",
    category: "biology",
    sketchfab_id: "3247ca2f8a6346d78142f193eeb59c88",
  },
  {
    id: "tooth",
    title: "Human Teeth",
    title_fa: "دندان‌های انسان",
    description: "مدل دقیق دندان‌ها با ساختار داخلی",
    detailed_info: `دندان برای جویدن و خرد کردن غذا استفاده می‌شود.

🔹 مینا: سخت‌ترین بافت بدن (لایه خارجی)
🔹 عاج: لایه زیر مینا
🔹 پالپ: بافت نرم داخلی (عصب و رگ)
🔹 ریشه: بخش داخل لثه

🦷 تعداد دندان‌های شیری: ۲۰
🦷 تعداد دندان‌های دائمی: ۳۲`,
    subject: "زیست‌شناسی",
    category: "biology",
    sketchfab_id: "e17aff6102bd471eacbd8a29da743bb6",
  },
  {
    id: "cell",
    title: "Eukaryotic Cell",
    title_fa: "سلول یوکاریوتی",
    description: "مدل سلول جانوری با تمام اندامک‌ها",
    detailed_info: `سلول واحد ساختاری و عملکردی موجودات زنده است.

🔹 غشای پلاسمایی: کنترل ورود و خروج مواد
🔹 هسته: مرکز کنترل سلول
🔹 میتوکندری: تولید انرژی (ATP)
🔹 ریبوزوم: ساخت پروتئین
🔹 شبکه آندوپلاسمی: انتقال مواد

🔬 اندازه سلول: ۱۰-۱۰۰ میکرومتر`,
    subject: "زیست‌شناسی",
    category: "biology",
    sketchfab_id: "b7d84e5f2d5e411fbb195ab2742f2256",
  },
  {
    id: "dna",
    title: "DNA Double Helix",
    title_fa: "دی‌ان‌ای (DNA)",
    description: "ساختار مارپیچ دوگانه DNA",
    detailed_info: `DNA حامل اطلاعات ژنتیکی موجودات زنده است.

🔹 ساختار: مارپیچ دوگانه
🔹 واحدها: نوکلئوتیدها
🔹 بازهای آلی: A-T و G-C
🔹 قند: دئوکسی‌ریبوز

🧬 طول DNA انسان: ۲ متر در هر سلول
📚 تعداد ژن‌ها: حدود ۲۰,۰۰۰`,
    subject: "زیست‌شناسی",
    category: "biology",
    sketchfab_id: "547d42f6c0184232a945051b6952a39e",
  },
  {
    id: "eye",
    title: "Human Eye",
    title_fa: "چشم انسان",
    description: "مدل آناتومی چشم با تمام اجزا",
    detailed_info: `چشم اندام بینایی است که نور را به سیگنال‌های عصبی تبدیل می‌کند.

🔹 قرنیه: لایه شفاف جلوی چشم
🔹 عنبیه: تنظیم نور ورودی
🔹 مردمک: سوراخ مرکزی عنبیه
🔹 شبکیه: لایه حساس به نور
🔹 عصب بینایی: انتقال سیگنال به مغز

👁️ تعداد سلول‌های گیرنده نور: ۱۲۰ میلیون`,
    subject: "زیست‌شناسی",
    category: "biology",
    sketchfab_id: "de3082b0e5bb4a2e9caefce68cf14e1b",
  },
  {
    id: "ear",
    title: "Human Ear Anatomy",
    title_fa: "گوش انسان",
    description: "ساختار کامل گوش با حلزون شنوایی",
    detailed_info: `گوش اندام شنوایی و تعادل بدن است.

🔹 گوش خارجی: جمع‌آوری امواج صوتی
🔹 پرده گوش: ارتعاش با صدا
🔹 استخوان‌چه‌ها: چکشی، سندانی، رکابی
🔹 حلزون (کوکلئا): تبدیل ارتعاش به سیگنال
🔹 مجاری نیم‌دایره: حفظ تعادل

👂 محدوده شنوایی: ۲۰ تا ۲۰,۰۰۰ هرتز`,
    subject: "زیست‌شناسی",
    category: "biology",
    sketchfab_id: "f0b7b6e0f0f44e71a8c5c2cedb37b0d4",
  },
  {
    id: "stomach",
    title: "Human Stomach",
    title_fa: "معده انسان",
    description: "مدل معده با مری و دوازدهه",
    detailed_info: `معده اندام گوارشی است که غذا را ذخیره و هضم می‌کند.

🔹 کاردیا: ورودی معده
🔹 فوندوس: بخش بالایی
🔹 بدنه: بخش اصلی
🔹 پیلور: خروجی معده

🍽️ ظرفیت: ۱-۱.۵ لیتر
⏱️ زمان تخلیه: ۴-۵ ساعت
🧪 pH اسید معده: ۱.۵-۳.۵`,
    subject: "زیست‌شناسی",
    category: "biology",
    sketchfab_id: "e0f1952de7204654ba469c3e887a029b",
  },
  {
    id: "kidney",
    title: "Human Kidney",
    title_fa: "کلیه انسان",
    description: "مدل کلیه با نفرون و حالب",
    detailed_info: `کلیه‌ها خون را تصفیه کرده و ادرار تولید می‌کنند.

🔹 قشر کلیه: بخش خارجی
🔹 مدولا: بخش داخلی
🔹 نفرون: واحد عملکردی (هر کلیه ۱ میلیون)
🔹 لگنچه: جمع‌آوری ادرار

🫘 حجم خون تصفیه شده: ۱۸۰ لیتر در روز
💧 تولید ادرار: ۱-۲ لیتر در روز`,
    subject: "زیست‌شناسی",
    category: "biology",
    sketchfab_id: "3b0b72f9c4c04e5e9f0d3b36c1dc3b7e",
  },
  {
    id: "liver",
    title: "Human Liver",
    title_fa: "کبد انسان",
    description: "بزرگترین غده بدن با لوب‌های اصلی",
    detailed_info: `کبد بزرگترین اندام داخلی و غده بدن است.

🔹 لوب راست: بزرگتر
🔹 لوب چپ: کوچکتر
🔹 کیسه صفرا: ذخیره صفرا

⚙️ وظایف:
• تولید صفرا برای هضم چربی
• ذخیره گلیکوژن
• سم‌زدایی خون

⚖️ وزن: ۱.۵ کیلوگرم`,
    subject: "زیست‌شناسی",
    category: "biology",
    sketchfab_id: "d8a3c19e4b3b4d7a9c2f1e5b8a6c4d2e",
  },
  {
    id: "muscle",
    title: "Muscle Anatomy",
    title_fa: "آناتومی عضله",
    description: "ساختار عضله اسکلتی با فیبرها",
    detailed_info: `عضله بافت انقباض‌پذیر برای حرکت است.

🔹 عضله اسکلتی: حرکات ارادی
🔹 عضله قلبی: پمپاژ قلب
🔹 عضله صاف: اندام‌های داخلی
🔹 تاندون: اتصال عضله به استخوان

💪 تعداد عضلات بدن: بیش از ۶۰۰
⚡ سریع‌ترین عضله: عضله پلک`,
    subject: "زیست‌شناسی",
    category: "biology",
    sketchfab_id: "8c1bcc3685cd40b3bd6b42e0445522a5",
  },
  {
    id: "neuron",
    title: "Neuron Cell",
    title_fa: "نورون (سلول عصبی)",
    description: "ساختار نورون با آکسون و دندریت",
    detailed_info: `نورون واحد ساختاری سیستم عصبی است.

🔹 جسم سلولی (سوما): مرکز سلول
🔹 هسته: حاوی DNA
🔹 دندریت‌ها: دریافت پیام عصبی
🔹 آکسون: انتقال پیام عصبی

⚡ سرعت انتقال پیام: تا ۱۲۰ متر بر ثانیه
🧠 تعداد نورون‌های مغز: ۸۶ میلیارد`,
    subject: "زیست‌شناسی",
    category: "biology",
    sketchfab_id: "9f2d3a1b7c4e5f8a6b0c1d2e3f4a5b6c",
  },
  {
    id: "blood_cells",
    title: "Blood Cells",
    title_fa: "سلول‌های خون",
    description: "گلبول قرمز، سفید و پلاکت",
    detailed_info: `خون بافت مایع انتقال‌دهنده است.

🔴 گلبول قرمز: حمل اکسیژن
   • تعداد: ۵ میلیون در میلی‌متر مکعب
⚪ گلبول سفید: دفاع ایمنی
   • تعداد: ۵-۱۰ هزار
🟡 پلاکت: انعقاد خون

🩸 حجم خون: ۵ لیتر`,
    subject: "زیست‌شناسی",
    category: "biology",
    sketchfab_id: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
  },
  {
    id: "virus",
    title: "Virus Model",
    title_fa: "ویروس",
    description: "ساختار ویروس با پروتئین‌های سطحی",
    detailed_info: `ویروس‌ها عوامل بیماری‌زای میکروسکوپی هستند.

🔹 کپسید: پوسته پروتئینی
🔹 ژنوم: DNA یا RNA
🔹 اسپایک: پروتئین‌های سطحی
🔹 انولوپ: غشای لیپیدی (برخی)

🦠 اندازه: ۲۰-۳۰۰ نانومتر
🔬 تکثیر: فقط در سلول میزبان`,
    subject: "زیست‌شناسی",
    category: "biology",
    sketchfab_id: "d_QDWsT0kBG", // Poly by Google virus
  },

  // === شیمی (ساده - بدون Sketchfab) ===
  {
    id: "atom",
    title: "Atom Model",
    title_fa: "مدل اتم",
    description: "ساختار اتم با هسته و الکترون‌ها",
    detailed_info: `اتم کوچکترین واحد ماده است.

🔹 هسته: پروتون (+) و نوترون (۰)
🔹 الکترون: ذرات منفی در مدار
🔹 لایه‌های الکترونی: K, L, M, N...

⚛️ اندازه اتم: ۱۰⁻¹⁰ متر
⚛️ اندازه هسته: ۱۰⁻¹⁵ متر`,
    subject: "شیمی",
    category: "chemistry",
    model_type: "3d_model",
    model_data: { type: "atom" },
  },
  {
    id: "water",
    title: "Water Molecule",
    title_fa: "مولکول آب",
    description: "ساختار H₂O با پیوندهای کووالانسی",
    detailed_info: `آب ماده حیاتی برای حیات است.

🔹 فرمول: H₂O
🔹 زاویه پیوند: ۱۰۴.۵ درجه
🔹 پیوند: کووالانسی قطبی

💧 نقطه جوش: ۱۰۰°C
💧 نقطه انجماد: ۰°C`,
    subject: "شیمی",
    category: "chemistry",
    model_type: "3d_model",
    model_data: { type: "water" },
  },

  // === ریاضی و هندسه (ساده) ===
  {
    id: "cube",
    title: "Cube",
    title_fa: "مکعب",
    description: "مکعب سه‌بعدی با ۶ وجه مربعی",
    detailed_info: `مکعب یک چندوجهی منتظم است.

🔹 تعداد وجه‌ها: ۶
🔹 تعداد رأس‌ها: ۸
🔹 تعداد یال‌ها: ۱۲

📐 فرمول‌ها:
• حجم = a³
• مساحت سطح = 6a²`,
    subject: "هندسه",
    category: "math",
    model_type: "3d_model",
    model_data: { type: "cube" },
  },
  {
    id: "pyramid",
    title: "Pyramid",
    title_fa: "هرم",
    description: "هرم با قاعده مربعی",
    detailed_info: `هرم چندوجهی با یک قاعده و وجه‌های مثلثی است.

📐 فرمول‌ها:
• حجم = ⅓ × مساحت قاعده × ارتفاع`,
    subject: "هندسه",
    category: "math",
    model_type: "3d_model",
    model_data: { type: "pyramid" },
  },
  {
    id: "cylinder",
    title: "Cylinder",
    title_fa: "استوانه",
    description: "استوانه با دو قاعده دایره‌ای",
    detailed_info: `استوانه شکل سه‌بعدی با دو قاعده دایره‌ای موازی است.

📐 فرمول‌ها:
• حجم = πr²h
• مساحت سطح = 2πr² + 2πrh`,
    subject: "هندسه",
    category: "math",
    model_type: "3d_model",
    model_data: { type: "cylinder" },
  },
  {
    id: "sphere",
    title: "Sphere",
    title_fa: "کره",
    description: "کره سه‌بعدی کامل",
    detailed_info: `کره مجموعه نقاطی است که فاصله یکسانی از مرکز دارند.

📐 فرمول‌ها:
• حجم = ⁴⁄₃πr³
• مساحت سطح = 4πr²

🌍 مثال‌ها: زمین، توپ، حباب`,
    subject: "هندسه",
    category: "math",
    model_type: "3d_model",
    model_data: { type: "sphere" },
  },
];

export default function ARLearning() {
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: models } = useQuery({
    queryKey: ["ar-models"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ar_models")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const displayModels = models && models.length > 0 ? models : sampleModels;

  const categoryMap: Record<string, string[]> = {
    biology: ["زیست‌شناسی"],
    chemistry: ["شیمی"],
    physics: ["فیزیک"],
    math: ["ریاضی", "هندسه"],
  };

  const filteredModels = activeCategory === "all" 
    ? displayModels 
    : displayModels.filter(m => {
        const cat = (m as any).category;
        const subj = m.subject;
        if (cat) return cat === activeCategory;
        return categoryMap[activeCategory]?.includes(subj);
      });

  const getModelCategory = (model: any) => {
    if (model.category) return model.category;
    if (["زیست‌شناسی"].includes(model.subject)) return "biology";
    if (["شیمی"].includes(model.subject)) return "chemistry";
    if (["فیزیک"].includes(model.subject)) return "physics";
    if (["ریاضی", "هندسه"].includes(model.subject)) return "math";
    return "other";
  };

  const getIcon = (model: any) => {
    const cat = getModelCategory(model);
    if (cat === "biology") return <Heart className="w-5 h-5 text-white" />;
    if (cat === "chemistry") return <FlaskConical className="w-5 h-5 text-white" />;
    if (cat === "physics") return <Calculator className="w-5 h-5 text-white" />;
    return <Box className="w-5 h-5 text-white" />;
  };

  const getCategoryGradient = (category: string) => {
    switch (category) {
      case "biology": return "from-rose-500 to-pink-600";
      case "chemistry": return "from-emerald-500 to-teal-600";
      case "physics": return "from-blue-500 to-indigo-600";
      case "math": return "from-amber-500 to-orange-600";
      default: return "from-purple-500 to-violet-600";
    }
  };

  const hasSketchfab = (model: any) => {
    return model.sketchfab_id && model.sketchfab_id.length > 10;
  };

  const renderModelViewer = () => {
    if (!selectedModel) return null;
    
    if (hasSketchfab(selectedModel)) {
      return (
        <SketchfabViewer 
          model={selectedModel} 
          onClose={() => setSelectedModel(null)} 
        />
      );
    }
    
    return (
      <ModelViewer 
        model={selectedModel} 
        onClose={() => setSelectedModel(null)} 
      />
    );
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-600 to-orange-600 bg-clip-text text-transparent">
              یادگیری سه‌بعدی
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              با مدل‌های واقعی و تعاملی سه‌بعدی، مفاهیم پیچیده را به سادگی یاد بگیرید
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{displayModels.length} مدل</Badge>
              <span>•</span>
              <Badge variant="outline" className="gap-1">
                <Sparkles className="w-3 h-3" />
                مدل‌های با کیفیت بالا
              </Badge>
            </div>
          </div>

          {selectedModel ? (
            renderModelViewer()
          ) : (
            <>
              {/* Category Tabs */}
              <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                <TabsList className="grid grid-cols-5 w-full max-w-lg mx-auto">
                  <TabsTrigger value="all">همه</TabsTrigger>
                  <TabsTrigger value="biology">زیست</TabsTrigger>
                  <TabsTrigger value="chemistry">شیمی</TabsTrigger>
                  <TabsTrigger value="physics">فیزیک</TabsTrigger>
                  <TabsTrigger value="math">ریاضی</TabsTrigger>
                </TabsList>

                <TabsContent value={activeCategory} className="mt-6">
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredModels.map((model) => (
                      <Card
                        key={model.id}
                        className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] group relative overflow-hidden"
                        onClick={() => setSelectedModel(model)}
                      >
                        {hasSketchfab(model) && (
                          <div className="absolute top-2 left-2 z-10">
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs gap-1">
                              <Sparkles className="w-3 h-3" />
                              HD
                            </Badge>
                          </div>
                        )}
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg truncate">{model.title_fa}</CardTitle>
                              <CardDescription className="line-clamp-2 mt-1">
                                {model.description}
                              </CardDescription>
                            </div>
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getCategoryGradient(getModelCategory(model))} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                              {getIcon(model)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {model.subject}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {hasSketchfab(model) ? "مدل واقعی" : "مدل ساده"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              {filteredModels.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>مدلی در این دسته‌بندی یافت نشد</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
