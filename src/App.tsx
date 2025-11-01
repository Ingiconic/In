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
import StudyBooksWithPDF from "./pages/StudyBooksWithPDF";
import StepByStep from "./pages/StepByStep";
import Exam from "./pages/Exam";
import Chat from "./pages/Chat";
import ChatFriends from "./pages/ChatFriends";
import Admin from "./pages/Admin";
import Progress from "./pages/Progress";
import About from "./pages/About";
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
          <Route path="/study-books" element={<StudyBooksWithPDF />} />
          <Route path="/step-by-step" element={<StepByStep />} />
          <Route path="/exam" element={<Exam />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/friends" element={<ChatFriends />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/about" element={<About />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
