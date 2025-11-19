import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
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
import Chat from "./pages/Chat";
import ChatFriends from "./pages/ChatFriends";
import Profile from "./pages/Profile";
import Progress from "./pages/Progress";
import About from "./pages/About";
import MindMapAI from "./pages/MindMapAI";
import Flashcards from "./pages/Flashcards";
import Resources from "./pages/Resources";
import CoinShop from "./pages/CoinShop";
import Install from "./pages/Install";
import Leaderboard from "./pages/Leaderboard";
import StudyCalendar from "./pages/StudyCalendar";
import ShopPage from "./pages/ShopPage";
import FocusMode from "./pages/FocusMode";
import Forum from "./pages/Forum";
import ThemeSettings from "./pages/ThemeSettings";
import BlogPost from "./pages/BlogPost";
import Referral from "./pages/Referral";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
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
              <Route path="/coin-shop" element={<CoinShop />} />
              <Route path="/install" element={<Install />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/chat-friends" element={<ChatFriends />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/calendar" element={<StudyCalendar />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/focus" element={<FocusMode />} />
              <Route path="/forum" element={<Forum />} />
              <Route path="/theme" element={<ThemeSettings />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/referral" element={<Referral />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
