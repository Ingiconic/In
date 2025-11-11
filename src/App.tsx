import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Summarize from "./pages/Summarize";
import Questions from "./pages/Questions";
import Consultation from "./pages/Consultation";
import StudyPlan from "./pages/StudyPlan";
import ExamV2 from "./pages/ExamV2";
import AdminPanel from "./pages/AdminPanel";
import Chat from "./pages/Chat";
import ChatFriends from "./pages/ChatFriends";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Progress from "./pages/Progress";
import About from "./pages/About";
import MindMapAI from "./pages/MindMapAI";
import Flashcards from "./pages/Flashcards";
import Resources from "./pages/Resources";
import CoinShop from "./pages/CoinShop";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/summarize" element={<Summarize />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/consultation" element={<Consultation />} />
          <Route path="/study-plan" element={<StudyPlan />} />
          <Route path="/exam" element={<ExamV2 />} />
          <Route path="/exam-v2" element={<ExamV2 />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/about" element={<About />} />
          <Route path="/mindmap" element={<MindMapAI />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/coin-shop" element={<CoinShop />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
