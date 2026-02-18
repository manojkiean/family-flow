import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
      />

      <div className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64"
      )}>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
