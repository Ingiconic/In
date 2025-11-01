-- جدول پیام‌های ذخیره شده
CREATE TABLE IF NOT EXISTS public.saved_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('channel', 'group', 'direct')),
  message_id UUID NOT NULL,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- فهرست برای جستجوی سریع
CREATE INDEX idx_saved_messages_user ON public.saved_messages(user_id);

-- RLS برای پیام‌های ذخیره شده
ALTER TABLE public.saved_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their saved messages"
ON public.saved_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save messages"
ON public.saved_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved messages"
ON public.saved_messages FOR DELETE
USING (auth.uid() = user_id);

-- جدول نقش‌های کاربری
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- RLS برای user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- فانکشن برای چک کردن نقش
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- پالیسی برای مشاهده نقش‌ها (فقط ادمین‌ها)
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- پالیسی برای افزودن نقش (فقط ادمین‌ها)
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- جدول آمار بازدید برای پنل ادمین
CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_path TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_page_views_date ON public.page_views(viewed_at);
CREATE INDEX idx_page_views_user ON public.page_views(user_id);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view page views"
ON public.page_views FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert page views"
ON public.page_views FOR INSERT
WITH CHECK (true);

-- اضافه کردن داده‌های جزوات هشتم
INSERT INTO public.study_books (title, grade, field, subject, book_type, content) VALUES
('ریاضی هشتم - فصل 1: مجموعه‌ها', '8', NULL, 'ریاضی', 'textbook', 'محتوای کامل فصل اول ریاضی هشتم درباره مجموعه‌ها شامل مفاهیم پایه، عملیات روی مجموعه‌ها و کاربردهای آن'),
('ریاضی هشتم - فصل 2: عددهای صحیح', '8', NULL, 'ریاضی', 'textbook', 'محتوای کامل فصل دوم ریاضی هشتم درباره اعداد صحیح، خواص و محاسبات'),
('علوم هشتم - فصل 1: جانوران', '8', NULL, 'علوم', 'textbook', 'محتوای کامل فصل اول علوم هشتم درباره انواع جانوران و ویژگی‌های آنها'),
('علوم هشتم - فصل 2: گیاهان', '8', NULL, 'علوم', 'textbook', 'محتوای کامل فصل دوم علوم هشتم درباره گیاهان، فتوسنتز و تنفس گیاهی'),
('فارسی هشتم - درس 1: ادبیات فارسی', '8', NULL, 'فارسی', 'textbook', 'محتوای درس اول فارسی هشتم شامل شعر و نثر'),
('مطالعات اجتماعی هشتم - فصل 1: تاریخ ایران', '8', NULL, 'مطالعات', 'textbook', 'محتوای فصل اول مطالعات اجتماعی درباره تاریخ ایران')
ON CONFLICT DO NOTHING;

-- اضافه کردن حل گام به گام برای کلاس هشتم
INSERT INTO public.step_by_step_solutions (grade, field, subject, page_number, question_number, solution) VALUES
('8', NULL, 'ریاضی', 15, 1, 'گام 1: مجموعه A را تعریف کنید\nگام 2: مجموعه B را تعریف کنید\nگام 3: اشتراک دو مجموعه را پیدا کنید\nجواب: {2, 4, 6}'),
('8', NULL, 'ریاضی', 15, 2, 'گام 1: اعداد اول کوچکتر از 10 را پیدا کنید\nگام 2: آنها را در مجموعه بنویسید\nجواب: {2, 3, 5, 7}'),
('8', NULL, 'ریاضی', 23, 1, 'گام 1: عدد منفی را با مثبت جمع کنید\nگام 2: علامت عدد بزرگتر را بگذارید\nجواب: -3'),
('8', NULL, 'علوم', 10, 1, 'گام 1: ویژگی‌های مهره‌داران را بنویسید\nگام 2: آنها را دسته‌بندی کنید\nجواب: ماهی، دوزیست، خزنده، پرنده، پستاندار'),
('8', NULL, 'علوم', 25, 3, 'گام 1: فرایند فتوسنتز را توضیح دهید\nگام 2: معادله شیمیایی را بنویسید\nجواب: CO2 + H2O + نور → گلوکز + اکسیژن')
ON CONFLICT DO NOTHING;