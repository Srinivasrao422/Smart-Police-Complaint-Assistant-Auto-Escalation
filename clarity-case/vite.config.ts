import { defineConfig } from "vite";
import path from "path";

// Load plugins dynamically to avoid hard failure when devDependencies
// (like @vitejs/plugin-react-swc or lovable-tagger) are not yet installed.
async function loadPlugins(mode: string) {
  const plugins: Array<any> = [];
  try {
    const reactMod = await import("@vitejs/plugin-react-swc");
    const react = reactMod && reactMod.default ? reactMod.default : reactMod;
    plugins.push(react());
  } catch (e) {
    // plugin not installed yet — log during debug but don't crash
    // eslint-disable-next-line no-console
    console.warn("@vitejs/plugin-react-swc not found. Skipping plugin.");
  }

  if (mode === "development") {
    try {
      const taggerMod = await import("lovable-tagger");
      const componentTagger = taggerMod.componentTagger ?? taggerMod.default?.componentTagger;
      if (componentTagger) plugins.push(componentTagger());
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("lovable-tagger not found. Skipping componentTagger.");
    }
  }

  return plugins;
}

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => ({
  // ensure plugins loaded dynamically
  plugins: await loadPlugins(mode),
  server: {
    // use host:true so Vite listens on all addresses (IPv4 + IPv6) in a cross-platform way
    host: true,
    port: 5173,
    hmr: {
      overlay: false,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
