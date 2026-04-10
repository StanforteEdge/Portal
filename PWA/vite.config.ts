import { fileURLToPath, URL } from "node:url";

import { defineConfig, splitVendorChunkPlugin } from "vite";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = env.VITE_APP_BASE_PATH || "/";

  return {
    base,
    build: {
      commonjsOptions: {
        include: [/node_modules/, /tailwind\.config\.js/],
        transformMixedEsModules: true,
      },
    },
    optimizeDeps: {
      include: ["tailwind-config"],
    },
    plugins: [react(), splitVendorChunkPlugin()],
    resolve: {
      dedupe: ["react", "react-dom", "react-router", "react-router-dom"],
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "tailwind-config": fileURLToPath(
          new URL("./tailwind.config.js", import.meta.url)
        ),
      },
    },
  };
});
