import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { MobileAuthContext } from "@/features/mobile-api/types/mobile-api.types";
import { MobileApiError } from "@/features/mobile-api/services/mobile-api-error";

function validate(input: Record<string, unknown>) {
  const phone = input.phone;
  const email = input.email;
  const dateOfBirth = input.dateOfBirth;
  if (typeof phone !== "string" || !/^[+0-9() -]{7,20}$/.test(phone.trim()))
    throw new MobileApiError(400, "invalid_phone", "Phone number format is invalid.");
  if (typeof email !== "string" || (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())))
    throw new MobileApiError(400, "invalid_email", "Email address is invalid.");
  if (typeof dateOfBirth !== "string" || (dateOfBirth && Number.isNaN(new Date(dateOfBirth).getTime())))
    throw new MobileApiError(400, "invalid_date_of_birth", "Date of birth is invalid.");
}

export const MobileProfileService = {
  async getProfile(context: MobileAuthContext) {
    const admin = createSupabaseAdminClient();
    const [{ data: employee, error }, { data: company }] = await Promise.all([
      admin.from("employees").select("employee_id, name, phone, email, date_of_birth, joining_date, photo_url, company_id, work_mode, status, role_id").eq("id", context.employee.id).eq("company_id", context.employee.companyId).single(),
      admin.from("company_settings").select("company_name").eq("company_id", context.employee.companyId).maybeSingle(),
    ]);
    if (error || !employee || employee.status !== "active") throw new MobileApiError(403, "active_employee_required", "An active employee account is required.");
    return { employeeId: employee.employee_id, name: employee.name, phone: employee.phone ?? "", email: employee.email ?? "", dateOfBirth: employee.date_of_birth ?? "", joiningDate: employee.joining_date ?? "", photoUrl: employee.photo_url ?? null, companyName: company?.company_name ?? "Company Hub", roleName: context.employee.roleName, workMode: employee.work_mode, status: employee.status };
  },
  async updateProfile(context: MobileAuthContext, input: Record<string, unknown>) {
    validate(input);
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("employees").update({ phone: (input.phone as string).trim(), email: (input.email as string).trim() || null, date_of_birth: (input.dateOfBirth as string) || null, updated_at: new Date().toISOString(), updated_by: context.employee.id }).eq("id", context.employee.id).eq("company_id", context.employee.companyId);
    if (error) throw new MobileApiError(503, "profile_unavailable", "Unable to update profile.", 30);
    return this.getProfile(context);
  },
};
