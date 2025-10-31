import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, BookCheck, Search } from "lucide-react";

const StepByStep = () => {
  const navigate = useNavigate();
  const [solutions, setSolutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [pageNumber, setPageNumber] = useState("");

  useEffect(() => {
    loadSolutions();
  }, [selectedGrade, selectedSubject, pageNumber]);

  const loadSolutions = async () => {
    try {
      let query = supabase.from('step_by_step_solutions').select('*');
      
      if (selectedGrade) {
        query = query.eq('grade', selectedGrade);
      }
      if (selectedSubject) {
        query = query.eq('subject', selectedSubject);
      }
      if (pageNumber) {
        query = query.eq('page_number', parseInt(pageNumber));
      }

      const { data, error } = await query.order('page_number');
      if (error) throw error;
      setSolutions(data || []);
    } catch (error) {
      console.error('Error loading solutions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSolutions = solutions.filter(solution =>
    solution.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const grades = [...Array(12)].map((_, i) => `${i + 1}`);
  const subjects = [...new Set(solutions.map(s => s.subject))];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="hover:shadow-glow"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="gradient-secondary p-2 rounded-lg shadow-glow">
                <BookCheck className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gradient">گام به گام</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="p-6 mb-6 shadow-glow border-primary/20 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="جستجوی درس..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">همه پایه‌ها</option>
              {grades.map(grade => (
                <option key={grade} value={grade}>پایه {grade}</option>
              ))}
            </select>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">همه دروس</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <Input
              type="number"
              placeholder="شماره صفحه"
              value={pageNumber}
              onChange={(e) => setPageNumber(e.target.value)}
            />
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
          </div>
        ) : filteredSolutions.length === 0 ? (
          <Card className="p-12 text-center animate-fade-in">
            <BookCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl text-muted-foreground">
              هنوز راهنمایی اضافه نشده است
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              به زودی پاسخ‌های گام به گام اضافه خواهند شد
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSolutions.map((solution, index) => (
              <Card
                key={solution.id}
                className="p-6 hover:shadow-glow hover:border-primary/50 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="gradient-secondary w-12 h-12 rounded-lg flex items-center justify-center shadow-neon flex-shrink-0">
                    <BookCheck className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold">{solution.subject}</h3>
                      <span className="bg-primary/10 px-2 py-1 rounded text-sm">پایه {solution.grade}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      صفحه {solution.page_number} - سوال {solution.question_number}
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm whitespace-pre-wrap">{solution.solution}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StepByStep;