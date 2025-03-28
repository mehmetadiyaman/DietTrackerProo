import React from "react";
import { formatDate } from "@/utils/formatDate";
import { Activity } from "@shared/schema";

interface ActivityDisplayItem extends Activity {
  timeSince: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

interface ActivityFeedProps {
  activities: ActivityDisplayItem[];
  loading: boolean;
}

export function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  if (loading) {
    return (
      <div className="px-6 py-5 text-center text-gray-500 dark:text-gray-400">
        <i className="fas fa-spinner fa-spin mr-2"></i> Aktiviteler yükleniyor...
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
        <i className="far fa-calendar-times text-3xl mb-2"></i>
        <p>Henüz aktivite bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {activities.map((activity) => (
        <div key={activity.id} className="px-6 py-4 flex">
          <div className="flex-shrink-0">
            <span className={`h-8 w-8 rounded-full ${activity.iconBg} flex items-center justify-center`}>
              <i className={`${activity.icon} ${activity.iconColor}`}></i>
            </span>
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {activity.type === 'diet_plan' && 'Yeni Diyet Planı Oluşturuldu'}
                {activity.type === 'measurement' && 'Yeni Ölçüm Kaydedildi'}
                {activity.type === 'appointment' && 'Yeni Randevu Oluşturuldu'}
                {activity.type === 'telegram' && 'Telegram Mesajı Gönderildi'}
                {activity.type === 'client' && 'Yeni Danışan Eklendi'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{activity.timeSince}</p>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {activity.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
