/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS preload loaded via node --require before ESM is available. */
const Module = require("node:module");

const originalLoad = Module._load;

Module._load = function load(request, parent, isMain) {
  if (request === "server-only") {
    return {};
  }

  return originalLoad.call(this, request, parent, isMain);
};
