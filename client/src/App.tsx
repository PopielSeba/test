import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import PendingApproval from "@/pages/pending-approval";
import UserManagement from "@/pages/user-management";
import Dashboard from "@/pages/dashboard";
import Equipment from "@/pages/equipment";
import Quotes from "@/pages/quotes";
import QuoteDetail from "@/pages/quote-detail";
import CreateQuote from "@/pages/create-quote";
import EditQuote from "@/pages/edit-quote";
import Admin from "@/pages/admin";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import GuestQuote from "@/pages/guest-quote";
import Navbar from "@/components/navbar";

function Router() {
  const { isAuthenticated, isLoading, isPendingApproval, pendingUser } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Sprawdzanie autoryzacji...</p>
        </div>
      </div>
    );
  }

  // Show pending approval page
  if (isPendingApproval && pendingUser) {
    return <PendingApproval user={pendingUser} />;
  }

  // Show landing page for unauthenticated users
  if (!isAuthenticated) {
    return <Landing />;
  }

  // Show authenticated app
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/equipment" component={Equipment} />
        <Route path="/quotes" component={Quotes} />
        <Route path="/quotes/:id" component={QuoteDetail} />
        <Route path="/quotes/:id/edit" component={EditQuote} />
        <Route path="/create-quote" component={() => <CreateQuote />} />
        <Route path="/admin" component={Admin} />
        <Route path="/users" component={UserManagement} />
        <Route path="/profile" component={Profile} />
        <Route path="/settings" component={Settings} />
        <Route path="/guest-quote" component={GuestQuote} />
        <Route path="/landing" component={Landing} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="sebastian-popiel-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
