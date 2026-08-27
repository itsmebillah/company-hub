import assert from "node:assert/strict";
import test from "node:test";
import { attendanceMonthTab, attendanceProjectionToRow, ATTENDANCE_SHEET_HEADERS } from "../../features/reporting-sync/services/attendance-reporting-projection";
import { createAttendanceSheetInitializer } from "../../features/reporting-sync/integrations/google-sheets-attendance-projection";

test("attendance month tabs use authoritative month names",()=>{ assert.equal(attendanceMonthTab("2026-08-13"),"August 2026"); assert.equal(attendanceMonthTab("2027-01-01"),"January 2027"); });
test("attendance projection has stable idempotent row schema",()=>{ const row=attendanceProjectionToRow({recordId:"a",employeeId:"E1",employeeName:"Employee",role:"Staff",companyId:"c",attendanceDate:"2026-08-13",checkIn:"2026-08-13T02:00:00Z",checkOut:null,workingMinutes:0,status:"checked_in",lateMinutes:0,workMode:"office",attendanceType:"regular",checkInAddress:null,checkOutAddress:null,checkInLatitude:1,checkInLongitude:2,checkInAccuracy:3,checkOutLatitude:null,checkOutLongitude:null,checkOutAccuracy:null,checkInSelfieReference:null,checkOutSelfieReference:null,sourceUpdatedAt:"2026-08-13T02:00:00Z"}); assert.equal(row.length,ATTENDANCE_SHEET_HEADERS.length); assert.equal(row[0],"a"); });
test("concurrent initializers converge on one monthly tab", async () => {
 let adds = 0; let exists = false;
 const client = { getSpreadsheet: async () => ({ spreadsheetId: "sheet", sheets: exists ? [{ properties: { sheetId: 7, title: "August 2026" } }] : [] }), addSheet: async () => { adds++; if (adds > 1) { exists = true; throw new Error("duplicate title"); } exists = true; return { sheetId: 7, title: "August 2026" }; }, readValues: async () => ({ values: [[...ATTENDANCE_SHEET_HEADERS]] }), writeValues: async () => undefined, batchUpdate: async () => undefined, batchWriteValues: async () => undefined };
 const initializer = createAttendanceSheetInitializer(client);
 await Promise.all([initializer.ensureSheet({ spreadsheetId: "sheet", sheetName: "Attendance" }, "August 2026"), initializer.ensureSheet({ spreadsheetId: "sheet", sheetName: "Attendance" }, "August 2026")]);
 assert.equal(adds, 1);
});

test("duplicate-sheet response is recovered by re-reading exact tab", async () => {
 let reads = 0;
 const client = { getSpreadsheet: async () => ({ spreadsheetId: "sheet", sheets: reads++ > 0 ? [{ properties: { sheetId: 8, title: "September 2026" } }] : [] }), addSheet: async () => { throw new Error("already exists"); }, readValues: async () => ({ values: [[...ATTENDANCE_SHEET_HEADERS]] }), writeValues: async () => undefined, batchUpdate: async () => undefined, batchWriteValues: async () => undefined };
 const initializer = createAttendanceSheetInitializer(client);
 await initializer.ensureSheet({ spreadsheetId: "sheet", sheetName: "Attendance" }, "September 2026");
 assert.ok(reads >= 2);
});