import fs from "fs";
import { authenticator } from "otplib";

function hexToBase32(hex) {
  const bytes = Buffer.from(hex, "hex");
  const base32 = bytes.toString("base64");
  return authenticator.encode(base32);
}

const hexSeed = fs.readFileSync("decrypted_seed.txt", "utf8").trim();

const base32Seed = hexToBase32(hexSeed);

authenticator.options = {
  step: 30,
  digits: 6,
  algorithm: "sha1"
};

const code = authenticator.generate(base32Seed);

console.log("Your TOTP Code:", code);
