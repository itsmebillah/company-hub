import { runDoctor } from "./local-config-doctor";

async function main() {
  const result = await runDoctor();
  if (!result.configured) process.exitCode = 1;
}

main().catch(() => {
  console.error("INVALID doctor.execution");
  process.exitCode = 1;
});
