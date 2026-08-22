export interface UserProfile {
  name: string;
  avatar: string;
  role: 'traveler' | 'operator' | 'admin';
  location: string;
  temp: string;
  weatherDesc: string;
  pace: string;
  interests: string[];
}

export interface ItineraryNode {
  id: string;
  title: string;
  category: string;
  time: string;
  duration?: string;
  status?: 'completed' | 'active' | 'planned' | 'warning';
  icon?: string;
  address?: string;
  description?: string;
  warning?: string;
  matchScore?: number;
}

export interface TourBooking {
  id: string;
  tour: string;
  client: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  amount: string;
  date?: string;
}

export interface PendingTourReview {
  id: string;
  tourName: string;
  operatorName: string;
  operatorAvatar: string;
  rating: number;
  activeTours: number;
  submittedTime: string;
  price: string;
  duration: string;
  maxPeople: number;
  languages: string;
  category: string;
  matchScore: number;
  heroImage: string;
  overview: string;
  itinerary: ItineraryNode[];
}
