import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ActiveMemberProvider } from "@/contexts/ActiveMemberContext";
import { useFamilyMembers } from "@/hooks/useDatabase";
import Index from "./pages/Index";
import Calendar from "./pages/Calendar";
import Activities from "./pages/Activities";
import Family from "./pages/Family";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppWithProvider() {
  const { familyMembers } = useFamilyMembers();
  
  return (
    <ActiveMemberProvider familyMembers={familyMembers}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/family" element={<Family />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ActiveMemberProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppWithProvider />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
