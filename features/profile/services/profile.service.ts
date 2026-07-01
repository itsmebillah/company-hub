import "server-only";

import { redirect } from "next/navigation";

import { getCurrentAuthUser } from "@/features/auth/services/auth.service";
import type {
  ProfileData,
  ProfileFormValues,
} from "@/features/profile/types/profile.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function normalizeOptional(value: string) {
  const nextValue = value.trim();

  return nextValue.length > 0 ? nextValue : null;
}

function validateEmail(value: string) {
  if (!value.trim()) {
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    throw new Error("Email address is invalid.");
  }
}

function validatePhone(value: string) {
  if (!value.trim()) {
    throw new Error("Phone number is required.");
  }

  if (!/^[+0-9() -]{7,20}$/.test(value.trim())) {
    throw new Error("Phone number format is invalid.");
  }
}

function validateDate(value: string) {
  if (!value) {
    return;
  }

  if (Number.isNaN(new Date(value).getTime())) {
    throw new Error("Date of birth is invalid.");
  }
}

async function getCurrentEmployee() {
  const user = await getCurrentAuthUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = createSupabaseAdminClient();
  const { data: employee, error } = await supabase
    .from("employees")
    .select(
      "id, employee_id, name, phone, email, date_of_birth, joining_date, photo_url, manager_id, role_id, status",
    )
    .eq("auth_user_id", user.id)
    .single();

  if (error || !employee || employee.status !== "active") {
    redirect("/login");
  }

  return employee;
}

export const ProfileService = {
  async getProfile(): Promise<ProfileData> {
    const supabase = createSupabaseAdminClient();
    const employee = await getCurrentEmployee();

    const [{ data: role }, managerResult] = await Promise.all([
      supabase.from("roles").select("name").eq("id", employee.role_id).single(),
      employee.manager_id
        ? supabase
            .from("employees")
            .select("employee_id, name")
            .eq("id", employee.manager_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    return {
      id: employee.id,
      employeeId: employee.employee_id,
      fullName: employee.name,
      phone: employee.phone ?? "",
      email: employee.email ?? "",
      dateOfBirth: employee.date_of_birth ?? "",
      joiningDate: employee.joining_date ?? "",
      photoUrl: employee.photo_url ?? "",
      roleName: role?.name ?? "Employee",
      reportsTo: managerResult.data
        ? `${managerResult.data.name} (${managerResult.data.employee_id})`
        : "None",
      status: employee.status,
    };
  },

  async updateProfile(values: ProfileFormValues) {
    const employee = await getCurrentEmployee();
    const supabase = createSupabaseAdminClient();

    validatePhone(values.phone);
    validateEmail(values.email);
    validateDate(values.dateOfBirth);

    const { error } = await supabase
      .from("employees")
      .update({
        phone: values.phone.trim(),
        email: normalizeOptional(values.email),
        date_of_birth: normalizeOptional(values.dateOfBirth),
        photo_url: normalizeOptional(values.photoUrl),
        updated_at: new Date().toISOString(),
        updated_by: employee.id,
      })
      .eq("id", employee.id);

    if (error) {
      throw new Error("Unable to update profile.");
    }
  },
};
