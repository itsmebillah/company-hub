export type ReleaseType = "major" | "minor" | "patch" | "hotfix";
export type ReleaseStatus = "draft" | "published" | "archived" | "failed";

export type ReleaseRecord = {
  id: string;
  version: string;
  title: string;
  description: string;
  releaseType: ReleaseType;
  whatsNew: string[];
  bugFixes: string[];
  improvements: string[];
  breakingChanges: string[];
  requiresUpdate: boolean;
  showPopup: boolean;
  publishedAt: string | null;
  commitSha: string;
  deploymentId: string;
  status: ReleaseStatus;
  releaseNotes: string;
};
