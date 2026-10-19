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
const DEFAULT_DRAIN_MS = 9000;
const FORCE_EXIT_MS = 25000;
const MAX_DRAIN_MS = FORCE_EXIT_MS - 1000;

const servers = new Set();
globalThis[SERVERS] = servers;

function track(server) {
  if (server && typeof server.on === "function") {
    servers.add(server);
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

let fallbackStarted = false;

function fallback(signal) {
  if (fallbackStarted) return;
  fallbackStarted = true;
  globalThis[DRAINING] = true;
  console.info(`[shutdown] ${signal}: draining for ${drainMs()}ms`);
  const force = setTimeout(() => {
    console.error(`[shutdown] force exit after ${FORCE_EXIT_MS}ms`);
    process.exit(0);
  }, FORCE_EXIT_MS);
  setTimeout(() => {
    const pending = [...servers].map(
      (server) =>
        new Promise((resolve) => {
          const idle = setInterval(() => {
            if (typeof server.closeIdleConnections === "function") server.closeIdleConnections();
          }, 200);
          server.close(() => {
            clearInterval(idle);
            resolve();
          });
          if (typeof server.closeIdleConnections === "function") server.closeIdleConnections();
        }),
    );
    Promise.all(pending)
      .then(async () => {
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
        process.exit(0);
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
