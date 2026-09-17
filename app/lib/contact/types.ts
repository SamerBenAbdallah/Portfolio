export type ContactMessageStatus = "new" | "read" | "archived";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  project_type: string;
  message: string;
  status: ContactMessageStatus;
  created_at: string;
};
