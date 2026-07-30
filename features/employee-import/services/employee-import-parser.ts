import type {
  EmployeeImportFileType,
  EmployeeImportRowDraft,
} from "@/features/employee-import/types/employee-import.types";

const HEADER_ALIASES: Record<
  string,
  keyof Omit<EmployeeImportRowDraft, "rowNumber">
> = {
  "employee id": "employeeId",
  employee_id: "employeeId",
  employeeid: "employeeId",
  "employee name": "name",
  name: "name",
  phone: "phone",
  role: "roleName",
  "role name": "roleName",
  role_name: "roleName",
  "manager employee id": "managerEmployeeId",
  manager_employee_id: "managerEmployeeId",
  manageremployeeid: "managerEmployeeId",
  "joining date": "joiningDate",
  joining_date: "joiningDate",
  status: "status",
  "work mode": "workMode",
  work_mode: "workMode",
  workmode: "workMode",
  email: "email",
  "date of birth": "dateOfBirth",
  date_of_birth: "dateOfBirth",
  "photo url": "photoUrl",
  photo_url: "photoUrl",
};

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9_ ]+/g, "");
}

function getFileType(name: string): EmployeeImportFileType {
  return name.trim().toLowerCase().endsWith(".xlsx") ? "xlsx" : "csv";
}

function normalizeCell(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).trim();
}

export async function parseEmployeeImportFile(file: File): Promise<{
  fileType: EmployeeImportFileType;
  rows: EmployeeImportRowDraft[];
}> {
  const fileType = getFileType(file.name);
  const buffer = await file.arrayBuffer();
  const { read, utils } = await import("xlsx");
  const workbook = read(buffer, {
    type: "array",
    cellDates: true,
    raw: false,
  });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    return { fileType, rows: [] };
  }

  const sheet = workbook.Sheets[sheetName];
  const values = utils.sheet_to_json<
    (string | number | boolean | Date | null)[]
  >(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });
  const [headerRow, ...bodyRows] = values;

  if (!headerRow) {
    return { fileType, rows: [] };
  }

  const columnMap = headerRow.map((header) => {
    const alias = HEADER_ALIASES[normalizeHeader(header)];
    return alias ?? null;
  });

  const rows = bodyRows
    .map((row, index): EmployeeImportRowDraft => {
      const draft: EmployeeImportRowDraft = {
        rowNumber: index + 2,
        employeeId: "",
        name: "",
        phone: "",
        roleName: "",
        managerEmployeeId: "",
        joiningDate: "",
        status: "",
        workMode: "",
        email: "",
        dateOfBirth: "",
        photoUrl: "",
      };

      row.forEach((cell, cellIndex) => {
        const key = columnMap[cellIndex];

        if (!key) {
          return;
        }

        draft[key] = normalizeCell(cell);
      });

      return draft;
    })
    .filter((row) =>
      Object.entries(row).some(
        ([key, value]) => key === "rowNumber" || value !== "",
      ),
    );

  return { fileType, rows };
}
