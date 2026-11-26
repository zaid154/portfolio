import { spawn } from "node:child_process";

console.log("Starting Portfolio dev servers (Server + Client)...");

const server = spawn("npm", ["run", "dev", "--prefix", "server"], { stdio: "inherit", shell: true });
const client = spawn("npm", ["run", "dev", "--prefix", "client"], { stdio: "inherit", shell: true });

const shutdown = () => {
  server.kill();
  client.kill();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
