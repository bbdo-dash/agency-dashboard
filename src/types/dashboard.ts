export interface DashboardStats {
  totalClients: number;
  revenue: number;
  activeProjects: number;
  performance: number;
}

export interface NewsItem {
  id: string;
  title: string;
  headline?: string;
  content: string;
  category: string;
  author?: string;
  source: string;
  publishedAt: string;
  formattedDate?: string;
  urlToImage?: string;
  url: string;
  searchVolume?: string;
  rank?: number;
  newsLinks?: string[];
  newsHeadlines?: string[];
  relatedImages?: string[];
}

export interface InstagramPost {
  id: string;
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
} 