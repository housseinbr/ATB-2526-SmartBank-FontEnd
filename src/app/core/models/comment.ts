export interface CommentItem {
  idComment: number;
  userId: number | null;
  userFirstName: string | null;
  userLastName: string | null;
  userRole: string | null;
  text: string;
  date: string;
}
