import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import InventoryPage from "@/pages/inventory-page";
import CalendarPage from "@/pages/calendar-page";
import TasksPage from "@/pages/tasks-page";
import FieldsPage from "@/pages/fields-page";
import ReportsPage from "@/pages/reports-page";
import AnalyticsPage from "@/pages/analytics-page";
import UsersPage from "@/pages/users-page";
import CompaniesPage from "@/pages/companies-page";
import WeatherPage from "@/pages/weather-page";
import HelpPage from "@/pages/help-page";
import SettingsPage from "@/pages/settings-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { OfflineProvider } from "./hooks/use-offline";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/inventory" component={InventoryPage} />
      <ProtectedRoute path="/calendar" component={CalendarPage} />
      <ProtectedRoute path="/tasks" component={TasksPage} />
      <ProtectedRoute path="/fields" component={FieldsPage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <ProtectedRoute path="/analytics" component={AnalyticsPage} />
      <ProtectedRoute path="/weather" component={WeatherPage} />
      <ProtectedRoute path="/users" component={UsersPage} />
      <ProtectedRoute path="/companies" component={CompaniesPage} />
      <ProtectedRoute path="/help" component={HelpPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OfflineProvider>
          <Router />
          <Toaster />
        </OfflineProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
