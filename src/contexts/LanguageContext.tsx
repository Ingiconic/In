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
      logout: "خروج",
      blog: "وبلاگ",
      shop: "فروشگاه",
      flashcards: "فلش کارت",
      mindMap: "نقشه ذهنی",
      coinShop: "فروشگاه سکه"
    },
    header: {
      level: "سطح",
      points: "امتیاز",
      coins: "سکه"
    },
    dashboard: {
      welcome: "سلام",
      welcomeMessage: "به ایزی درس خوش اومدی - همه ابزارهای یادگیری در یک جا!",
      quickAccess: "دسترسی سریع",
      recentActivity: "فعالیت‌های اخیر",
      studyStats: "آمار مطالعه",
      exams: "آزمون‌ها",
      flashcards: "فلش کارت‌ها",
      resources: "منابع من",
      studyPlan: "برنامه مطالعاتی",
      totalPoints: "مجموع امتیاز",
      examsTaken: "آزمون‌های گرفته شده",
      messagesSent: "پیام‌های ارسالی",
      friends: "دوستان",
      studyPlans: "برنامه‌های مطالعاتی",
      features: "امکانات",
      aiTools: "ابزارهای هوشمند",
      learningFeatures: "ویژگی‌های یادگیری",
      socialFeatures: "ویژگی‌های اجتماعی",
      coinShop: "فروشگاه سکه",
      coinShopDesc: "خرید سکه و امتیاز",
      chatDesc: "چت گروهی با دوستان",
      friendsDesc: "مدیریت دوستان",
      questionsDesc: "پرسش از هوش مصنوعی",
      summarizeDesc: "خلاصه‌سازی متون",
      examDesc: "آزمون‌ساز هوشمند",
      flashcardDesc: "فلش کارت یادگیری",
      mindmapDesc: "نقشه ذهنی هوشمند",
      studyPlanDesc: "برنامه‌ریز مطالعاتی",
      progressDesc: "پیگیری پیشرفت",
      consultationDesc: "مشاوره هوشمند"
    },
    auth: {
      login: "ورود",
      signup: "ثبت نام",
      username: "نام کاربری",
      fullName: "نام کامل",
      password: "رمز عبور",
      forgotPassword: "فراموشی رمز عبور",
      noAccount: "حساب کاربری ندارید؟",
      haveAccount: "حساب کاربری دارید؟",
      welcomeBack: "خوش اومدی! 👋",
      loginMessage: "لطفا وارد حساب کاربری خود شوید",
      createAccount: "حساب کاربری بسازید",
      signupMessage: "برای شروع، لطفا اطلاعات خود را وارد کنید",
      loginButton: "ورود به حساب",
      signupButton: "ایجاد حساب",
      backToLogin: "بازگشت به ورود",
      goToSignup: "ثبت نام کنید",
      fillAllFields: "لطفا تمام فیلدها را پر کنید",
      invalidCredentials: "نام کاربری یا رمز عبور اشتباه است",
      welcomeSuccess: "خوش آمدید! 🎉",
      loginSuccess: "ورود موفقیت‌آمیز بود",
      passwordMinLength: "رمز عبور باید حداقل ۶ کاراکتر باشد",
      usernameExists: "این نام کاربری قبلاً ثبت شده است",
      accountCreated: "حساب شما با موفقیت ساخته شد",
      problemOccurred: "مشکلی پیش آمد"
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
      confirm: "تأیید",
      user: "کاربر"
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
      logout: "Logout",
      blog: "Blog",
      shop: "Shop",
      flashcards: "Flashcards",
      mindMap: "Mind Map",
      coinShop: "Coin Shop"
    },
    header: {
      level: "Level",
      points: "Points",
      coins: "Coins"
    },
    dashboard: {
      welcome: "Hello",
      welcomeMessage: "Welcome to EasyDers - all learning tools in one place!",
      quickAccess: "Quick Access",
      recentActivity: "Recent Activity",
      studyStats: "Study Stats",
      exams: "Exams",
      flashcards: "Flashcards",
      resources: "My Resources",
      studyPlan: "Study Plan",
      totalPoints: "Total Points",
      examsTaken: "Exams Taken",
      messagesSent: "Messages Sent",
      friends: "Friends",
      studyPlans: "Study Plans",
      features: "Features",
      aiTools: "AI Tools",
      learningFeatures: "Learning Features",
      socialFeatures: "Social Features",
      coinShop: "Coin Shop",
      coinShopDesc: "Buy coins and points",
      chatDesc: "Group chat with friends",
      friendsDesc: "Manage friends",
      questionsDesc: "Ask AI questions",
      summarizeDesc: "Summarize texts",
      examDesc: "Smart exam creator",
      flashcardDesc: "Learning flashcards",
      mindmapDesc: "Smart mind map",
      studyPlanDesc: "Study planner",
      progressDesc: "Track progress",
      consultationDesc: "Smart consultation"
    },
    auth: {
      login: "Login",
      signup: "Sign Up",
      username: "Username",
      fullName: "Full Name",
      password: "Password",
      forgotPassword: "Forgot Password",
      noAccount: "Don't have an account?",
      haveAccount: "Already have an account?",
      welcomeBack: "Welcome back! 👋",
      loginMessage: "Please login to your account",
      createAccount: "Create Account",
      signupMessage: "To get started, please fill in your information",
      loginButton: "Login to Account",
      signupButton: "Create Account",
      backToLogin: "Back to Login",
      goToSignup: "Sign Up",
      fillAllFields: "Please fill in all fields",
      invalidCredentials: "Invalid username or password",
      welcomeSuccess: "Welcome! 🎉",
      loginSuccess: "Login successful",
      passwordMinLength: "Password must be at least 6 characters",
      usernameExists: "This username is already taken",
      accountCreated: "Your account has been created successfully",
      problemOccurred: "A problem occurred"
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
      confirm: "Confirm",
      user: "User"
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
      logout: "تسجيل الخروج",
      blog: "المدونة",
      shop: "المتجر",
      flashcards: "البطاقات التعليمية",
      mindMap: "الخريطة الذهنية",
      coinShop: "متجر العملات"
    },
    header: {
      level: "المستوى",
      points: "النقاط",
      coins: "العملات"
    },
    dashboard: {
      welcome: "مرحباً",
      welcomeMessage: "مرحباً بك في إيزي درس - جميع أدوات التعلم في مكان واحد!",
      quickAccess: "وصول سريع",
      recentActivity: "النشاط الأخير",
      studyStats: "إحصائيات الدراسة",
      exams: "الاختبارات",
      flashcards: "البطاقات التعليمية",
      resources: "مواردي",
      studyPlan: "خطة الدراسة",
      totalPoints: "مجموع النقاط",
      examsTaken: "الاختبارات المأخوذة",
      messagesSent: "الرسائل المرسلة",
      friends: "الأصدقاء",
      studyPlans: "خطط الدراسة",
      features: "المميزات",
      aiTools: "أدوات الذكاء الاصطناعي",
      learningFeatures: "مميزات التعلم",
      socialFeatures: "المميزات الاجتماعية",
      coinShop: "متجر العملات",
      coinShopDesc: "شراء العملات والنقاط",
      chatDesc: "الدردشة الجماعية مع الأصدقاء",
      friendsDesc: "إدارة الأصدقاء",
      questionsDesc: "اسأل الذكاء الاصطناعي",
      summarizeDesc: "تلخيص النصوص",
      examDesc: "منشئ اختبارات ذكي",
      flashcardDesc: "بطاقات تعليمية",
      mindmapDesc: "خريطة ذهنية ذكية",
      studyPlanDesc: "مخطط الدراسة",
      progressDesc: "تتبع التقدم",
      consultationDesc: "استشارة ذكية"
    },
    auth: {
      login: "تسجيل الدخول",
      signup: "إنشاء حساب",
      username: "اسم المستخدم",
      fullName: "الاسم الكامل",
      password: "كلمة المرور",
      forgotPassword: "نسيت كلمة المرور",
      noAccount: "ليس لديك حساب؟",
      haveAccount: "لديك حساب بالفعل؟",
      welcomeBack: "مرحباً بعودتك! 👋",
      loginMessage: "يرجى تسجيل الدخول إلى حسابك",
      createAccount: "إنشاء حساب",
      signupMessage: "للبدء، يرجى ملء معلوماتك",
      loginButton: "تسجيل الدخول",
      signupButton: "إنشاء الحساب",
      backToLogin: "العودة إلى تسجيل الدخول",
      goToSignup: "إنشاء حساب",
      fillAllFields: "يرجى ملء جميع الحقول",
      invalidCredentials: "اسم المستخدم أو كلمة المرور غير صحيحة",
      welcomeSuccess: "مرحباً! 🎉",
      loginSuccess: "تم تسجيل الدخول بنجاح",
      passwordMinLength: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
      usernameExists: "اسم المستخدم هذا مسجل بالفعل",
      accountCreated: "تم إنشاء حسابك بنجاح",
      problemOccurred: "حدثت مشكلة"
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
      confirm: "تأكيد",
      user: "مستخدم"
    }
  }
};
