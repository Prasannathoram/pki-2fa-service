import fs from 'fs';
import crypto from 'crypto';

// 1. INSERT YOUR COMMIT HASH HERE
const commitHash = "a3beb7711cd45d4ac73eec15dade9aeee6e6478a";

// 2. Load Student Private Key (for RSA-PSS-SHA256 signing)
const studentPrivateKey = fs.readFileSync('./student_private.pem', 'utf8');

// 3. Sign commit hash using RSA-PSS with SHA-256
const signature = crypto.sign(
  "sha256",
  Buffer.from(commitHash, "utf8"),  // ASCII bytes of hash
  {
    key: studentPrivateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN
  }
);

// 4. Load Instructor Public Key (for RSA-OAEP encryption)
const instructorPublicKey = fs.readFileSync('./instructor_public.pem', 'utf8');

// 5. Encrypt signature using RSA-OAEP-SHA256
const encryptedSignature = crypto.publicEncrypt(
  {
    key: instructorPublicKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: "sha256",
  },
  signature
);

// 6. Base64 encode result
const finalProof = encryptedSignature.toString("base64");

// 7. Output required values
console.log("Commit Hash:", commitHash);
console.log("Encrypted Signature:", finalProof);
