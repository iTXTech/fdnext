import { createEngine } from "@itxtech/fdnext-core";
import { createFdServerConfig } from "./config";
import { handleFdServerFetchRequest, handleFdServerUrl } from "./routes";
import type { FdServerHandler, FdServerHandlerOptions } from "./types";

export { createFdServerConfig } from "./config";
export {
  FD_SERVER_NAME,
  fdServerJson,
  handleFdServerFetchRequest,
  handleFdServerUrl
} from "./routes";
export type {
  FdServerConfig,
  FdServerEnv,
  FdServerHandler,
  FdServerHandlerOptions,
  FdServerHttpResponse
} from "./types";

export function createFdServerHandler(options: FdServerHandlerOptions = {}): FdServerHandler {
  const config = createFdServerConfig(options);
  const engine = options.engine ?? createEngine();
  return {
    engine,
    config,
    handleUrl: (url) => handleFdServerUrl(engine, config, url),
    handleRequest: (request) => handleFdServerFetchRequest(engine, config, request)
  };
}
