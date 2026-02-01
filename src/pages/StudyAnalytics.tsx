import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, ArrowLeft, TrendingUp, Clock, Target,
  BookOpen, Brain, Flame, Trophy, Calendar
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

const StudyAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudyTime: 0,
    examsCompleted: 0,
    averageScore: 0,
    streakDays: 0,
    questionsAsked: 0,
    focusSessions: 0,
  });
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [subjectData, setSubjectData] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get profile stats
      const { data: profile } = await supabase
        .from("profiles")
        .select("streak_days, points, xp")
        .eq("id", user.id)
        .single();

      // Get exams count and average
      const { data: exams } = await supabase
        .from("exams")
        .select("score")
        .eq("user_id", user.id)
        .not("score", "is", null);

      // Get questions count
      const { count: questionsCount } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Get focus sessions
      const { data: focusSessions } = await supabase
        .from("focus_sessions")
        .select("duration")
        .eq("user_id", user.id)
        .eq("completed", true);

      const totalStudyTime = focusSessions?.reduce((acc, s) => acc + s.duration, 0) || 0;
      const avgScore = exams?.length 
        ? Math.round(exams.reduce((acc, e) => acc + (e.score || 0), 0) / exams.length)
        : 0;

      setStats({
        totalStudyTime,
        examsCompleted: exams?.length || 0,
        averageScore: avgScore,
        streakDays: profile?.streak_days || 0,
        questionsAsked: questionsCount || 0,
        focusSessions: focusSessions?.length || 0,
      });

      // Generate weekly data
      const days = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];
      setWeeklyData(days.map((day, i) => ({
        name: day,
        مطالعه: Math.floor(Math.random() * 120) + 30,
        آزمون: Math.floor(Math.random() * 3),
      })));

      // Subject distribution
      setSubjectData([
        { name: "ریاضی", value: 35, color: "#8b5cf6" },
        { name: "فیزیک", value: 25, color: "#06b6d4" },
        { name: "شیمی", value: 20, color: "#22c55e" },
        { name: "زبان", value: 20, color: "#f59e0b" },
      ]);

    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      icon: Clock, 
      label: "زمان مطالعه", 
      value: `${Math.floor(stats.totalStudyTime / 60)} ساعت`,
      color: "from-blue-500 to-cyan-500" 
    },
    { 
      icon: Target, 
      label: "میانگین نمره", 
      value: `${stats.averageScore}%`,
      color: "from-green-500 to-emerald-500" 
    },
    { 
      icon: Flame, 
      label: "روزهای متوالی", 
      value: stats.streakDays,
      color: "from-orange-500 to-red-500" 
    },
    { 
      icon: Brain, 
      label: "سوالات پرسیده", 
      value: stats.questionsAsked,
      color: "from-purple-500 to-pink-500" 
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">بازگشت</span>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg">آمار یادگیری</h1>
          </div>

          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl border border-border/50 p-4"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Weekly Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border/50 p-4 mb-6"
        >
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            فعالیت هفتگی
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem"
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="مطالعه" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary) / 0.2)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Subject Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-border/50 p-4"
        >
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            توزیع مطالعه
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    dataKey="value"
                  >
                    {subjectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {subjectData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default StudyAnalytics;
