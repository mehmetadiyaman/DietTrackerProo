export interface DashboardStats {
  activeClients: number;
  todayAppointments: number;
  activeDietPlans: number;
  telegramMessages: number;
}

export interface ProgressSummaryItem {
  label: string;
  current: number;
  total: number;
  color: string;
}

export interface ClientWithAppointments {
  id: number;
  fullName: string;
  profileImage?: string;
  email: string;
  phone: string;
  appointment?: {
    id: number;
    date: string;
    type: string;
  }
}
