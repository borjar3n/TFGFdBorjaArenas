import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Task, Field, Inventory } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useOffline } from "@/hooks/use-offline";

import AppHeader from "@/components/layout/app-header";
import SidebarNavigation from "@/components/layout/sidebar-navigation";
import MobileNavigation from "@/components/layout/mobile-navigation";
import ConnectionStatus from "@/components/common/connection-status";
import CompanySelector from "@/components/layout/company-selector";
import WelcomeCard from "@/components/dashboard/welcome-card";
import TasksCard from "@/components/dashboard/tasks-card";
import InventoryCard from "@/components/dashboard/inventory-card";
import WeatherCard from "@/components/dashboard/weather-card";
import FieldsTable from "@/components/dashboard/fields-table";
import StatisticsSection from "@/components/dashboard/statistics-section";

export default function Dashboard() {
  const { user } = useAuth();
  const { isOffline, isSyncing } = useOffline();

  // Fetch tasks
  const tasksQuery = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    staleTime: 60000, // 1 minute
  });

  // Fetch fields
  const fieldsQuery = useQuery<Field[]>({
    queryKey: ["/api/fields"],
    staleTime: 60000, // 1 minute
  });

  // Fetch inventory
  const inventoryQuery = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
    staleTime: 60000, // 1 minute
  });

  // Format date for last update
  const formatLastUpdate = () => {
    const now = new Date();
    return now.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter tasks to get pending ones
  const pendingTasks = tasksQuery.data?.filter(task => 
    task.status === 'pending' || task.status === 'in_progress'
  ) || [];

  // Get all inventory items for dashboard display
  const allInventoryItems = inventoryQuery.data || [];

  return (
    <div className="flex flex-col h-screen">
      {/* Show offline status */}
      {isOffline && <ConnectionStatus />}
      
      {/* Top AppBar */}
      <AppHeader user={user} isSyncing={isSyncing} />
      
      {/* Company Selector */}
      <CompanySelector />

      <div className="flex flex-grow h-full overflow-hidden">
        {/* Sidebar Navigation */}
        <SidebarNavigation activePath="/" />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          {/* Welcome Card */}
          <WelcomeCard 
            username={user?.name || ""}
            lastUpdate={formatLastUpdate()}
          />

          {/* Dashboard Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Quick Tasks Card */}
            <TasksCard 
              tasks={pendingTasks} 
              isLoading={tasksQuery.isLoading} 
            />

            {/* Inventory Card */}
            <InventoryCard 
              inventoryItems={allInventoryItems} 
              isLoading={inventoryQuery.isLoading} 
            />

            {/* Weather & Calendar Card */}
            <WeatherCard />
          </div>

          {/* Fields & Crops Section */}
          <FieldsTable 
            fields={fieldsQuery.data || []} 
            isLoading={fieldsQuery.isLoading} 
          />

          {/* Statistics & Reports Section */}
          <StatisticsSection />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation activePath="/" />
    </div>
  );
}
