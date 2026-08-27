import "server-only";

export type FcmServerConfig = { projectId: string; clientEmail: string; privateKey: string };

export function getFcmServerConfig(): FcmServerConfig | null {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!projectId || !clientEmail || !privateKey || !privateKey.includes("BEGIN PRIVATE KEY")) return null;
  return { projectId, clientEmail, privateKey };
}