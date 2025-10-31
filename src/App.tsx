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
import StudyBooks from "./pages/StudyBooks";
import StepByStep from "./pages/StepByStep";
import Exam from "./pages/Exam";
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
          <Route path="/study-books" element={<StudyBooks />} />
          <Route path="/step-by-step" element={<StepByStep />} />
          <Route path="/exam" element={<Exam />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
