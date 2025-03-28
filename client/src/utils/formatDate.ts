export function formatDate(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  
  // Check if date is today
  if (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) {
    return `Bugün, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  
  // Check if date is tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  ) {
    return `Yarın, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  
  // For other dates, return formatted date
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function getTimeSince(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Less than a minute
  if (seconds < 60) {
    return 'Az önce';
  }
  
  // Less than an hour
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} dakika önce`;
  }
  
  // Less than a day
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} saat önce`;
  }
  
  // Less than a week
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} gün önce`;
  }
  
  // Less than a month
  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks} hafta önce`;
  }
  
  // Less than a year
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} ay önce`;
  }
  
  // More than a year
  const years = Math.floor(days / 365);
  return `${years} yıl önce`;
}
