import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ActiveMemberProvider, useActiveMember } from "@/contexts/ActiveMemberContext";
import { FamilyDataProvider, useFamilyData } from "@/contexts/FamilyDataContext";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Calendar from "./pages/Calendar";
import Activities from "./pages/Activities";
import Family from "./pages/Family";
import Wall from "./pages/Wall";
import Settings from "./pages/Settings";
import FAQ from "./pages/FAQ";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import { ProfileSelection } from "./pages/ProfileSelection";
import Auth from "./pages/Auth";
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient();

function AppWithAuth() {
  const { user, loading: authLoading } = useAuth();
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecovering(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || isRecovering) {
    return <Auth initialMode={isRecovering ? 'reset' : 'login'} />;
  }

  return (
    <FamilyDataProvider>
      <AuthenticatedApp />
    </FamilyDataProvider>
  );
}

function AuthenticatedApp() {
  // Reads from the shared context — fetched once, never refetched on navigation
  const { familyMembers, membersLoading } = useFamilyData();

  const handleOnboardingComplete = useCallback(() => {
    window.location.reload();
  }, []);

  if (membersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (familyMembers.length === 0) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <ActiveMemberProvider familyMembers={familyMembers}>
      <ActiveMemberConsumer>
        {({ activeMember }) =>
          !activeMember ? (
            <ProfileSelection />
          ) : (
            <AppLayout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/activities" element={<Activities />} />
                <Route path="/family" element={<Family />} />
                <Route path="/wall" element={<Wall />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          )
        }
      </ActiveMemberConsumer>
    </ActiveMemberProvider>
  );
}

const ActiveMemberConsumer = ({ children }: { children: (props: any) => React.ReactNode }) => {
  const context = useActiveMember();
  const { activeMember, isChildLogin } = context;

  // If this is a child PIN login, skip the ProfileSelection screen.
  // The child member is auto-selected by ActiveMemberContext from localStorage.
  // Show a brief spinner while the member resolves (familyMembers may still be loading).
  if (isChildLogin && !activeMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children(context)}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppWithAuth />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
