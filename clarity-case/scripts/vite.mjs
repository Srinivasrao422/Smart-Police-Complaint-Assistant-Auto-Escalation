import path from "node:path";
import process from "node:process";
import react from "@vitejs/plugin-react-swc";
import { build, createServer, preview } from "vite";

const modeFlagIndex = process.argv.indexOf("--mode");
const mode =
  modeFlagIndex !== -1 && process.argv[modeFlagIndex + 1]
    ? process.argv[modeFlagIndex + 1]
    : undefined;

const rootDir = process.cwd();

const sharedConfig = {
  configFile: false,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
};

const command = process.argv[2] ?? "dev";

if (command === "build") {
  await build({
    ...sharedConfig,
    mode,
  });
} else if (command === "preview") {
  const previewServer = await preview({
    ...sharedConfig,
    preview: {
      host: true,
      port: 4173,
    },
    mode,
  });
  previewServer.printUrls();
} else {
  const server = await createServer({
    ...sharedConfig,
    server: {
      host: true,
      port: 5173,
      hmr: {
        overlay: false,
      },
    },
    mode,
  });

  await server.listen();
  server.printUrls();
}
