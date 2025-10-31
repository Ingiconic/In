import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, BookOpen, Search, ExternalLink } from "lucide-react";

const StudyBooksWithPDF = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");

  // جزوات برای پایه‌های ۱ تا ۹ با لینک‌های hamyar.in
  const books = [
    // پایه اول
    { grade: "1", subject: "فارسی", title: "جزوه فارسی اول ابتدایی", link: "https://hamyar.in/book/farsi-1" },
    { grade: "1", subject: "ریاضی", title: "جزوه ریاضی اول ابتدایی", link: "https://hamyar.in/book/math-1" },
    { grade: "1", subject: "علوم", title: "جزوه علوم اول ابتدایی", link: "https://hamyar.in/book/science-1" },
    
    // پایه دوم
    { grade: "2", subject: "فارسی", title: "جزوه فارسی دوم ابتدایی", link: "https://hamyar.in/book/farsi-2" },
    { grade: "2", subject: "ریاضی", title: "جزوه ریاضی دوم ابتدایی", link: "https://hamyar.in/book/math-2" },
    { grade: "2", subject: "علوم", title: "جزوه علوم دوم ابتدایی", link: "https://hamyar.in/book/science-2" },
    
    // پایه سوم
    { grade: "3", subject: "فارسی", title: "جزوه فارسی سوم ابتدایی", link: "https://hamyar.in/book/farsi-3" },
    { grade: "3", subject: "ریاضی", title: "جزوه ریاضی سوم ابتدایی", link: "https://hamyar.in/book/math-3" },
    { grade: "3", subject: "علوم", title: "جزوه علوم سوم ابتدایی", link: "https://hamyar.in/book/science-3" },
    
    // پایه چهارم
    { grade: "4", subject: "فارسی", title: "جزوه فارسی چهارم ابتدایی", link: "https://hamyar.in/book/farsi-4" },
    { grade: "4", subject: "ریاضی", title: "جزوه ریاضی چهارم ابتدایی", link: "https://hamyar.in/book/math-4" },
    { grade: "4", subject: "علوم", title: "جزوه علوم چهارم ابتدایی", link: "https://hamyar.in/book/science-4" },
    { grade: "4", subject: "مطالعات", title: "جزوه مطالعات اجتماعی چهارم", link: "https://hamyar.in/book/social-4" },
    
    // پایه پنجم
    { grade: "5", subject: "فارسی", title: "جزوه فارسی پنجم ابتدایی", link: "https://hamyar.in/book/farsi-5" },
    { grade: "5", subject: "ریاضی", title: "جزوه ریاضی پنجم ابتدایی", link: "https://hamyar.in/book/math-5" },
    { grade: "5", subject: "علوم", title: "جزوه علوم پنجم ابتدایی", link: "https://hamyar.in/book/science-5" },
    { grade: "5", subject: "مطالعات", title: "جزوه مطالعات اجتماعی پنجم", link: "https://hamyar.in/book/social-5" },
    
    // پایه ششم
    { grade: "6", subject: "فارسی", title: "جزوه فارسی ششم ابتدایی", link: "https://hamyar.in/book/farsi-6" },
    { grade: "6", subject: "ریاضی", title: "جزوه ریاضی ششم ابتدایی", link: "https://hamyar.in/book/math-6" },
    { grade: "6", subject: "علوم", title: "جزوه علوم ششم ابتدایی", link: "https://hamyar.in/book/science-6" },
    { grade: "6", subject: "مطالعات", title: "جزوه مطالعات اجتماعی ششم", link: "https://hamyar.in/book/social-6" },
    
    // پایه هفتم
    { grade: "7", subject: "فارسی", title: "جزوه فارسی هفتم", link: "https://hamyar.in/book/farsi-7" },
    { grade: "7", subject: "ریاضی", title: "جزوه ریاضی هفتم", link: "https://hamyar.in/book/math-7" },
    { grade: "7", subject: "علوم", title: "جزوه علوم هفتم", link: "https://hamyar.in/book/science-7" },
    { grade: "7", subject: "مطالعات", title: "جزوه مطالعات اجتماعی هفتم", link: "https://hamyar.in/book/social-7" },
    { grade: "7", subject: "عربی", title: "جزوه عربی هفتم", link: "https://hamyar.in/book/arabic-7" },
    
    // پایه هشتم
    { grade: "8", subject: "فارسی", title: "جزوه فارسی هشتم", link: "https://hamyar.in/book/farsi-8" },
    { grade: "8", subject: "ریاضی", title: "جزوه ریاضی هشتم", link: "https://hamyar.in/book/math-8" },
    { grade: "8", subject: "علوم", title: "جزوه علوم هشتم", link: "https://hamyar.in/book/science-8" },
    { grade: "8", subject: "مطالعات", title: "جزوه مطالعات اجتماعی هشتم", link: "https://hamyar.in/book/social-8" },
    { grade: "8", subject: "عربی", title: "جزوه عربی هشتم", link: "https://hamyar.in/book/arabic-8" },
    
    // پایه نهم
    { grade: "9", subject: "فارسی", title: "جزوه فارسی نهم", link: "https://hamyar.in/book/farsi-9" },
    { grade: "9", subject: "ریاضی", title: "جزوه ریاضی نهم", link: "https://hamyar.in/book/math-9" },
    { grade: "9", subject: "علوم", title: "جزوه علوم نهم", link: "https://hamyar.in/book/science-9" },
    { grade: "9", subject: "مطالعات", title: "جزوه مطالعات اجتماعی نهم", link: "https://hamyar.in/book/social-9" },
    { grade: "9", subject: "عربی", title: "جزوه عربی نهم", link: "https://hamyar.in/book/arabic-9" },
  ];

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = !selectedGrade || book.grade === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  const grades = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="hover:shadow-glow p-2 md:p-3"
              >
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <div className="gradient-primary p-2 rounded-lg shadow-glow">
                <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h1 className="text-lg md:text-xl font-bold text-gradient">جزوات درسی</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8">
        <Card className="p-4 md:p-6 mb-6 shadow-glow border-primary/20 animate-fade-in">
          <div className="flex flex-col gap-4">
            <div className="w-full">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                <Input
                  placeholder="جستجوی جزوه..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 h-10 md:h-11 text-sm md:text-base"
                />
              </div>
            </div>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="h-10 md:h-11 rounded-md border border-input bg-input px-3 py-2 text-sm md:text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
            >
              <option value="">همه پایه‌ها</option>
              {grades.map(grade => (
                <option key={grade} value={grade}>پایه {grade}</option>
              ))}
            </select>
          </div>
        </Card>

        <Card className="p-4 md:p-6 mb-6 bg-accent/5 border-accent/20">
          <p className="text-sm md:text-base text-muted-foreground text-center">
            💡 <strong>توجه:</strong> جزوات پایه‌های ۱۰ تا ۱۲ به زودی اضافه خواهد شد
          </p>
        </Card>

        {filteredBooks.length === 0 ? (
          <Card className="p-8 md:p-12 text-center animate-fade-in">
            <BookOpen className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg md:text-xl text-muted-foreground">
              جزوه‌ای یافت نشد
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredBooks.map((book, index) => (
              <Card
                key={index}
                className="p-4 md:p-6 hover:shadow-glow hover:border-primary/50 transition-all duration-300 group animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="gradient-primary w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mb-3 md:mb-4 shadow-neon group-hover:shadow-glow transition-all">
                  <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h3 className="text-base md:text-lg font-bold mb-2 group-hover:text-gradient transition-all">
                  {book.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground mb-4">
                  <span className="bg-primary/10 px-2 py-1 rounded">پایه {book.grade}</span>
                  <span className="bg-secondary/10 px-2 py-1 rounded">{book.subject}</span>
                </div>
                <Button
                  className="w-full shadow-glow group-hover:shadow-neon transition-all"
                  onClick={() => window.open(book.link, '_blank')}
                >
                  <ExternalLink className="ml-2 w-4 h-4" />
                  مشاهده جزوه
                </Button>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudyBooksWithPDF;
