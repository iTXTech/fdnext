import { createFdServerHandler, type FdServerEnv, type FdServerHandler } from "./handler";

export interface FdServerWorkerEntrypoint {
  fetch(request: Request, env?: Record<string, unknown>): Response | Promise<Response>;
}

let cachedHandler: { signature: string; handler: FdServerHandler } | undefined;

function envString(env: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = env?.[key];
  return typeof value === "string" ? value : undefined;
}

function fdServerEnv(env: Record<string, unknown> | undefined): FdServerEnv {
  return {
    FD_SERVER_DEFAULT_LANG: envString(env, "FD_SERVER_DEFAULT_LANG"),
    FD_SERVER_CONTROLLER_GROUP: envString(env, "FD_SERVER_CONTROLLER_GROUP"),
    FD_SERVER_SEARCH_LIMIT: envString(env, "FD_SERVER_SEARCH_LIMIT"),
    FDNEXT_CORS_ORIGINS: envString(env, "FDNEXT_CORS_ORIGINS"),
    FDNEXT_SEARCH_LIMIT: envString(env, "FDNEXT_SEARCH_LIMIT"),
    FD_SERVER_EXTRA_URLS: envString(env, "FD_SERVER_EXTRA_URLS")
  };
}

function envSignature(env: FdServerEnv): string {
  return [
    env.FD_SERVER_DEFAULT_LANG ?? "",
    env.FD_SERVER_CONTROLLER_GROUP ?? "",
    env.FD_SERVER_SEARCH_LIMIT ?? "",
    env.FDNEXT_CORS_ORIGINS ?? "",
    env.FDNEXT_SEARCH_LIMIT ?? "",
    env.FD_SERVER_EXTRA_URLS ?? ""
  ].join("\u0000");
}

function handlerForEnv(env: Record<string, unknown> | undefined): FdServerHandler {
  const cleanEnv = fdServerEnv(env);
  const signature = envSignature(cleanEnv);
  if (!cachedHandler || cachedHandler.signature !== signature) {
    cachedHandler = {
      signature,
      handler: createFdServerHandler({
        env: cleanEnv,
        warn: (message) => console.warn(message)
      })
    };
  }
  return cachedHandler.handler;
}

export function createFdServerWorkerEntrypoint(): FdServerWorkerEntrypoint {
  return {
    fetch(request, env) {
      return handlerForEnv(env).handleRequest(request);
    }
  };
}

export default createFdServerWorkerEntrypoint();
