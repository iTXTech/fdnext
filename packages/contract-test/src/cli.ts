import { runContractChecks } from "./index";

const summary = runContractChecks();

process.stdout.write(`Checked ${summary.checked} fdnext contract fixtures\n`);
