
export interface TelegramMember {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  status: 'Active' | 'Idle' | 'Offline';
}

export interface TelegramChat {
  id: number;
  title: string;
  username: string | null;
  type: 'supergroup' | 'channel' | 'private';
  memberCount?: string;
}

export interface CampaignLog {
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'SYSTEM' | 'SCHEDULED';
  message: string;
  id: string;
}

export enum Page {
  LOGIN = 'login',
  VERIFY = 'verify',
  DASHBOARD = 'dashboard',
  BULK_SENDER = 'bulk_sender',
  CHATS = 'chats',
  MEMBERS = 'members',
  HISTORY = 'history'
}
