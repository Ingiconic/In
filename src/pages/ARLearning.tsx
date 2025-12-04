import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Box, Calculator, FlaskConical, Heart, Brain, Eye, Ear } from "lucide-react";
import ModelViewer from "@/components/ar/ModelViewer";
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";

// 30+ 3D Models with detailed Persian descriptions
const sampleModels = [
  // === زیست‌شناسی - بدن انسان ===
  {
    id: "brain",
    title: "Brain",
    title_fa: "مغز انسان",
    description: "مدل سه‌بعدی مغز با نیم‌کره‌ها و ساقه مغز",
    detailed_info: `مغز مرکز فرماندهی بدن انسان است و از حدود ۸۶ میلیارد نورون تشکیل شده.

🔹 نیم‌کره چپ: مسئول تفکر منطقی، ریاضیات و زبان
🔹 نیم‌کره راست: مسئول خلاقیت، هنر و تخیل
🔹 مخچه: کنترل تعادل و هماهنگی حرکات
🔹 ساقه مغز: کنترل تنفس، ضربان قلب و هضم

وزن مغز: حدود ۱.۴ کیلوگرم
مصرف انرژی: ۲۰٪ از کل انرژی بدن`,
    subject: "زیست‌شناسی",
    category: "biology",
    model_type: "3d_model",
    model_data: { type: "brain" },
  },
  {
    id: "heart",
    title: "Heart",
    title_fa: "قلب انسان",
    description: "ساختار قلب با چهار حفره و عروق اصلی",
    detailed_info: `قلب یک پمپ عضلانی است که خون را در بدن به گردش در می‌آورد.

🔹 دهلیز راست: دریافت خون کم‌اکسیژن از بدن
🔹 بطن راست: ارسال خون به ریه‌ها
🔹 دهلیز چپ: دریافت خون پراکسیژن از ریه‌ها
🔹 بطن چپ: پمپ خون به کل بدن

🫀 ضربان قلب: ۶۰-۱۰۰ بار در دقیقه
🩸 حجم خون پمپ شده: ۵ لیتر در دقیقه`,
    subject: "زیست‌شناسی",
    category: "biology",
    model_type: "3d_model",
    model_data: { type: "heart" },
  },
  {
    id: "eye",
    title: "Eye",
    title_fa: "چشم انسان",
    description: "ساختار کامل چشم با عدسی و شبکیه",
    detailed_info: `چشم اندام بینایی است که نور را به سیگنال‌های عصبی تبدیل می‌کند.

🔹 قرنیه: لایه شفاف جلوی چشم
🔹 عنبیه (عدسی): تنظیم نور ورودی
🔹 مردمک: سوراخ مرکزی عنبیه
🔹 شبکیه: لایه حساس به نور
🔹 عصب بینایی: انتقال سیگنال به مغز

👁️ تعداد سلول‌های گیرنده نور: ۱۲۰ میلیون میله‌ای + ۶ میلیون مخروطی`,
    subject: "زیست‌شناسی",
    category: "biology",
    model_type: "3d_model",
    model_data: { type: "eye" },
  },
  {
    id: "ear",
    title: "Ear",
    title_fa: "گوش انسان",
    description: "ساختار گوش با مجرا و حلزون شنوایی",
    detailed_info: `گوش اندام شنوایی و تعادل بدن است.

🔹 گوش خارجی: جمع‌آوری امواج صوتی
🔹 پرده گوش: ارتعاش با صدا
🔹 استخوان‌چه‌ها: چکشی، سندانی، رکابی
🔹 حلزون (کوکلئا): تبدیل ارتعاش به سیگنال عصبی
🔹 مجاری نیم‌دایره: حفظ تعادل

👂 محدوده شنوایی: ۲۰ تا ۲۰,۰۰۰ هرتز`,
    subject: "زیست‌شناسی",
    category: "biology",
    model_type: "3d_model",
    model_data: { type: "ear" },
  },
  {
    id: "lung",
    title: "Lungs",
    title_fa: "ریه‌ها",
    description: "سیستم تنفسی با نای و برونش‌ها",
    detailed_info: `ریه‌ها اندام تنفسی هستند که اکسیژن را جذب و دی‌اکسید کربن را دفع می‌کنند.

🔹 نای (تراشه): لوله اصلی هوا
🔹 برونش‌ها: شاخه‌های نای
🔹 برونشیول‌ها: شاخه‌های کوچک‌تر
🔹 کیسه‌های هوایی (آلوئول): محل تبادل گاز

🫁 تعداد آلوئول‌ها: حدود ۳۰۰ میلیون
💨 ظرفیت ریه: ۶ لیتر هوا`,
    subject: "زیست‌شناسی",
    category: "biology",
    model_type: "3d_model",
    model_data: { type: "lung" },
  },
  {
    id: "kidney",
    title: "Kidney",
    title_fa: "کلیه",
    description: "ساختار کلیه با نفرون و حالب",
    detailed_info: `کلیه‌ها خون را تصفیه کرده و ادرار تولید می‌کنند.

🔹 قشر کلیه: بخش خارجی
🔹 مدولا: بخش داخلی
🔹 نفرون: واحد عملکردی (هر کلیه ۱ میلیون)
🔹 لگنچه: جمع‌آوری ادرار
🔹 حالب: انتقال ادرار به مثانه

🫘 حجم خون تصفیه شده: ۱۸۰ لیتر در روز
💧 تولید ادرار: ۱-۲ لیتر در روز`,
    subject: "زیست‌شناسی",
    category: "biology",
    model_type: "3d_model",
    model_data: { type: "kidney" },
  },
  {
    id: "stomach",
    title: "Stomach",
    title_fa: "معده",
    description: "ساختار معده با مری و دوازدهه",
    detailed_info: `معده اندام گوارشی است که غذا را ذخیره و هضم می‌کند.

🔹 کاردیا: ورودی معده
🔹 فوندوس: بخش بالایی
🔹 بدنه: بخش اصلی
🔹 پیلور: خروجی معده
🔹 چین‌های معده: افزایش سطح

🍽️ ظرفیت: ۱-۱.۵ لیتر
⏱️ زمان تخلیه: ۴-۵ ساعت
🧪 pH اسید معده: ۱.۵-۳.۵`,
    subject: "زیست‌شناسی",
    category: "biology",
    model_type: "3d_model",
    model_data: { type: "stomach" },
  },
  {
    id: "liver",
    title: "Liver",
    title_fa: "کبد",
    description: "بزرگترین غده بدن با لوب‌های اصلی",
    detailed_info: `کبد بزرگترین اندام داخلی و غده بدن است.

🔹 لوب راست: بزرگتر
🔹 لوب چپ: کوچکتر
🔹 کیسه صفرا: ذخیره صفرا
🔹 سیاهرگ باب: ورود خون از روده

⚙️ وظایف اصلی:
• تولید صفرا برای هضم چربی
• ذخیره گلیکوژن
• سم‌زدایی خون
• تولید پروتئین‌های پلاسما

⚖️ وزن: ۱.۵ کیلوگرم`,
    subject: "زیست‌شناسی",
    category: "biology",
    model_type: "3d_model",
    model_data: { type: "liver" },
  },
  {
    id: "tooth",
    title: "Tooth",
    title_fa: "دندان",
    description: "ساختار دندان با مینا، عاج و پالپ",
    detailed_info: `دندان برای جویدن و خرد کردن غذا استفاده می‌شود.

🔹 مینا: سخت‌ترین بافت بدن (لایه خارجی)
🔹 عاج: لایه زیر مینا
🔹 پالپ: بافت نرم داخلی (عصب و رگ)
🔹 ریشه: بخش داخل لثه
🔹 سمان: پوشش ریشه

🦷 تعداد دندان‌های شیری: ۲۰
🦷 تعداد دندان‌های دائمی: ۳۲`,
    subject: "زیست‌شناسی",
    category: "biology",
    model_type: "3d_model",
    model_data: { type: "tooth" },
  },
  {
    id: "spine",
    title: "Spine",
    title_fa: "ستون فقرات",
    description: "مهره‌های ستون فقرات با دیسک‌های بین‌مهره‌ای",
    detailed_info: `ستون فقرات محور اصلی اسکلت و محافظ نخاع است.

🔹 مهره‌های گردنی: ۷ عدد
🔹 مهره‌های سینه‌ای: ۱۲ عدد
🔹 مهره‌های کمری: ۵ عدد
🔹 خاجی: ۵ مهره جوش‌خورده
🔹 دنبالچه: ۴ مهره جوش‌خورده

💙 دیسک‌های بین‌مهره‌ای: ضربه‌گیر
🔗 مجموع: ۳۳ مهره`,
    subject: "زیست‌شناسی",
    category: "biology",
    model_type: "3d_model",
    model_data: { type: "spine" },
  },
  {
    id: "neuron",
    title: "Neuron",
    title_fa: "نورون (سلول عصبی)",
    description: "ساختار نورون با آکسون و دندریت",
    detailed_info: `نورون واحد ساختاری و عملکردی سیستم عصبی است.

🔹 جسم سلولی (سوما): مرکز سلول
🔹 هسته: حاوی DNA
🔹 دندریت‌ها: دریافت پیام عصبی
🔹 آکسون: انتقال پیام عصبی
🔹 پایانه‌های آکسون: ترشح انتقال‌دهنده

⚡ سرعت انتقال پیام: تا ۱۲۰ متر بر ثانیه
🧠 تعداد نورون‌های مغز: ۸۶ میلیارد`,
    subject: "زیست‌شناسی",
    category: "biology",
    model_type: "3d_model",
    model_data: { type: "neuron" },
  },
  {
    id: "dna",
    title: "DNA",
    title_fa: "دی‌ان‌ای (DNA)",
    description: "ساختار مارپیچ دوگانه DNA",
    detailed_info: `DNA حامل اطلاعات ژنتیکی موجودات زنده است.

🔹 ساختار: مارپیچ دوگانه
🔹 واحدها: نوکلئوتیدها
🔹 بازهای آلی: A-T و G-C
🔹 قند: دئوکسی‌ریبوز
🔹 فسفات: اتصال نوکلئوتیدها

🧬 طول DNA انسان: ۲ متر در هر سلول
📚 تعداد ژن‌ها: حدود ۲۰,۰۰۰`,
    subject: "زیست‌شناسی",
    category: "biology",
    model_type: "3d_model",
    model_data: { type: "dna" },
  },
  {
    id: "cell",
    title: "Animal Cell",
    title_fa: "سلول جانوری",
    description: "ساختار سلول با هسته و اندامک‌ها",
    detailed_info: `سلول واحد ساختاری و عملکردی موجودات زنده است.

🔹 غشای پلاسمایی: کنترل ورود و خروج مواد
🔹 هسته: مرکز کنترل سلول
🔹 میتوکندری: تولید انرژی (ATP)
🔹 ریبوزوم: ساخت پروتئین
🔹 شبکه آندوپلاسمی: انتقال مواد

🔬 اندازه سلول: ۱۰-۱۰۰ میکرومتر
⚡ تعداد میتوکندری: ۱۰۰۰-۲۰۰۰`,
    subject: "زیست‌شناسی",
    category: "biology",
    model_type: "3d_model",
    model_data: { type: "cell" },
  },
  {
    id: "bone",
    title: "Bone",
    title_fa: "استخوان",
    description: "ساختار استخوان دراز با اپی‌فیز و دیافیز",
    detailed_info: `استخوان بافت سخت محافظ و حمایت‌کننده بدن است.

🔹 اپی‌فیز: سر استخوان
🔹 دیافیز: تنه استخوان
🔹 پریوست: غشای خارجی
🔹 مغز استخوان: تولید سلول‌های خون
🔹 بافت متراکم: لایه خارجی سخت

🦴 تعداد استخوان‌های بدن: ۲۰۶
💪 سخت‌ترین استخوان: استخوان ران`,
    subject: "زیست‌شناسی",
    category: "biology",
    model_type: "3d_model",
    model_data: { type: "bone" },
  },
  {
    id: "muscle",
    title: "Muscle",
    title_fa: "عضله",
    description: "ساختار عضله اسکلتی با تاندون",
    detailed_info: `عضله بافت انقباض‌پذیر برای حرکت است.

🔹 عضله اسکلتی: حرکات ارادی
🔹 عضله قلبی: پمپاژ قلب
🔹 عضله صاف: اندام‌های داخلی
🔹 تاندون: اتصال عضله به استخوان
🔹 فیبر عضلانی: واحد ساختاری

💪 تعداد عضلات بدن: بیش از ۶۰۰
⚡ سریع‌ترین عضله: عضله پلک`,
    subject: "زیست‌شناسی",
    category: "biology",
    model_type: "3d_model",
    model_data: { type: "muscle" },
  },
  {
    id: "skin",
    title: "Skin Layers",
    title_fa: "لایه‌های پوست",
    description: "ساختار سه لایه‌ای پوست",
    detailed_info: `پوست بزرگترین اندام بدن و محافظ اولیه است.

🔹 اپیدرم: لایه خارجی (بدون رگ)
🔹 درم: لایه میانی (رگ و عصب)
🔹 هیپودرم: لایه چربی زیرین
🔹 فولیکول مو: ریشه مو
🔹 غده عرق: تنظیم دما

📏 مساحت پوست: ۱.۵-۲ متر مربع
⚖️ وزن پوست: ۳-۴ کیلوگرم`,
    subject: "زیست‌شناسی",
    category: "biology",
    model_type: "3d_model",
    model_data: { type: "skin" },
  },
  {
    id: "intestine",
    title: "Intestine",
    title_fa: "روده",
    description: "ساختار روده کوچک با پرزها",
    detailed_info: `روده محل اصلی جذب مواد غذایی است.

🔹 روده کوچک: ۶-۷ متر
  • دوازدهه: هضم شیمیایی
  • ژژنوم: جذب مواد
  • ایلئوم: جذب ویتامین B12
🔹 روده بزرگ: ۱.۵ متر
🔹 پرزها: افزایش سطح جذب

🍽️ سطح جذب: ۲۵۰ متر مربع
⏱️ زمان عبور غذا: ۲۴-۷۲ ساعت`,
    subject: "زیست‌شناسی",
    category: "biology",
    model_type: "3d_model",
    model_data: { type: "intestine" },
  },
  {
    id: "blood",
    title: "Blood Cells",
    title_fa: "سلول‌های خون",
    description: "گلبول قرمز، سفید و پلاکت",
    detailed_info: `خون بافت مایع انتقال‌دهنده اکسیژن و مواد است.

🔴 گلبول قرمز: حمل اکسیژن
  • تعداد: ۵ میلیون در میلی‌متر مکعب
  • عمر: ۱۲۰ روز
⚪ گلبول سفید: دفاع ایمنی
  • تعداد: ۵-۱۰ هزار
🟡 پلاکت: انعقاد خون
  • تعداد: ۱۵۰-۴۰۰ هزار

🩸 حجم خون: ۵ لیتر`,
    subject: "زیست‌شناسی",
    category: "biology",
    model_type: "3d_model",
    model_data: { type: "blood" },
  },

  // === شیمی ===
  {
    id: "atom",
    title: "Atom Model",
    title_fa: "مدل اتم",
    description: "ساختار اتم با هسته و الکترون‌ها",
    detailed_info: `اتم کوچکترین واحد ماده است.

🔹 هسته: پروتون (+) و نوترون (۰)
🔹 الکترون: ذرات منفی در مدار
🔹 لایه‌های الکترونی: K, L, M, N...
🔹 عدد اتمی: تعداد پروتون‌ها
🔹 عدد جرمی: پروتون + نوترون

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
🔹 قطبیت: مولکول قطبی

💧 ویژگی‌ها:
• نقطه جوش: ۱۰۰°C
• نقطه انجماد: ۰°C
• چگالی یخ کمتر از آب مایع
• حلال عالی`,
    subject: "شیمی",
    category: "chemistry",
    model_type: "3d_model",
    model_data: { type: "water" },
  },

  // === ریاضی و هندسه ===
  {
    id: "cube",
    title: "Cube",
    title_fa: "مکعب",
    description: "مکعب سه‌بعدی با ۶ وجه مربعی",
    detailed_info: `مکعب یک چندوجهی منتظم با ۶ وجه مربعی است.

🔹 تعداد وجه‌ها: ۶
🔹 تعداد رأس‌ها: ۸
🔹 تعداد یال‌ها: ۱۲
🔹 زاویه‌ها: همه ۹۰ درجه

📐 فرمول‌ها:
• حجم = a³
• مساحت سطح = 6a²
• قطر فضایی = a√3`,
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

🔹 قاعده: مربع یا چندضلعی
🔹 وجه‌های جانبی: مثلث
🔹 رأس: نقطه اتصال مثلث‌ها

📐 فرمول‌ها:
• حجم = ⅓ × مساحت قاعده × ارتفاع
• مساحت جانبی = ½ × محیط قاعده × آپوتم`,
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

🔹 قاعده‌ها: دو دایره موازی
🔹 سطح جانبی: مستطیل پیچیده
🔹 محور: خط واصل مراکز قاعده‌ها

📐 فرمول‌ها:
• حجم = πr²h
• مساحت سطح = 2πr² + 2πrh
• مساحت جانبی = 2πrh`,
    subject: "هندسه",
    category: "math",
    model_type: "3d_model",
    model_data: { type: "cylinder" },
  },
  {
    id: "triangle",
    title: "Pythagorean Theorem",
    title_fa: "قضیه فیثاغورث",
    description: "مثلث قائم‌الزاویه سه‌بعدی",
    detailed_info: `قضیه فیثاغورث رابطه بین اضلاع مثلث قائم‌الزاویه را بیان می‌کند.

📐 فرمول: a² + b² = c²

🔹 a و b: دو ضلع زاویه قائمه
🔹 c: وتر (ضلع روبروی زاویه قائمه)

🔺 کاربردها:
• محاسبه فاصله
• معماری و ساختمان
• ناوبری دریایی
• طراحی گرافیکی`,
    subject: "ریاضی",
    category: "math",
    model_type: "3d_model",
    model_data: { type: "triangle" },
  },
  {
    id: "sphere",
    title: "Sphere",
    title_fa: "کره",
    description: "کره سه‌بعدی کامل",
    detailed_info: `کره مجموعه نقاطی است که فاصله یکسانی از مرکز دارند.

🔹 مرکز: نقطه میانی
🔹 شعاع: فاصله از مرکز تا سطح
🔹 قطر: دو برابر شعاع

📐 فرمول‌ها:
• حجم = ⁴⁄₃πr³
• مساحت سطح = 4πr²

🌍 مثال‌ها: زمین، توپ، حباب`,
    subject: "هندسه",
    category: "math",
    model_type: "3d_model",
    model_data: { type: "sphere" },
  },

  // === فیزیک ===
  {
    id: "sine_wave",
    title: "Sine Wave",
    title_fa: "موج سینوسی",
    description: "نمایش تابع سینوس",
    detailed_info: `موج سینوسی یک موج تناوبی هموار است.

🔹 فرمول: y = A sin(ωt + φ)
🔹 A: دامنه (ارتفاع موج)
🔹 ω: بسامد زاویه‌ای
🔹 φ: فاز اولیه

🌊 کاربردها:
• امواج صوتی
• امواج الکترومغناطیسی
• جریان متناوب برق
• ارتعاشات مکانیکی`,
    subject: "فیزیک",
    category: "physics",
    model_type: "formula",
    model_data: { type: "sphere", formula: "y = sin(x)" },
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
              با مدل‌های تعاملی سه‌بعدی، مفاهیم پیچیده را به سادگی یاد بگیرید
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{displayModels.length} مدل</Badge>
              <span>•</span>
              <span>چرخش و زوم با موس</span>
            </div>
          </div>

          {selectedModel ? (
            <ModelViewer model={selectedModel} onClose={() => setSelectedModel(null)} />
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
                        className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] group"
                        onClick={() => setSelectedModel(model)}
                      >
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
                              {model.model_type === "3d_model" ? "مدل 3D" : "فرمول"}
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
