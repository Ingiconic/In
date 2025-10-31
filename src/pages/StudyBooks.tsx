import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, BookOpen, Search } from "lucide-react";

const StudyBooks = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  useEffect(() => {
    loadBooks();
  }, [selectedGrade, selectedSubject]);

  const loadBooks = async () => {
    try {
      let query = supabase.from('study_books').select('*');
      
      if (selectedGrade) {
        query = query.eq('grade', selectedGrade);
      }
      if (selectedSubject) {
        query = query.eq('subject', selectedSubject);
      }

      const { data, error } = await query;
      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const grades = [...Array(12)].map((_, i) => `${i + 1}`);
  const subjects = [...new Set(books.map(book => book.subject))];

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
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="flex-1 h-10 md:h-11 rounded-md border border-input bg-input px-3 py-2 text-sm md:text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
              >
                <option value="">همه پایه‌ها</option>
                {grades.map(grade => (
                  <option key={grade} value={grade}>پایه {grade}</option>
                ))}
              </select>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="flex-1 h-10 md:h-11 rounded-md border border-input bg-input px-3 py-2 text-sm md:text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
              >
                <option value="">همه دروس</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
          </div>
        ) : filteredBooks.length === 0 ? (
          <Card className="p-8 md:p-12 text-center animate-fade-in">
            <BookOpen className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg md:text-xl text-muted-foreground">
              جزوه‌ای یافت نشد
            </p>
            <p className="text-xs md:text-sm text-muted-foreground mt-2">
              فیلترهای دیگری را امتحان کنید
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredBooks.map((book, index) => (
              <Card
                key={book.id}
                className="p-4 md:p-6 hover:shadow-glow hover:border-primary/50 transition-all duration-300 cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="gradient-primary w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mb-3 md:mb-4 shadow-neon group-hover:shadow-glow transition-all">
                  <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h3 className="text-base md:text-lg font-bold mb-2 group-hover:text-gradient transition-all line-clamp-2">
                  {book.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                  <span className="bg-primary/10 px-2 py-1 rounded">پایه {book.grade}</span>
                  <span className="bg-secondary/10 px-2 py-1 rounded">{book.subject}</span>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground line-clamp-3">
                  {book.content.substring(0, 120)}...
                </p>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudyBooks;