export interface AccessLogRow {
  id: number;
  official_id: string;
  accessed_user_id: string | null;
  access_type: string;
  accessed_data: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}
