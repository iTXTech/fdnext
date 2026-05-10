import { createFdnextRuntime, type FdnextRuntimeOptions } from "@itxtech/fdnext-runtime";

export interface CfWorkersContext {
  waitUntil?(promise: Promise<unknown>): void;
  passThroughOnException?(): void;
}

export interface CfWorkersEntrypoint {
  fetch(request: Request, env?: Record<string, unknown>, ctx?: CfWorkersContext): Promise<Response>;
}

export function createCfWorkersAdapter(options: FdnextRuntimeOptions = {}): CfWorkersEntrypoint {
  const runtime = createFdnextRuntime(options);
  return {
    fetch(request) {
      return runtime.fetch(request, {
        adapter: "cf-workers"
      });
    }
  };
}

export default createCfWorkersAdapter();
