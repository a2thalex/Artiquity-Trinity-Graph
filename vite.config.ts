import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  const allowedHosts: string[] = [];

  const normalizeHost = (value?: string | null): string | null => {
    if (!value) {
      return null;
    }
    const cleaned = value.replace(/^https?:\/\//, "").trim();
    return cleaned.length > 0 ? cleaned : null;
  };

  const addHostsFromList = (value?: string | null) => {
    if (!value) {
      return;
    }

    value
      .split(",")
      .map((item) => normalizeHost(item))
      .filter((item): item is string => Boolean(item))
      .forEach((item) => {
        if (!allowedHosts.includes(item)) {
          allowedHosts.push(item);
        }
      });
  };

  const ngrokHost = normalizeHost(env.NGROK_DOMAIN);
  if (ngrokHost) {
    allowedHosts.push(ngrokHost);
  }

  addHostsFromList(env.NGROK_ALLOWED_HOSTS);
  addHostsFromList(env.ALLOWED_HOSTS);

  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: "http://localhost:3002",
          changeOrigin: true,
        },
      },
      ...(allowedHosts.length > 0 ? { allowedHosts } : {}),
    },
    plugins: [react()],
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
