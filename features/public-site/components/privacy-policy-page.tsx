import { LegalPage } from "@/features/public-site/components/legal-page";

export function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Company Hub legal"
      title="Privacy Policy"
      summary="This policy explains how Company Hub processes personal information and uses Google services to provide attendance-media storage and approved reporting synchronization."
      effectiveDate="August 15, 2026"
      sections={[
        {
          title: "1. Scope and roles",
          content: (
            <>
              <p>
                Company Hub is an employee-operations application used by
                participating organizations. The organization that provides your
                account controls its workforce records and decides how Company
                Hub is used. Access is limited to authorized employees, company
                administrators, and separately authorized system administrators.
              </p>
              <p>
                This public website does not display employee profiles,
                attendance records, attendance media, or authenticated
                dashboards.
              </p>
            </>
          ),
        },
        {
          title: "2. Information Company Hub processes",
          content: (
            <>
              <p>
                Depending on the features enabled by your organization, Company
                Hub may process:
              </p>
              <ul>
                <li>
                  account, employment, role, reporting-line, and profile
                  information;
                </li>
                <li>
                  attendance time, approved work mode, location-validation
                  results, and attendance selfies;
                </li>
                <li>
                  leave, calendar, announcement, resource, and notification
                  information; and
                </li>
                <li>
                  technical information needed for security, sessions,
                  synchronization, recovery, and service health.
                </li>
              </ul>
            </>
          ),
        },
        {
          title: "3. Google Drive access and attendance media",
          content: (
            <>
              <p>
                <strong>Purpose.</strong> Company Hub uses Google Drive through
                OAuth 2.0 access granted by an authorized operational Google
                account. This access is used to create, locate, verify, read,
                and manage attendance-media files in the configured restricted
                Drive location so attendance selfies have durable storage and
                authorized administrators can review them.
              </p>
              <p>
                <strong>Storage and access.</strong> Google Drive file
                identifiers and synchronization metadata are stored in Company
                Hub. OAuth credentials remain server-side and are not sent to
                browsers or stored in employee records. Attendance media is not
                made public; authorized Company Hub server routes enforce
                organization and role checks before a preview is returned.
              </p>
              <p>
                <strong>Synchronization and retention.</strong> A private
                temporary recovery copy may be retained in Company Hub&apos;s
                storage until the Drive upload is verified and for a 72-hour
                recovery period afterward. The verified Drive copy is retained
                according to the participating organization&apos;s attendance,
                legal, and records-retention requirements, and may be removed
                through an authorized operational process.
              </p>
            </>
          ),
        },
        {
          title: "4. Google Sheets access and reporting synchronization",
          content: (
            <>
              <p>
                Company Hub uses a dedicated Google service account—not a
                visitor&apos;s or employee&apos;s Google OAuth grant—to access
                only the configured reporting workbook. The service account has
                no domain-wide delegation.
              </p>
              <p>
                The current Google Sheets integration synchronizes an approved
                Holidays reporting dataset. It may write stable record
                identifiers, calendar names, holiday dates and titles, holiday
                type, working-day status, descriptions, record status, and
                source update time. Employee, leave, attendance, and
                attendance-media datasets are not part of this Sheets
                projection.
              </p>
              <p>
                Sheets data is a derived reporting copy; Company Hub&apos;s
                operational database remains authoritative. Synchronization uses
                durable events, idempotent updates, retry handling, and
                reconciliation to repair missed, duplicate, or stale reporting
                rows. Reporting rows are retained or removed in line with the
                source record and the organization&apos;s reporting
                requirements.
              </p>
            </>
          ),
        },
        {
          title: "5. How information is used and disclosed",
          content: (
            <>
              <p>
                Information is used to authenticate users, provide workforce
                workflows, validate and review attendance, deliver approved
                reporting, maintain security, recover failed synchronization,
                and support the service.
              </p>
              <p>
                Information may be available to authorized personnel of the
                participating organization and to infrastructure providers that
                process it to operate Company Hub, including Supabase, Vercel,
                and Google. Company Hub does not sell Google user data or use it
                for advertising, credit decisions, or unrelated profiling.
              </p>
            </>
          ),
        },
        {
          title: "6. Google API Services User Data Policy",
          content: (
            <p>
              Company Hub&apos;s use and transfer of information received from
              Google APIs adheres to the Google API Services User Data Policy,
              including its Limited Use requirements. Google access is limited
              to the purposes described in this policy and is not transferred
              for advertising or sold to third parties.
            </p>
          ),
        },
        {
          title: "7. Security and retention",
          content: (
            <>
              <p>
                Company Hub uses encrypted network connections, server-only
                provider credentials, authenticated routes, role and
                organization checks, database row-level security, private
                storage, and redacted provider errors. No internet service can
                guarantee absolute security.
              </p>
              <p>
                Records are retained for the period needed to provide the
                service and meet the participating organization&apos;s
                operational, legal, audit, and retention obligations. The
                organization administering your account determines applicable
                workforce-record retention and authorized deletion.
              </p>
            </>
          ),
        },
        {
          title: "8. Your choices and requests",
          content: (
            <p>
              To request access, correction, deletion, or information about
              records associated with your Company Hub account, contact the
              organization that provided the account or your Company Hub
              administrator. Requests are handled subject to applicable law and
              the organization&apos;s employment and records obligations. The
              operational Google account owner may revoke Google Drive access
              through their Google Account controls, although doing so will stop
              new Drive synchronization until access is restored.
            </p>
          ),
        },
        {
          title: "9. Policy changes and contact",
          content: (
            <p>
              This policy may be updated when Company Hub&apos;s data practices
              or legal obligations change. The effective date above identifies
              the current version. Questions about this policy should be
              directed to your Company Hub administrator or the organization
              that provided your account.
            </p>
          ),
        },
      ]}
    />
  );
}
