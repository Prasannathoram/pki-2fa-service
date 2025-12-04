import fs from "fs";
import https from "https";


const STUDENT_ID = "23MH1A4955";
const GITHUB_REPO = "https://github.com/Prasannathoram/pki-2fa-service";
const API_URL = "https://eajeyq4r3zljoq4rpovy2nthda0vtjqf.lambda-url.ap-south-1.on.aws";


let publicKey = fs.readFileSync("student_public.pem", "utf8");
publicKey = publicKey.replace(/\r?\n|\r/g, "");  

const requestBody = JSON.stringify({
  student_id: STUDENT_ID,
  github_repo_url: GITHUB_REPO,
  public_key: publicKey
});

const url = new URL(API_URL);

const options = {
  hostname: url.hostname,
  path: url.pathname,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": requestBody.length
  }
};

const req = https.request(options, (res) => {
  let data = "";

  res.on("data", chunk => data += chunk);
  res.on("end", () => {
    console.log("Raw API Response:", data);

    try {
      const json = JSON.parse(data);

      if (json.encrypted_seed) {
        fs.writeFileSync("encrypted_seed.txt", json.encrypted_seed);
        console.log("Encrypted seed saved to encrypted_seed.txt");
      } else {
        console.error("No encrypted seed found!", json);
      }

    } catch (err) {
      console.error("JSON parsing failed:", err);
    }
  });
});

req.on("error", (err) => {
  console.error("Request error:", err);
});


req.write(requestBody);
req.end();
