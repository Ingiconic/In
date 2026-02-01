import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import InstallPrompt from "@/components/InstallPrompt";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";
import AdminBlog from "./pages/AdminBlog";
import Dashboard from "./pages/Dashboard";
import Blog from "./pages/Blog";
import Summarize from "./pages/Summarize";
import Questions from "./pages/Questions";
import Consultation from "./pages/Consultation";
import StudyPlan from "./pages/StudyPlan";
import ExamV2 from "./pages/ExamV2";
import Profile from "./pages/Profile";
import Progress from "./pages/Progress";
import About from "./pages/About";
import MindMapAI from "./pages/MindMapAI";
import Flashcards from "./pages/Flashcards";
import Resources from "./pages/Resources";
import Install from "./pages/Install";
import Leaderboard from "./pages/Leaderboard";
import StudyCalendar from "./pages/StudyCalendar";

import Forum from "./pages/Forum";
import ForumCategory from "./pages/ForumCategory";
import ForumTopic from "./pages/ForumTopic";
import BlogPost from "./pages/BlogPost";
import Referral from "./pages/Referral";
import WorksheetSolver from "./pages/WorksheetSolver";
import HomeworkHelper from "./pages/HomeworkHelper";
import NotFound from "./pages/NotFound";
import Notes from "./pages/Notes";
import StudyCompanion from "./pages/StudyCompanion";
import ARLearning from "./pages/ARLearning";
import DailyQuests from "./pages/DailyQuests";
import AvatarCustomizer from "./pages/AvatarCustomizer";
import PetPage from "./pages/PetPage";
import StudyStreak from "./pages/StudyStreak";
import AIBuddy from "./pages/AIBuddy";
import StudyBattle from "./pages/StudyBattle";
import StudyBattleQueue from "./pages/StudyBattleQueue";
import MusicPlayer from "./pages/MusicPlayer";
import GoalsTracker from "./pages/GoalsTracker";
import MotivationWall from "./pages/MotivationWall";
import PomodoroTimer from "./pages/PomodoroTimer";
import ThemeSettings from "./pages/ThemeSettings";
import Contact from "./pages/Contact";
import AdminAds from "./pages/AdminAds";
import AdminTickets from "./pages/AdminTickets";
import EasyTube from "./pages/EasyTube";
import EasyTubeWatch from "./pages/EasyTubeWatch";
import EasyTubeChannel from "./pages/EasyTubeChannel";
import EasyBlog from "./pages/EasyBlog";
import EasyBlogPost from "./pages/EasyBlogPost";
import AdminContent from "./pages/AdminContent";
import EasyTranslate from "./pages/EasyTranslate";
import EasyGame from "./pages/EasyGame";
import SmartCalculator from "./pages/SmartCalculator";
import FocusMode from "./pages/FocusMode";
import QuickQuiz from "./pages/QuickQuiz";
import StudyAnalytics from "./pages/StudyAnalytics";
import VoiceAssistant from "./pages/VoiceAssistant";
import BookmarksPage from "./pages/BookmarksPage";
import DailyQuote from "./pages/DailyQuote";
import ExamChecker from "./pages/ExamChecker";
import VocabNotebook from "./pages/VocabNotebook";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <InstallPrompt />
          <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/auth" element={<Login />} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<Admin />} />
              <Route path="/admin/blog" element={<AdminBlog />} />
              <Route path="/admin/ads" element={<AdminAds />} />
              <Route path="/admin/tickets" element={<AdminTickets />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/summarize" element={<Summarize />} />
              <Route path="/questions" element={<Questions />} />
              <Route path="/consultation" element={<Consultation />} />
              <Route path="/study-plan" element={<StudyPlan />} />
              <Route path="/exam" element={<ExamV2 />} />
              <Route path="/exam-v2" element={<ExamV2 />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/about" element={<About />} />
              <Route path="/mind-map" element={<MindMapAI />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/install" element={<Install />} />
              <Route path="/pet" element={<PetPage />} />
              <Route path="/study-streak" element={<StudyStreak />} />
              <Route path="/ai-buddy" element={<AIBuddy />} />
              <Route path="/study-battle" element={<StudyBattle />} />
              <Route path="/study-battle-queue" element={<StudyBattleQueue />} />
              <Route path="/music-player" element={<MusicPlayer />} />
              <Route path="/goals-tracker" element={<GoalsTracker />} />
              <Route path="/motivation-wall" element={<MotivationWall />} />
              <Route path="/pomodoro-timer" element={<PomodoroTimer />} />
              <Route path="/theme-settings" element={<ThemeSettings />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/calendar" element={<StudyCalendar />} />
              <Route path="/study-calendar" element={<StudyCalendar />} />
              <Route path="/pomodoro" element={<PomodoroTimer />} />
              <Route path="/forum" element={<Forum />} />
              <Route path="/forum/:categoryId" element={<ForumCategory />} />
              <Route path="/forum/topic/:topicId" element={<ForumTopic />} />
              <Route path="/theme" element={<ThemeSettings />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/referral" element={<Referral />} />
              <Route path="/worksheet-solver" element={<WorksheetSolver />} />
              <Route path="/homework-helper" element={<HomeworkHelper />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/study-companion" element={<StudyCompanion />} />
              <Route path="/ar-learning" element={<ARLearning />} />
              <Route path="/daily-quests" element={<DailyQuests />} />
              <Route path="/avatar-customizer" element={<AvatarCustomizer />} />
              <Route path="/mindmap-ai" element={<MindMapAI />} />
              <Route path="/easytube" element={<EasyTube />} />
              <Route path="/easytube/watch/:videoId" element={<EasyTubeWatch />} />
              <Route path="/easytube/channel/:channelId" element={<EasyTubeChannel />} />
              <Route path="/easyblog" element={<EasyBlog />} />
              <Route path="/easyblog/post/:postId" element={<EasyBlogPost />} />
              <Route path="/easytranslate" element={<EasyTranslate />} />
              <Route path="/easygame" element={<EasyGame />} />
              <Route path="/smart-calculator" element={<SmartCalculator />} />
              <Route path="/focus-mode" element={<FocusMode />} />
              <Route path="/quick-quiz" element={<QuickQuiz />} />
              <Route path="/study-analytics" element={<StudyAnalytics />} />
              <Route path="/voice-assistant" element={<VoiceAssistant />} />
              <Route path="/bookmarks" element={<BookmarksPage />} />
              <Route path="/daily-quote" element={<DailyQuote />} />
              <Route path="/exam-checker" element={<ExamChecker />} />
              <Route path="/vocab-notebook" element={<VocabNotebook />} />
              <Route path="/admin/content" element={<AdminContent />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
