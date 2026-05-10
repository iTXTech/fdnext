import { runContractChecks } from "../packages/contract-test/src/index";

const summary = runContractChecks();

process.stdout.write(`Checked ${summary.checked} fdnext contract fixtures\n`);
