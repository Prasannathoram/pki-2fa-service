import fs from "fs";
import { authenticator } from "otplib";

// Convert hex seed → base32
function hexToBase32(hex) {
  const bytes = Buffer.from(hex, "hex");
  return authenticator.encode(bytes.toString("base64"));
}

// Read the decrypted hex seed
const hexSeed = fs.readFileSync("decrypted_seed.txt", "utf8").trim();
const base32Seed = hexToBase32(hexSeed);

// Read the TOTP code you want to verify
const userCode = process.argv[2];  // pass the code when running

if (!userCode) {
  console.error("❌ ERROR: Please pass the TOTP code to verify!");
  process.exit(1);
}

// Set TOTP parameters
authenticator.options = {
  step: 30,
  digits: 6,
  algorithm: "sha1",
};

// Verify TOTP
const isValid = authenticator.verify({
  token: userCode,
  secret: base32Seed,
});

console.log(isValid ? "VALID TOTP 🎉" : "INVALID TOTP ❌");
