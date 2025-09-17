export interface AccessLogEntry {
  id: number;
  official_name: string;
  accessed_user_name: string;
  access_type: string;
  accessed_data: any;
  created_at: string;
  ip_address?: string;
}
