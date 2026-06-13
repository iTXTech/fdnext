import { createFdnextCorsOptionsFromEnv, createRuntime, type FdnextRuntimeOptions } from "@itxtech/fdnext-core/runtime";

export interface CfWorkersContext {
  waitUntil?(promise: Promise<unknown>): void;
  passThroughOnException?(): void;
}

export interface CfWorkersEntrypoint {
  fetch(request: Request, env?: Record<string, unknown>, ctx?: CfWorkersContext): Promise<Response>;
}

export function createCfWorkersAdapter(options: FdnextRuntimeOptions = {}): CfWorkersEntrypoint {
  let runtimePromise: ReturnType<typeof createRuntime> | undefined;
  return {
    fetch(request, env) {
      runtimePromise ??= createRuntime(options);
      return runtimePromise.then((runtime) =>
        runtime.fetch(request, {
          adapter: "cf-workers",
          cors: createFdnextCorsOptionsFromEnv(env)
        })
      );
    }
  };
}

export default createCfWorkersAdapter();
