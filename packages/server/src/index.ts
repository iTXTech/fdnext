import { createServer as createNodeServer } from "node:http";
import { URL } from "node:url";
import { createEngine, type FlashDetectorEngine } from "@fdnext/core";
import { loadResourcesFromDir } from "@fdnext/core/node";
import { compileRulesToDecoders, defaultDslRules } from "@fdnext/dsl";

export interface HttpServerOptions {
  host?: string;
  port?: number;
  resourceDir: string;
  serverName?: string;
  simpleFrameworkHeader?: string;
}

function sendJson(
  res: import("node:http").ServerResponse,
  payload: unknown,
  simpleFrameworkHeader: string
): void {
  res.statusCode = 200;
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("X-SimpleFramework", simpleFrameworkHeader);
  res.end(JSON.stringify(payload));
}

function parseLimit(value: string | null): number {
  if (!value) {
    return 0;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function createHttpServer(options: HttpServerOptions) {
  const resources = loadResourcesFromDir(options.resourceDir);
  const engine = createEngine({
    resources,
    decoders: compileRulesToDecoders(defaultDslRules)
  });
  const serverName = options.serverName ?? "FDWebServer-TS";
  const simpleFrameworkHeader = options.simpleFrameworkHeader ?? `ts-${engine.getVersion()}`;

  const server = createNodeServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "127.0.0.1"}`);
    const lang = url.searchParams.get("lang");

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.end();
      return;
    }

    switch (url.pathname) {
      case "/":
        sendJson(
          res,
          { result: true, time: Math.floor(Date.now() / 1000), server: serverName },
          simpleFrameworkHeader
        );
        return;
      case "/info":
        sendJson(
          res,
          { result: true, ver: engine.getVersion(), info: engine.getInfo() },
          simpleFrameworkHeader
        );
        return;
      case "/decode": {
        const pn = url.searchParams.get("pn");
        sendJson(
          res,
          pn
            ? { result: true, data: engine.detect(pn, { lang, combineFdb: true }) }
            : { result: false, message: "Missing part number" },
          simpleFrameworkHeader
        );
        return;
      }
      case "/decodeId": {
        const id = url.searchParams.get("id");
        sendJson(
          res,
          id
            ? { result: true, data: engine.decodeFlashId(id, { lang, combineFdb: true }) }
            : { result: false, message: "Missing Flash Id" },
          simpleFrameworkHeader
        );
        return;
      }
      case "/searchPn": {
        const pn = url.searchParams.get("pn");
        sendJson(
          res,
          pn
            ? {
                result: true,
                data: engine.searchPartNumber(pn, {
                  lang,
                  limit: parseLimit(url.searchParams.get("limit")),
                  partialMatch: true
                })
              }
            : { result: false, message: "Missing part number" },
          simpleFrameworkHeader
        );
        return;
      }
      case "/searchId": {
        const id = url.searchParams.get("id");
        sendJson(
          res,
          id
            ? {
                result: true,
                data: engine.searchFlashId(id, {
                  lang,
                  limit: parseLimit(url.searchParams.get("limit")),
                  partialMatch: true
                })
              }
            : { result: false, message: "Missing Flash Id" },
          simpleFrameworkHeader
        );
        return;
      }
      case "/summary": {
        const pn = url.searchParams.get("pn");
        sendJson(
          res,
          pn ? { result: true, data: engine.getSummary(pn, lang) } : { result: false, message: "Missing part number" },
          simpleFrameworkHeader
        );
        return;
      }
      case "/summaryId": {
        const id = url.searchParams.get("id");
        sendJson(
          res,
          id ? { result: true, data: engine.getIdSummary(id, lang) } : { result: false, message: "Missing flash Id" },
          simpleFrameworkHeader
        );
        return;
      }
      default:
        sendJson(res, { result: false, message: "Not found" }, simpleFrameworkHeader);
    }
  });

  return {
    engine,
    server,
    listen: (port = options.port ?? 8080, host = options.host ?? "0.0.0.0") =>
      new Promise<void>((resolve) => {
        server.listen(port, host, () => resolve());
      })
  };
}

export function createDefaultEngine(resourceDir: string): FlashDetectorEngine {
  return createEngine({
    resources: loadResourcesFromDir(resourceDir),
    decoders: compileRulesToDecoders(defaultDslRules)
  });
}
