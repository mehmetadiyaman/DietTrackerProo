import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { StatCard } from "@/components/StatCard";
import { AppointmentList } from "@/components/AppointmentList";
import { ProgressSummary } from "@/components/ProgressSummary";
import { ActivityFeed } from "@/components/ActivityFeed";
import { BlogArticles } from "@/components/BlogArticles";
import { Client, Appointment, Activity, BlogArticle } from "@shared/schema";
import { getTimeSince } from "@/utils/formatDate";
import { DashboardStats, ProgressSummaryItem } from "@/lib/apiTypes";

const Dashboard: React.FC = () => {
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Stats verisi alınamadı');
      return response.json() as Promise<DashboardStats>;
    }
  });

  // Fetch appointments
  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['/api/appointments'],
    queryFn: async () => {
      const response = await fetch('/api/appointments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Randevu verisi alınamadı');
      return response.json() as Promise<Appointment[]>;
    }
  });

  // Fetch clients for appointments
  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Danışan verisi alınamadı');
      return response.json() as Promise<Client[]>;
    }
  });

  // Fetch activities
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['/api/activities'],
    queryFn: async () => {
      const response = await fetch('/api/activities?limit=5', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Aktivite verisi alınamadı');
      return response.json() as Promise<Activity[]>;
    }
  });

  // Fetch blog articles
  const { data: blogArticles, isLoading: blogLoading } = useQuery({
    queryKey: ['/api/blog'],
    queryFn: async () => {
      const response = await fetch('/api/blog?limit=3');
      if (!response.ok) throw new Error('Blog verisi alınamadı');
      return response.json() as Promise<BlogArticle[]>;
    }
  });

  // Prepare appointments with client data
  const appointmentsWithClients = React.useMemo(() => {
    if (!appointments || !clients) return [];
    
    return appointments
      .filter(appt => {
        // Filter to only future appointments and sort them
        const apptDate = new Date(appt.date);
        const now = new Date();
        return apptDate >= now;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3) // Only take first 3
      .map(appt => {
        const client = clients.find(c => c.id === appt.clientId);
        if (!client) return null;
        return {
          ...appt,
          client
        };
      })
      .filter(Boolean);
  }, [appointments, clients]);

  // Prepare activities with display data
  const formattedActivities = React.useMemo(() => {
    if (!activities) return [];
    
    return activities.map(activity => {
      let icon = 'fas fa-bell';
      let iconBg = 'bg-primary-light bg-opacity-20 dark:bg-primary-dark';
      let iconColor = 'text-primary-light';
      
      switch (activity.type) {
        case 'diet_plan':
          icon = 'fas fa-utensils';
          iconBg = 'bg-primary-light bg-opacity-20 dark:bg-primary-dark';
          iconColor = 'text-primary-light';
          break;
        case 'measurement':
          icon = 'fas fa-weight';
          iconBg = 'bg-blue-100 dark:bg-blue-900';
          iconColor = 'text-blue-600 dark:text-blue-200';
          break;
        case 'appointment':
          icon = 'fas fa-calendar-alt';
          iconBg = 'bg-amber-100 dark:bg-amber-900';
          iconColor = 'text-amber-600 dark:text-amber-200';
          break;
        case 'telegram':
          icon = 'fab fa-telegram-plane';
          iconBg = 'bg-purple-100 dark:bg-purple-900';
          iconColor = 'text-purple-600 dark:text-purple-200';
          break;
        case 'client':
          icon = 'fas fa-user-plus';
          iconBg = 'bg-green-100 dark:bg-green-900';
          iconColor = 'text-green-600 dark:text-green-200';
          break;
      }
      
      return {
        ...activity,
        timeSince: getTimeSince(activity.createdAt),
        icon,
        iconBg,
        iconColor
      };
    });
  }, [activities]);

  // Progress summary data
  const progressItems: ProgressSummaryItem[] = [
    {
      label: "Hedef Ağırlığa Ulaşanlar",
      current: 12,
      total: 42,
      color: "bg-green-500"
    },
    {
      label: "Diyet Uyumu",
      current: 27,
      total: 42,
      color: "bg-primary"
    },
    {
      label: "Egzersiz Uyumu",
      current: 18,
      total: 42,
      color: "bg-amber-500"
    },
    {
      label: "Su Tüketimi Takibi",
      current: 32,
      total: 42,
      color: "bg-blue-500"
    }
  ];

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 pb-24 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Gösterge Paneli</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Günlük aktivitelerinize genel bir bakış.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link href="/clients">
            <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <i className="fas fa-plus mr-2"></i>
              Yeni Danışan
            </a>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Aktif Danışanlar"
          value={statsLoading ? "..." : stats?.activeClients || 0}
          icon="fas fa-users"
          iconBg="bg-primary bg-opacity-10 dark:bg-opacity-20"
          iconColor="text-primary"
          link="/clients"
          linkText="Tümünü Görüntüle"
        />
        
        <StatCard
          title="Bugünkü Randevular"
          value={statsLoading ? "..." : stats?.todayAppointments || 0}
          icon="fas fa-calendar-check"
          iconBg="bg-blue-500 bg-opacity-10 dark:bg-opacity-20"
          iconColor="text-blue-500"
          link="/appointments"
          linkText="Takvimi Görüntüle"
        />
        
        <StatCard
          title="Aktif Diyet Planları"
          value={statsLoading ? "..." : stats?.activeDietPlans || 0}
          icon="fas fa-utensils"
          iconBg="bg-amber-500 bg-opacity-10 dark:bg-opacity-20"
          iconColor="text-amber-500"
          link="/diet-plans"
          linkText="Planları Görüntüle"
        />
        
        <StatCard
          title="Telegram Mesajları"
          value={statsLoading ? "..." : stats?.telegramMessages || 0}
          icon="fas fa-paper-plane"
          iconBg="bg-purple-500 bg-opacity-10 dark:bg-opacity-20"
          iconColor="text-purple-500"
          link="/telegram-bot"
          linkText="Bot Ayarları"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Recent Appointments */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg lg:col-span-2">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white font-heading">Yaklaşan Randevular</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Bugün ve gelecek 7 gün içindeki randevularınız.
            </p>
          </div>
          
          <AppointmentList 
            appointments={appointmentsWithClients as any} 
            loading={appointmentsLoading || clientsLoading}
            emptyMessage="Yaklaşan randevu bulunmuyor. Yeni bir randevu ekleyebilirsiniz."
          />
          
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <Link href="/appointments">
              <a className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                Tüm Randevuları Görüntüle
              </a>
            </Link>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white font-heading">Danışan İlerleme Özeti</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Son 30 gündeki danışan ilerleme durumları.
            </p>
          </div>
          
          <ProgressSummary 
            items={progressItems}
            loading={false}
          />
          
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <Link href="/clients">
              <a className="text-sm font-medium text-primary dark:text-primary-light hover:text-primary-dark">
                Detaylı İstatistikleri Görüntüle →
              </a>
            </Link>
          </div>
        </div>
      </div>

      {/* Latest Activities */}
      <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white font-heading">Son Aktiviteler</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Sistemdeki son işlemler ve değişiklikler.
          </p>
        </div>
        
        <ActivityFeed 
          activities={formattedActivities}
          loading={activitiesLoading}
        />
        
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <a href="#" className="text-sm font-medium text-primary dark:text-primary-light hover:text-primary-dark">
            Tüm Aktiviteleri Görüntüle →
          </a>
        </div>
      </div>

      {/* Medium Blog Articles */}
      <div className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white font-heading">Sağlık & Beslenme Makaleleri</h3>
          <Link href="/blog">
            <a className="mt-2 sm:mt-0 text-sm font-medium text-primary dark:text-primary-light hover:text-primary-dark">
              Tüm Makaleleri Görüntüle →
            </a>
          </Link>
        </div>
        
        <BlogArticles 
          articles={blogArticles || []}
          loading={blogLoading}
        />
      </div>
    </div>
  );
};

export default Dashboard;
