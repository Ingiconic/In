// Utility functions for messenger

export const formatChatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'الان';
  if (diffMins < 60) return `${diffMins} دقیقه`;
  if (diffHours < 24) return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'دیروز';
  if (diffDays < 7) return date.toLocaleDateString('fa-IR', { weekday: 'short' });
  return date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
};

export const formatMessageTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
};

export const formatLastSeen = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'همین الان آنلاین بود';
  if (diffMins < 60) return `${diffMins} دقیقه پیش آنلاین بود`;
  if (diffHours < 24) return `${diffHours} ساعت پیش آنلاین بود`;
  if (diffDays === 1) return 'دیروز آنلاین بود';
  if (diffDays < 7) return `${diffDays} روز پیش آنلاین بود`;
  return date.toLocaleDateString('fa-IR', { month: 'long', day: 'numeric' }) + ' آنلاین بود';
};

export const groupMessagesByDate = (messages: any[]): Map<string, any[]> => {
  const groups = new Map<string, any[]>();
  
  for (const msg of messages) {
    const date = new Date(msg.created_at);
    const dateKey = date.toLocaleDateString('fa-IR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(msg);
  }
  
  return groups;
};

export const isToday = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const isYesterday = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
};

export const getDateLabel = (dateStr: string): string => {
  if (isToday(dateStr)) return 'امروز';
  if (isYesterday(dateStr)) return 'دیروز';
  return new Date(dateStr).toLocaleDateString('fa-IR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};
