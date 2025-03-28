import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Clients from "@/pages/Clients";
import DietPlans from "@/pages/DietPlans";
import Appointments from "@/pages/Appointments";
import Measurements from "@/pages/Measurements";
import Settings from "@/pages/Settings";
import TelegramBot from "@/pages/TelegramBot";
import Blog from "@/pages/Blog";
import { AuthProvider } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { useEffect } from "react";

function Router() {
  const [location, setLocation] = useLocation();

  // Check if user is logged in when app loads
  useEffect(() => {
    const token = localStorage.getItem("token");
    const isAuthPage = location === "/login" || location === "/register";
    
    // If no token and not on auth page, redirect to login
    if (!token && !isAuthPage) {
      setLocation("/login");
    }
    
    // If token exists and on auth page, redirect to dashboard
    if (token && isAuthPage) {
      setLocation("/");
    }
  }, [location, setLocation]);

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/">
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </Route>
      
      <Route path="/clients">
        <AppLayout>
          <Clients />
        </AppLayout>
      </Route>
      
      <Route path="/diet-plans">
        <AppLayout>
          <DietPlans />
        </AppLayout>
      </Route>
      
      <Route path="/appointments">
        <AppLayout>
          <Appointments />
        </AppLayout>
      </Route>
      
      <Route path="/measurements">
        <AppLayout>
          <Measurements />
        </AppLayout>
      </Route>
      
      <Route path="/settings">
        <AppLayout>
          <Settings />
        </AppLayout>
      </Route>
      
      <Route path="/telegram-bot">
        <AppLayout>
          <TelegramBot />
        </AppLayout>
      </Route>
      
      <Route path="/blog">
        <AppLayout>
          <Blog />
        </AppLayout>
      </Route>
      
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
