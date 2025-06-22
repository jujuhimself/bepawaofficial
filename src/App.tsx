import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import AppRoutes from "@/routes/AppRoutes";
import { FooterVersion } from "@/components/FooterVersion";

const App = () => {
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        retry: 1,
      },
    },
  }));

  const [isOffline, setIsOffline] = React.useState(!navigator.onLine);
  React.useEffect(() => {
    const handle = () => setIsOffline(!navigator.onLine);
    window.addEventListener("offline", handle);
    window.addEventListener("online", handle);
    return () => {
      window.removeEventListener("offline", handle);
      window.removeEventListener("online", handle);
    };
  }, []);

  if (isOffline) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow max-w-md text-center">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Offline Mode</h2>
          <p className="text-gray-600 mb-3">You are currently offline. Some features may be unavailable.</p>
        </div>
        <FooterVersion />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
