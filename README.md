🎬 Demo – MediSecureChain
🧠 Overview

MediSecureChain is a decentralized healthcare platform that enables patients, doctors, and healthcare institutions to securely store, access, and share medical records on-chain — using Human Passport for privacy-preserving identity verification.

This demo walks through how users interact with the system, from secure login to accessing and sharing encrypted health records.

🧩 1. Login with Human Passport

Flow:

User visits the MediSecureChain homepage.

Clicks “Login with Human Passport”.

Human Passport verifies the user’s real-human identity using biometric or cryptographic proof — no email or password required.

Once verified, Human Passport returns a verification token to the app.

The backend validates the token with the Human API using your HUMAN_PASSPORT_API_KEY.

If valid, the backend issues a signed JWT (JSON Web Token) to the frontend.

The frontend stores the token securely (e.g., localStorage) to manage session access.

Result:
✅ User is successfully authenticated as a verified human and redirected to their secure dashboard.

🏥 2. Access the Health Dashboard

Flow:

The dashboard loads with the user’s encrypted medical data.

Each record is stored securely — either off-chain (in an encrypted DB) or on-chain (via smart contracts).

The user can view:

Recent medical tests and results

Doctor consultations

Prescriptions and medication history

Result:
✅ The verified user can view only their own records.
❌ No unauthorized entity or bot can access data.

🔐 3. Privacy-Preserving Record Sharing

Flow:

The user clicks “Share Record”.

They input the doctor’s wallet address or hospital ID.

The app encrypts and sends a record access request via a smart contract or secure API.

The doctor receives a notification and must also verify through Human Passport.

Upon mutual verification, temporary decryption access is granted.

Result:
✅ Both users (patient and doctor) remain anonymous but verified.
✅ All actions are logged immutably on-chain for transparency.

👨‍⚕️ 4. Doctor or Provider Access

Flow:

The doctor logs in via Human Passport (using the same verification mechanism).

Once verified, they gain limited-time access to the patient’s shared record.

Doctors can:

Add prescriptions

Upload medical reports

Request additional data (subject to patient approval)

Result:
✅ Only verified medical professionals can access sensitive health data.

🔁 5. Blockchain Audit Trail

Every transaction (record creation, update, or access) generates an immutable log:

Event	Description	Verified by
Record Added	New medical report uploaded	Patient (Human Passport verified)
Record Shared	Access granted to Dr. A	Patient + Doctor (both verified)
Record Viewed	Doctor opened shared record	Doctor (Human Passport verified)

Result:
✅ Complete transparency and accountability in data handling.

🧠 6. Technical Summary
Component	Technology
Frontend	React + Tailwind
Backend	Node.js + Express
Database	PostgreSQL / MongoDB
Blockchain Layer	Ethereum-compatible (EVM)
Identity Layer	Human Passport
Authentication	JWT
Data Encryption	AES or SHA-based hashing before storage
🧪 7. Example API Flow
🔹 Verify Human Passport Token