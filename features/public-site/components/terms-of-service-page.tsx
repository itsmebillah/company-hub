import { LegalPage } from "@/features/public-site/components/legal-page";

export function TermsOfServicePage() {
  return (
    <LegalPage
      eyebrow="Company Hub legal"
      title="Terms of Service"
      summary="These terms govern authorized access to Company Hub and supplement any agreement or workplace policy established by the organization providing an account."
      effectiveDate="August 15, 2026"
      sections={[
        {
          title: "1. Authorized use",
          content: (
            <p>
              Company Hub is provided for legitimate employee and company
              operations. You may use it only if an organization has authorized
              your account and only for the responsibilities associated with
              your assigned access. There is no public employee registration.
            </p>
          ),
        },
        {
          title: "2. Accounts and access",
          content: (
            <p>
              Keep your credentials confidential, use only your own account, and
              notify your Company Hub administrator if you suspect unauthorized
              access. Roles and permissions are assigned by the participating
              organization. Access may be restricted, suspended, or removed when
              employment, authorization, company status, or security
              requirements change.
            </p>
          ),
        },
        {
          title: "3. Acceptable use",
          content: (
            <>
              <p>You must not:</p>
              <ul>
                <li>
                  access another person&apos;s account or data without
                  authorization;
                </li>
                <li>
                  bypass authentication, role, organization, or feature
                  controls;
                </li>
                <li>
                  submit unlawful, misleading, malicious, or rights-infringing
                  content;
                </li>
                <li>
                  interfere with the service, its integrations, or its security
                  controls; or
                </li>
                <li>
                  use Company Hub or connected Google services for an unrelated
                  purpose.
                </li>
              </ul>
            </>
          ),
        },
        {
          title: "4. Attendance, media, and reporting",
          content: (
            <p>
              Attendance entries, location-validation results, and attendance
              selfies must be submitted only for authorized workplace purposes
              and must be accurate. Authorized administrators may review
              attendance media. Approved reporting data may be synchronized to
              Google Sheets, and attendance media may be stored in restricted
              Google Drive, as described in the Privacy Policy and your
              organization&apos;s policies.
            </p>
          ),
        },
        {
          title: "5. Organization content and responsibilities",
          content: (
            <p>
              Participating organizations are responsible for configuring
              Company Hub, assigning access, providing required notices,
              establishing workforce and retention policies, and ensuring that
              their use complies with applicable law. Users retain
              responsibility for the accuracy and lawfulness of information they
              submit.
            </p>
          ),
        },
        {
          title: "6. Service availability and third-party services",
          content: (
            <p>
              Company Hub depends on infrastructure and services supplied by
              third parties, including Supabase, Vercel, and Google.
              Availability may be interrupted by maintenance, provider outages,
              security events, or configuration changes. Features that rely on
              Google Drive or Google Sheets may pause if the relevant
              authorization or service configuration becomes unavailable.
            </p>
          ),
        },
        {
          title: "7. Intellectual property",
          content: (
            <p>
              Company Hub and its software, design, and documentation are
              protected by applicable intellectual-property laws.
              Organization-provided and user-submitted content remains subject
              to the rights and responsibilities established by its owner and
              applicable agreements.
            </p>
          ),
        },
        {
          title: "8. Disclaimers and liability",
          content: (
            <p>
              Company Hub is provided subject to applicable agreements and law.
              To the extent permitted by law, the service is provided without
              implied warranties beyond those that cannot legally be excluded,
              and liability is limited as provided by the applicable agreement.
              Nothing in these terms excludes rights or liabilities that cannot
              be excluded by law.
            </p>
          ),
        },
        {
          title: "9. Changes and contact",
          content: (
            <p>
              These terms may be updated as the service or legal requirements
              change. Continued authorized use after an update is subject to the
              revised terms and any applicable organization agreement. Questions
              should be directed to your Company Hub administrator or the
              organization that provided your account.
            </p>
          ),
        },
      ]}
    />
  );
}
