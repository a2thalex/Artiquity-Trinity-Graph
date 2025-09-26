import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envLocalPath = path.join(__dirname, "..", ".env.local");
dotenv.config({ path: envLocalPath });
dotenv.config();

const port = process.env.NGROK_PORT ?? "3000";
const domain = process.env.NGROK_DOMAIN;
const region = process.env.NGROK_REGION;
const authtoken = process.env.NGROK_AUTHTOKEN;
const edge = process.env.NGROK_EDGE;

if (!domain && !(authtoken && edge)) {
  console.error(
    "NGROK_DOMAIN (or NGROK_EDGE + NGROK_AUTHTOKEN) must be set. Add it to .env.local or export it before running dev:public."
  );
  process.exit(1);
}

const args = ["http", "--log", "stdout"];

if (domain) {
  args.push("--url", domain);
} else if (authtoken && edge) {
  args.push("--edge", edge);
}

if (region) {
  args.push("--region", region);
}

args.push(port);

const isWindows = process.platform === "win32";
const binaryName = isWindows ? "ngrok.cmd" : "ngrok";

const resolveBinary = () => {
  if (process.env.NGROK_PATH) {
    return process.env.NGROK_PATH;
  }

  const localBin = path.resolve(process.cwd(), "node_modules", ".bin", binaryName);
  if (fs.existsSync(localBin)) {
    return localBin;
  }

  return binaryName;
};

const command = resolveBinary();

const child = spawn(command, args, {
  stdio: "inherit",
  shell: isWindows,
});

child.on("error", (error) => {
  console.error("Failed to start ngrok:", error);
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
