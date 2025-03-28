import React, { ReactNode, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Sidebar for desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-gray-600 opacity-75" onClick={toggleSidebar}></div>
          <div className="absolute left-0 top-0 bottom-0 flex w-64 flex-col bg-white dark:bg-gray-800 z-50">
            <Sidebar />
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto pb-10 lg:pb-0">
          {children}
        </main>

        {/* Mobile bottom navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around py-2 px-4 z-10">
          <a href="/" className="text-primary dark:text-primary-light flex flex-col items-center px-1 py-1">
            <i className="fas fa-tachometer-alt text-lg"></i>
            <span className="text-xs mt-1">Panel</span>
          </a>
          <a href="/clients" className="text-gray-600 dark:text-gray-400 flex flex-col items-center px-1 py-1">
            <i className="fas fa-users text-lg"></i>
            <span className="text-xs mt-1">Danışanlar</span>
          </a>
          <a href="/diet-plans" className="text-gray-600 dark:text-gray-400 flex flex-col items-center px-1 py-1">
            <i className="fas fa-utensils text-lg"></i>
            <span className="text-xs mt-1">Diyetler</span>
          </a>
          <a href="/appointments" className="text-gray-600 dark:text-gray-400 flex flex-col items-center px-1 py-1">
            <i className="fas fa-calendar-alt text-lg"></i>
            <span className="text-xs mt-1">Randevular</span>
          </a>
          <a href="#" className="text-gray-600 dark:text-gray-400 flex flex-col items-center px-1 py-1">
            <i className="fas fa-ellipsis-h text-lg"></i>
            <span className="text-xs mt-1">Diğer</span>
          </a>
        </div>
      </div>
    </div>
  );
}
