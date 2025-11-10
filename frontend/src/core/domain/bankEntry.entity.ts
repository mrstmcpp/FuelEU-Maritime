export interface BankEntry {
  id?: number;
  shipId: number;
  year: number;
  amountGco2eq: number;
  cb_before?: number;   // optional KPI field from API
  applied?: number;     // optional KPI field from API
  cb_after?: number;    // optional KPI field from API
  createdAt?: Date;
  updatedAt?: Date;
}
