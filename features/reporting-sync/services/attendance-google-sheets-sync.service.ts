import "server-only";
import { GoogleSheetsAttendanceProjection } from "@/features/reporting-sync/integrations/google-sheets-attendance-projection";
import { ReportingSyncRepository } from "@/features/reporting-sync/repositories/reporting-sync.repository";
import { getGoogleSheetsConfig } from "@/lib/google/config";

export const AttendanceGoogleSheetsSyncService = {
 async run(input:{jobLimit?:number}={}) {
  const companyId=process.env.GOOGLE_SHEETS_REPORTING_COMPANY_ID?.trim();
  if(!companyId) throw new Error("Google Sheets reporting company is not configured.");
  const {attendanceSpreadsheetId}=getGoogleSheetsConfig();
  await ReportingSyncRepository.ensureAttendanceDestination(companyId,attendanceSpreadsheetId);
  const workerId=crypto.randomUUID(); const jobs=await ReportingSyncRepository.claimAttendanceJobs(workerId,input.jobLimit??20); let synced=0; let failed=0;
  for(const job of jobs){
   try { const projection=await ReportingSyncRepository.findAttendanceProjection(job.eventId,job.companyId); await GoogleSheetsAttendanceProjection.apply({spreadsheetId:job.spreadsheetId,sheetName:job.sheetName},[{recordId:job.eventId,projection}]); await ReportingSyncRepository.completeAttendanceJob(job.outboxId,workerId); synced++; }
   catch(error){ failed++; await ReportingSyncRepository.failAttendanceJob(job.outboxId,workerId,error instanceof Error&&error.message==="sheets_schema_mismatch"?"sheets_schema_mismatch":"sheets_sync_failed"); }
  }
  return {claimed:jobs.length,synced,failed};
 }
};