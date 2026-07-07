export type CompanyTheme = "auto" | "light" | "dark";
export type CompanyLocationStatus = "active" | "inactive";

export type CompanyLocationValues = {
  id?: string;
  name: string;
  latitude: string;
  longitude: string;
  radiusMeters: string;
  status: CompanyLocationStatus;
};

export type CompanySettingsValues = {
  companyName: string;
  shortName: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  theme: CompanyTheme;
  supportEmail: string;
  supportPhone: string;
  website: string;
  address: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  locations: CompanyLocationValues[];
};

export type CompanySettingsActionState =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };
