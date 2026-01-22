/* eslint-disable no-console */

// Node deploy script (atomic-ish) via SSH key auth.
// - Zips CRA build output (./build)
// - Uploads zip to server
// - Removes old ./static (hashed assets)
// - Unzips with overwrite
// - Deletes zip
//
/**
 * Safe-by-default for OSS:
 * - Runs automatically after `npm run build` via `postbuild`.
 * - If DEPLOY_* vars are NOT configured, it exits 0 (skips deploy) so build does not fail.
 *
 * Usage:
 *   node scripts/deploy.js
 *   npm run deploy
 */

const { NodeSSH } = require("node-ssh");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

function loadEnvIfPresent() {
  const envPath = ".env";
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.substring(0, eqIndex).trim();
    const value = trimmed.substring(eqIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function ensureRequiredEnv(vars) {
  const missing = vars.filter((v) => !process.env[v]);
  return missing;
}

function zipDirectory(sourceDir, outZipPath) {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const stream = fs.createWriteStream(outZipPath);

  return new Promise((resolve, reject) => {
    archive.directory(sourceDir, false).on("error", reject).pipe(stream);
    stream.on("close", resolve);
    archive.finalize();
  });
}

async function deploy() {
  loadEnvIfPresent();

  const REMOTE_SITE_PATH = process.env.DEPLOY_REMOTE_PATH;
  const LOCAL_BUILD_PATH = process.env.DEPLOY_LOCAL_BUILD_PATH || "./build";
  const ARCHIVE_NAME = process.env.DEPLOY_ARCHIVE_NAME || "deploy.zip";

  const requiredEnvVars = [
    "DEPLOY_HOST",
    "DEPLOY_USER",
    "DEPLOY_SSH_KEY_PATH",
    "DEPLOY_REMOTE_PATH",
  ];
  const missingVars = ensureRequiredEnv(requiredEnvVars);

  // Auto-deploy after build should be non-breaking for OSS contributors.
  // If deploy config is missing, just skip with exit code 0.
  if (missingVars.length > 0) {
    console.log(
      `ℹ️ Deploy skipped: missing ${missingVars.join(
        ", "
      )}. Configure .env (see .env.example) to enable deploy.`
    );
    process.exit(0);
  }

  if (!fs.existsSync(LOCAL_BUILD_PATH)) {
    console.log(
      `ℹ️ Deploy skipped: build folder not found: ${LOCAL_BUILD_PATH}`
    );
    process.exit(0);
  }

  const ssh = new NodeSSH();

  const sshConfig = {
    host: process.env.DEPLOY_HOST,
    username: process.env.DEPLOY_USER,
    privateKey: fs.readFileSync(process.env.DEPLOY_SSH_KEY_PATH, "utf8"),
    port: Number(process.env.DEPLOY_PORT || 22),
  };

  console.log("🚀 Starting deployment (SSH key auth)...");
  console.log(`📍 Target: ${sshConfig.host}:${REMOTE_SITE_PATH}`);

  console.log("📦 Zipping build folder...");
  await zipDirectory(LOCAL_BUILD_PATH, ARCHIVE_NAME);

  try {
    console.log("🔌 Connecting via SSH...");
    await ssh.connect(sshConfig);

    const remoteZipPath = path.posix.join(REMOTE_SITE_PATH, ARCHIVE_NAME);

    console.log(`⬆️ Uploading ${ARCHIVE_NAME} -> ${remoteZipPath}`);
    await ssh.putFile(ARCHIVE_NAME, remoteZipPath);

    console.log("💥 Unzipping on server...");
    // Ensure we don't keep stale build artifacts (hashed assets, removed files, etc).
    // We intentionally do NOT delete dotfiles (e.g. .htaccess, .well-known) to avoid breaking server config.
    const command = [
      `cd ${REMOTE_SITE_PATH}`,
      // main CRA build artifacts / our public content folders
      "rm -rf static assets stories",
      // common CRA top-level files (from build root)
      "rm -f asset-manifest.json manifest.json robots.txt favicon.ico logo192.png logo512.png",
      "rm -f index.html *.map",
      `unzip -o ${ARCHIVE_NAME}`,
      `rm ${ARCHIVE_NAME}`,
    ].join(" && ");

    const result = await ssh.execCommand(command);

    if (result.stderr) console.error("⚠️ Server stderr:", result.stderr);
    console.log("✅ Server stdout:", result.stdout || "Done.");
    console.log("🎉 Deployment success!");
  } catch (err) {
    console.error("❌ Deployment failed:", err);
    process.exitCode = 1;
  } finally {
    try {
      if (fs.existsSync(ARCHIVE_NAME)) fs.unlinkSync(ARCHIVE_NAME);
    } catch (e) {
      // ignore
    }
    ssh.dispose();
  }
}

deploy();
