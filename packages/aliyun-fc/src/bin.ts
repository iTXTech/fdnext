import { startAliyunFc } from "./index";

const server = startAliyunFc();
const address = server.address();
const text = typeof address === "object" && address ? `${address.address}:${address.port}` : String(address);

process.stdout.write(`fdnext aliyun fc adapter listening on ${text}\n`);
