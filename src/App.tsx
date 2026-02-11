import { useState, useCallback } from 'react';
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
import Onboarding from "./pages/Onboarding";
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient();

function AppWithProvider() {
  const { familyMembers, loading, refetch } = useFamilyMembers();
  const [setupComplete, setSetupComplete] = useState(false);

  const handleOnboardingComplete = useCallback(() => {
    setSetupComplete(true);
    refetch();
  }, [refetch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show onboarding when no family members exist
  if (familyMembers.length === 0 && !setupComplete) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

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
