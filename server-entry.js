"use strict";

/* eslint-disable @typescript-eslint/no-require-imports */

// PID 1 for the standalone server. Next's own SIGTERM handler closes the
// listener immediately and exits 143; this keeps accepting until the drain
// elapses. Timings match src/lib/shutdown/graceful.ts.
process.env.NEXT_MANUAL_SIG_HANDLE = "1";

const http = require("node:http");
const https = require("node:https");

const SERVERS = Symbol.for("benchline.http.servers");
const DRAINING = Symbol.for("benchline.draining");
const HANDLE = Symbol.for("benchline.shutdown.handle");
const LISTENING = Symbol.for("benchline.shutdown.listening");
const CLEANUP = Symbol.for("benchline.shutdown.cleanup");
const INFLIGHT = Symbol.for("benchline.http.inflight");
const DEFAULT_DRAIN_MS = 9000;
const FORCE_EXIT_MS = 25000;
const MAX_DRAIN_MS = FORCE_EXIT_MS - 1000;
const INFLIGHT_CLOSE_MS = 5000;
const KEEP_ALIVE_TIMEOUT_MS = 65000;
const HEADERS_TIMEOUT_MS = 66000;

const servers = new Set();
globalThis[SERVERS] = servers;
globalThis[INFLIGHT] = 0;

function inflightCount() {
  const value = globalThis[INFLIGHT];
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

function changeInflight(delta) {
  const next = inflightCount() + delta;
  globalThis[INFLIGHT] = next > 0 ? next : 0;
}

function applyTimeouts(server) {
  server.headersTimeout = HEADERS_TIMEOUT_MS;
  server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
}

function seal(res, args) {
  if (globalThis[DRAINING] !== true || res.headersSent) return;
  res.shouldKeepAlive = false;
  try {
    res.setHeader("Connection", "close");
  } catch {
    // Headers were already flushed.
  }
  if (!args) return;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg || typeof arg !== "object") continue;
    if (Array.isArray(arg)) {
      arg.push(["Connection", "close"]);
      continue;
    }
    arg.Connection = "close";
    arg.connection = "close";
  }
}

function watch(res) {
  changeInflight(1);
  let settled = false;
  const done = () => {
    if (settled) return;
    settled = true;
    changeInflight(-1);
  };
  res.on("close", done);
  const writeHead = res.writeHead;
  res.writeHead = function writeHeadWhileDraining() {
    seal(this, arguments);
    return writeHead.apply(this, arguments);
  };
  const end = res.end;
  res.end = function endWhileDraining() {
    seal(this, null);
    return end.apply(this, arguments);
  };
}

function track(server) {
  if (server && typeof server.on === "function") {
    servers.add(server);
    applyTimeouts(server);
    server.on("listening", () => {
      applyTimeouts(server);
    });
    server.on("request", (_req, res) => {
      watch(res);
    });
    server.on("close", () => {
      servers.delete(server);
    });
  }
  return server;
}

function wrap(mod) {
  if (typeof mod.createServer !== "function" || mod.createServer.benchlineTracked) return;
  const original = mod.createServer;
  function createServer() {
    return track(original.apply(this, arguments));
  }
  createServer.benchlineTracked = true;
  mod.createServer = createServer;
}

wrap(http);
wrap(https);
wrap(require("http"));
wrap(require("https"));

function drainMs() {
  const raw = process.env.SHUTDOWN_DRAIN_MS;
  if (raw == null || String(raw).trim() === "") return DEFAULT_DRAIN_MS;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return DEFAULT_DRAIN_MS;
  return Math.min(Math.floor(value), MAX_DRAIN_MS);
}

function exitWithCode(code) {
  process.exitCode = code;
  let remaining = 2;
  const finish = () => {
    remaining -= 1;
    if (remaining === 0) process.exit();
  };
  const flush = (stream) => {
    try {
      stream.write("", finish);
    } catch {
      finish();
    }
  };
  flush(process.stdout);
  flush(process.stderr);
}

let fallbackStarted = false;

function fallback(signal) {
  if (fallbackStarted) return;
  fallbackStarted = true;
  globalThis[DRAINING] = true;
  console.info(`[shutdown] ${signal}: draining for ${drainMs()}ms`);
  const force = setTimeout(() => {
    console.error(`[shutdown] force exit after ${FORCE_EXIT_MS}ms`);
    console.info("exiting 0");
    exitWithCode(0);
  }, FORCE_EXIT_MS);
  setTimeout(() => {
    console.info("closing server");
    const open = inflightCount();
    const pending = [...servers].map(
      (server) =>
        new Promise((resolve) => {
          let settled = false;
          if (typeof server.closeIdleConnections === "function") server.closeIdleConnections();
          const kill = setTimeout(() => {
            if (!settled && typeof server.closeAllConnections === "function") server.closeAllConnections();
          }, INFLIGHT_CLOSE_MS);
          server.close(() => {
            settled = true;
            clearTimeout(kill);
            resolve();
          });
        }),
    );
    Promise.all(pending)
      .then(async () => {
        console.info(`closed, in-flight=${open}`);
        const list = globalThis[CLEANUP];
        if (!Array.isArray(list)) return;
        for (const fn of list) {
          if (typeof fn === "function") await fn();
        }
      })
      .catch((error) => {
        console.error("[shutdown] cleanup failed", error);
      })
      .finally(() => {
        clearTimeout(force);
        console.info("exiting 0");
        exitWithCode(0);
      });
  }, drainMs());
}

function onSignal(signal) {
  const handle = globalThis[HANDLE];
  if (typeof handle === "function") handle(signal);
  else fallback(signal);
}

process.on("SIGTERM", () => onSignal("SIGTERM"));
process.on("SIGINT", () => onSignal("SIGINT"));
globalThis[LISTENING] = true;

require("./server.js");
