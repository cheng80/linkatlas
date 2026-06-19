const { spawnSync } = require("node:child_process");
const { createRequire } = require("node:module");
const { rmSync } = require("node:fs");
const { dirname, join } = require("node:path");

const workspaceRequire = createRequire(join(process.cwd(), "package.json"));
const packagePath = workspaceRequire.resolve("better-sqlite3/package.json");
const packageDirectory = dirname(packagePath);
rmSync(join(packageDirectory, "build", "node_gyp_bins"), { force: true, recursive: true });

const executable = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const result = spawnSync(executable, ["run", "build-release"], {
  cwd: packageDirectory,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
