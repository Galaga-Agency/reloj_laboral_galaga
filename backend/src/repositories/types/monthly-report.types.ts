export interface MonthlyReportRow {
  id: string;
  usuario_id: string;
  year: number;
  month: number;
  report_data: any;
  pdf_url: string | null;
  generated_at: Date;
  viewed_at: Date | null;
  accepted_at: Date | null;
  contested_at: Date | null;
  contest_reason: string | null;
  is_accepted: boolean;
  is_contested: boolean;
  created_at: Date;
  updated_at: Date;
}
