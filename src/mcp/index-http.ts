#!/usr/bin/env node

import express from "express";
import { getPackageName, getPackageVersion } from "../core/version.js";
import {
  logTransportHelp,
  registerHttpRoutes,
  registerShutdownHandler,
} from "./http-routes.js";

console.error("Starting DataForSEO MCP Server...");
console.error(
  `Server name: ${getPackageName()}, version: ${getPackageVersion()}`
);

const app = express();

if (process.env.TRUST_PROXY === "true") {
  if (process.env.DEBUG === "true") {
    console.log("'trust proxy' enabled");
  }
  app.set("trust proxy", true);
}

app.use(express.json());
registerHttpRoutes(app);

const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;
const server = app.listen(port, () => {
  console.log(`MCP Stateless Streamable HTTP Server listening on port ${port}`);
  logTransportHelp();
});

registerShutdownHandler(server);
