export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: "active" | "inactive" | "suspended";
  avatar?: string;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  category: string;
  region: string;
  city: string;
  points: number;
  awards: number;
  followers: number;
  following: number;
  status: "active" | "expired" | "expiring_soon";
  membershipExpiry: string;
  joinedAt: string;
  referredBy?: string;
  avatar?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  permissions: string[];
  createdAt: string;
}

export interface Region {
  _id: string;
  country: string;
  state: string;
  city: string;
  areas?: { _id: string; name: string }[];
  memberCount: number;
  status: "active" | "inactive";
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  status: "draft" | "published" | "scheduled";
  createdAt: string;
  author: string;
  announcementType?: "Event" | "Online Stall";
  date?: string;
  time?: string;
  location?: string;
  points?: number;
  membersLimit?: number;
  scheduleDate?: string;
  isOfflineStallExist?: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  attendees: number;
  banner?: string;
}

export interface Training {
  id: string;
  title: string;
  trainer: string;
  date: string;
  time: string;
  duration: string;
  status: "scheduled" | "completed" | "cancelled";
  attendees: number;
  category: string;
  viewCount: number;
}

export interface Reply {
  id: string;
  authorName: string;
  authorHandle: string;
  avatarColor: string;
  initials: string;
  timestamp: string;
  content: string;
  nestedReplies?: Reply[];
}

export interface Activity {
  id: string;
  memberId: string;
  memberName: string;
  type: "post" | "ask" | "give" | "requirement";
  title: string;
  description: string;
  status: "active" | "closed" | "pending";
  date: string;
  category: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  content: string;
  replies: Reply[];
}

export interface Post {
  _id: string;
  type: "PROMOTION" | "GIVE" | "ASK" | "REQUIREMENT";
  title: string;
  description: string;
  location: string;
  period: string;
  media: string[];
  memberId: string;
  sharedCount: number;
  responsedCount: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  member: {
    _id: string;
    fullName: string;
    profilePhoto: string;
    businessName: string;
  };
  status: string;
}

export interface PointEntry {
  id: string;
  memberId: string;
  memberName: string;
  points: number;
  category?: string; // Business category (Trading, Services, etc.)
  reason: string;
  type: "earned" | "redeemed";
  date: string;
}

export interface AwardEntry {
  id: string;
  memberId: string;
  memberName: string;
  awardName: string;
  category: string;
  description: string;
  date: string;
  image?: string;
  status: "active" | "archived";
}

export interface NavItem {
  title: string;
  path: string;
  icon: string;
  children?: NavItem[];
}

export interface StatCardData {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: string;
}

export interface ReferralCategory {
  id: string;
  name: string;
  parentCategory?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt?: string;
}
