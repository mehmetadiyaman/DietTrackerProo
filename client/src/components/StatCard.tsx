import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  iconBg: string;
  iconColor: string;
  link: string;
  linkText: string;
}

export function StatCard({ title, value, icon, iconBg, iconColor, link, linkText }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBg} rounded-md p-3`}>
            <i className={`${icon} ${iconColor}`}></i>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900 dark:text-white">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
        <div className="text-sm">
          <a href={link} className="font-medium text-primary hover:text-primary-dark dark:text-primary-light">
            {linkText}
          </a>
        </div>
      </div>
    </div>
  );
}
