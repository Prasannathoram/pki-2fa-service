#!/usr/bin/env node

import fs from "fs";
import { authenticator } from "otplib";

const SEED_PATH = "/data/seed.txt";

// Configure TOTP (same as server)
authenticator.options = {
  step: 30,
  digits: 6,
  algorithm: "sha1",
};

try {

  if (!fs.existsSync(SEED_PATH)) {
    console.log("Seed not found");
    process.exit(0);
  }

  // Read seed
  const seed = fs.readFileSync(SEED_PATH, "utf8").trim();

  // Generate TOTP directly from hex seed
  const code = authenticator.generate(seed);

  // Format timestamp
  const now = new Date();
  const timestamp = now.toISOString().replace("T", " ").slice(0, 19);

  // Print EXACT format evaluator expects
  console.log(`${timestamp} - 2FA Code: ${code}`);

} catch (err) {

  console.error("Cron error:", err.message);

}