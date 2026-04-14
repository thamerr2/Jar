import { useEffect } from "react";
import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "@/components/Toaster";
import { Layout } from "@/components/Layout";
import { useTranslation } from "react-i18next";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Properties from "@/pages/Properties";
import PropertyDetails from "@/pages/PropertyDetails";
import Maintenance from "@/pages/Maintenance";
import MaintenanceDetail from "@/pages/MaintenanceDetail";
import Contractors from "@/pages/Contractors";
import Payments from "@/pages/Payments";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Admin from "@/pages/Admin";
import Jobs from "@/pages/Jobs";
import MyQuotes from "@/pages/MyQuotes";
import ContractorProfile from "@/pages/ContractorProfile";
import NotFound from "@/pages/not-found";

function ProtectedRoute({
  children,
  adminOnly = false,
  contractorOnly = false
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
  contractorOnly?: boolean;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Redirect to="/login" />;
  if (adminOnly && user?.role !== "super_admin") return <Redirect to="/dashboard" />;
  if (contractorOnly && user?.role !== "contractor") return <Redirect to="/dashboard" />;

  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/dashboard" /> : <Login />}
      </Route>
      <Route path="/register">
        {isAuthenticated ? <Redirect to="/dashboard" /> : <Register />}
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      </Route>
      <Route path="/properties">
        <ProtectedRoute><Properties /></ProtectedRoute>
      </Route>
      <Route path="/properties/:id">
        <ProtectedRoute><PropertyDetails /></ProtectedRoute>
      </Route>
      <Route path="/maintenance">
        <ProtectedRoute><Maintenance /></ProtectedRoute>
      </Route>
      <Route path="/maintenance/:id">
        <ProtectedRoute><MaintenanceDetail /></ProtectedRoute>
      </Route>
      <Route path="/contractors">
        <ProtectedRoute><Contractors /></ProtectedRoute>
      </Route>
      <Route path="/payments">
        <ProtectedRoute><Payments /></ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute><Reports /></ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute><Settings /></ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute adminOnly><Admin /></ProtectedRoute>
      </Route>
      {/* Contractor portal */}
      <Route path="/jobs">
        <ProtectedRoute contractorOnly><Jobs /></ProtectedRoute>
      </Route>
      <Route path="/my-quotes">
        <ProtectedRoute contractorOnly><MyQuotes /></ProtectedRoute>
      </Route>
      <Route path="/contractor-profile">
        <ProtectedRoute contractorOnly><ContractorProfile /></ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function DirectionSync() {
  const { i18n } = useTranslation();
  useEffect(() => {
    document.documentElement.dir  = i18n.language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <DirectionSync />
          <AppRoutes />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
