const fs = require('fs');
const crypto = require('crypto');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicExponent: 0x10001,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

fs.writeFileSync('student_private.pem', privateKey);
fs.writeFileSync('student_public.pem', publicKey);

console.log("Student RSA key pair generated!");
