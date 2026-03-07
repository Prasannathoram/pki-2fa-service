
---

# PKI-Secured 2FA Microservice

This project implements a **Dockerized Node.js microservice** that provides secure **PKI-based seed decryption** and **Time-based One-Time Password (TOTP) 2-Factor Authentication**.

The service also includes a **cron job that generates and logs a new 2FA code every minute**.

---

# Features

* RSA-OAEP seed decryption using PKI
* Secure seed storage
* TOTP 2FA generation
* 2FA verification endpoint
* Cron job that logs a new 2FA code every minute
* Dockerized deployment
* Persistent storage for seed data

---

# Project Structure

```
pki-2fa-service
│
├── server.js
├── decrypt_seed.js
├── package.json
├── Dockerfile
├── docker-compose.yml
│
├── cron
│   ├── 2fa-cron
│   └── log_2fa_cron.js
│
├── encrypted_seed.txt
├── student_private.pem
├── student_public.pem
├── instructor_public.pem
│
└── README.md
```

---

# Prerequisites

Install the following tools:

* Docker
* Docker Compose
* Git

Verify installation:

```bash
docker --version
docker-compose --version
```

---

# Clone the Repository

```
git clone https://github.com/Prasannathoram/pki-2fa-service.git
cd pki-2fa-service
```

---

# Build and Start the Service

Build the Docker image:

```
docker-compose build
```

Start the service:

```
docker-compose up -d
```

Verify container is running:

```
docker ps
```

Expected output should include:

```
pki-2fa-service
0.0.0.0:8080->8080
```

The API server will be available at:

```
http://localhost:8080
```

---

# End-to-End Testing Guide

The following commands verify the **complete system workflow**.

---

# 1 Decrypt Seed

The encrypted seed is automatically read from `encrypted_seed.txt`.

```
curl -X POST http://localhost:8080/decrypt-seed \
-H "Content-Type: application/json" \
-d "{\"encrypted_seed\":\"$(cat encrypted_seed.txt)\"}"
```

Expected response:

```
{"status":"ok"}
```

The server decrypts the seed using `student_private.pem` and stores it in:

```
/data/seed.txt
```

---

# 2 Verify Seed Storage

```
docker exec -it pki-2fa-service cat //data/seed.txt
```

Example output:

```
aca62d5c2e26ece438a35c5695faaa4afcc671ea50ab0f28b8c0936e9a281132
```

---

# 3 Generate 2FA Code

```
curl http://localhost:8080/generate-2fa
```

Example response:

```
{
  "code": "478845",
  "valid_for": 20
}
```

* `code` → 6 digit TOTP
* `valid_for` → seconds until expiration

---

# 4 Verify Valid 2FA Code

Use the generated code immediately.

```
curl -X POST http://localhost:8080/verify-2fa \
-H "Content-Type: application/json" \
-d '{"code":"478845"}'
```

Expected response:

```
{"valid":true}
```

---

# 5 Verify Invalid Code

```
curl -X POST http://localhost:8080/verify-2fa \
-H "Content-Type: application/json" \
-d '{"code":"000000"}'
```

Expected response:

```
{"valid":false}
```

---

# Cron Job Verification

The service includes a cron job that logs a new 2FA code every minute.

Enter the running container:

```
docker exec -it pki-2fa-service sh
```

Check the cron configuration:

```
crontab -l
```

Expected output:

```
* * * * * cd /app && /usr/local/bin/node cron/log_2fa_cron.js >> /cron/last_code.txt 2>&1
```

View cron logs:

```
cat /cron/last_code.txt
```

Example output:

```
2026-03-07 07:33:01 - 2FA Code: 900960
2026-03-07 07:34:01 - 2FA Code: 422635
2026-03-07 07:35:01 - 2FA Code: 807816
2026-03-07 07:36:01 - 2FA Code: 211160
```

Log format:

```
YYYY-MM-DD HH:MM:SS - 2FA Code: XXXXXX
```

Exit the container:

```
exit
```

---

# Persistence Test

Restart the container:

```
docker-compose down
docker-compose up -d
```

Verify the seed still exists:

```
docker exec -it pki-2fa-service cat //data/seed.txt
```

If the seed remains, persistence works correctly.

---

# Expected Result

If all steps complete successfully:

* Seed decryption works
* Seed stored correctly
* TOTP codes generated correctly
* Valid codes accepted
* Invalid codes rejected
* Cron logs a new 2FA code every minute
* Seed persists across container restarts

---

# Author

Prasanna
GitHub:
[https://github.com/Prasannathoram](https://github.com/Prasannathoram)



