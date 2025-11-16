import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "fa" | "en" | "ar";
type Direction = "rtl" | "ltr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  direction: Direction;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "fa";
  });

  const direction: Direction = language === "en" ? "ltr" : "rtl";

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [language, direction]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const keys = key.split(".");
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, direction, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const translations = {
  fa: {
    app: {
      name: "ایزی درس",
      tagline: "یادگیری هوشمند، موفقیت تضمین شده"
    },
    nav: {
      dashboard: "داشبورد",
      chat: "پیام‌رسان",
      friends: "دوستان",
      questions: "پرسش درسی",
      summarize: "خلاصه‌سازی",
      exam: "آزمون ساز",
      stepByStep: "حل تمرین",
      consultation: "مشاور هوشمند",
      progress: "پیشرفت من",
      profile: "پروفایل",
      about: "درباره ما",
      logout: "خروج"
    },
    header: {
      level: "سطح",
      points: "امتیاز"
    },
    dashboard: {
      welcome: "خوش آمدید",
      quickAccess: "دسترسی سریع",
      recentActivity: "فعالیت‌های اخیر",
      studyStats: "آمار مطالعه",
      exams: "آزمون‌ها",
      flashcards: "فلش کارت‌ها",
      resources: "منابع",
      studyPlan: "برنامه مطالعاتی"
    },
    auth: {
      login: "ورود",
      signup: "ثبت نام",
      email: "ایمیل",
      password: "رمز عبور",
      forgotPassword: "فراموشی رمز عبور",
      noAccount: "حساب کاربری ندارید؟",
      haveAccount: "حساب کاربری دارید؟"
    },
    common: {
      save: "ذخیره",
      cancel: "انصراف",
      delete: "حذف",
      edit: "ویرایش",
      create: "ایجاد",
      search: "جستجو",
      loading: "در حال بارگذاری...",
      error: "خطا",
      success: "موفق",
      confirm: "تأیید"
    }
  },
  en: {
    app: {
      name: "EasyDers",
      tagline: "Smart Learning, Guaranteed Success"
    },
    nav: {
      dashboard: "Dashboard",
      chat: "Chat",
      friends: "Friends",
      questions: "Questions",
      summarize: "Summarize",
      exam: "Exam Creator",
      stepByStep: "Step by Step",
      consultation: "AI Consultant",
      progress: "My Progress",
      profile: "Profile",
      about: "About Us",
      logout: "Logout"
    },
    header: {
      level: "Level",
      points: "Points"
    },
    dashboard: {
      welcome: "Welcome",
      quickAccess: "Quick Access",
      recentActivity: "Recent Activity",
      studyStats: "Study Stats",
      exams: "Exams",
      flashcards: "Flashcards",
      resources: "Resources",
      studyPlan: "Study Plan"
    },
    auth: {
      login: "Login",
      signup: "Sign Up",
      email: "Email",
      password: "Password",
      forgotPassword: "Forgot Password",
      noAccount: "Don't have an account?",
      haveAccount: "Already have an account?"
    },
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      create: "Create",
      search: "Search",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      confirm: "Confirm"
    }
  },
  ar: {
    app: {
      name: "إيزي درس",
      tagline: "تعلم ذكي، نجاح مضمون"
    },
    nav: {
      dashboard: "لوحة التحكم",
      chat: "الدردشة",
      friends: "الأصدقاء",
      questions: "الأسئلة",
      summarize: "التلخيص",
      exam: "منشئ الاختبار",
      stepByStep: "خطوة بخطوة",
      consultation: "مستشار الذكاء الاصطناعي",
      progress: "تقدمي",
      profile: "الملف الشخصي",
      about: "من نحن",
      logout: "تسجيل الخروج"
    },
    header: {
      level: "المستوى",
      points: "النقاط"
    },
    dashboard: {
      welcome: "مرحباً",
      quickAccess: "وصول سريع",
      recentActivity: "النشاط الأخير",
      studyStats: "إحصائيات الدراسة",
      exams: "الاختبارات",
      flashcards: "البطاقات التعليمية",
      resources: "الموارد",
      studyPlan: "خطة الدراسة"
    },
    auth: {
      login: "تسجيل الدخول",
      signup: "إنشاء حساب",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      forgotPassword: "نسيت كلمة المرور",
      noAccount: "ليس لديك حساب؟",
      haveAccount: "لديك حساب بالفعل؟"
    },
    common: {
      save: "حفظ",
      cancel: "إلغاء",
      delete: "حذف",
      edit: "تعديل",
      create: "إنشاء",
      search: "بحث",
      loading: "جاري التحميل...",
      error: "خطأ",
      success: "نجاح",
      confirm: "تأكيد"
    }
  }
};
