export type CompanyTheme = "auto" | "light" | "dark";

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
