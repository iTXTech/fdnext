import {
  createFdnextCorsOptionsFromEnv,
  createRuntime,
  fdnextSearchLimitFromEnv,
  type FdnextRuntime,
  type FdnextRuntimeOptions
} from "@itxtech/fdnext-core/runtime";

export interface CfWorkersContext {
  waitUntil?(promise: Promise<unknown>): void;
  passThroughOnException?(): void;
}

export interface CfWorkersEntrypoint {
  fetch(request: Request, env?: Record<string, unknown>, ctx?: CfWorkersContext): Promise<Response>;
}

export function createCfWorkersAdapter(options: FdnextRuntimeOptions = {}): CfWorkersEntrypoint {
  let runtime: FdnextRuntime | undefined;
  return {
    fetch(request, env) {
      runtime ??= createRuntime({
        ...options,
        searchLimit: options.searchLimit ?? fdnextSearchLimitFromEnv(env)
      });
      return runtime.fetch(request, {
        adapter: "cf-workers",
        cors: createFdnextCorsOptionsFromEnv(env)
      });
    }
  };
}

export default createCfWorkersAdapter();
