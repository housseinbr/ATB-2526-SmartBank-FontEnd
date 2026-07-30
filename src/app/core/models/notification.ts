export type NotificationStatus = 'LU' | 'NON_LU';

export interface NotificationItem {
  id: number;
  userId: number | null;
  subject: string;
  date: string;
  text: string;
  status: NotificationStatus;
  read: boolean;
}
