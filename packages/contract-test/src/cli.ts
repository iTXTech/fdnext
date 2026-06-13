import { runContractChecks } from "./index";

const summary = await runContractChecks();

process.stdout.write(`Checked ${summary.checked} fdnext contract fixtures\n`);
