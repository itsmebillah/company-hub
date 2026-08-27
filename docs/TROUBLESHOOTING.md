# Troubleshooting

- If signing validation reports missing variables, launch the build from the
  same terminal where all four `COMPANY_HUB_*` variables are set.
- If Flutter or Gradle hangs, capture the last task/output and stop the
  process; do not delete source, signing keys, or credentials.
- If Firebase files are absent, restore only the approved Android file locally
  and keep Admin credentials in the remote deployment environment.
- If Drive is unavailable, do not substitute another vault or hard-code a
  drive letter into portable scripts.
