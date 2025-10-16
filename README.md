# MediSecure Chain

## Development: Human Passport integration

This project includes an integration with Human Passport (https://passport.human.tech) for on-chain human verification.

Setup (.env)
- Copy `.env.example` to the repository root as `.env` (or create `backend/.env`) and set the following values:
   - HUMAN_PASSPORT_API_KEY - your Human Passport API key
   - JWT_SECRET - a long random string used to sign JWTs
      - DATABASE_URL - database connection string. Prefer Postgres (postgresql://...) or a MongoDB URI (mongodb://...). If empty, lowdb JSON storage is used.

Important: `.env` is listed in `.gitignore` by default to avoid committing secrets.

Run backend
- From the `backend` folder:

```powershell
cd backend; npm install; npm run dev
```

Run frontend
- From the `frontend` folder:

```powershell
cd frontend; npm install; npm run dev
```

Testing Human Passport flow
1. Open the frontend Login page in your browser.
2. Connect a wallet (optional) or enter an identifier/token manually on the Human Passport login form.
3. The frontend will call the backend `/api/passport/verify` endpoint which in turn calls Human Passport and returns a JWT on success. The UI will display "Verified Human" on success or "Verification Failed" on failure.

Direct backend test (curl)

Example (identifier):

```powershell
# Replace values and ensure your backend is running and HUMAN_PASSPORT_API_KEY is set in backend/.env
curl -X POST http://localhost:4000/api/passport/verify -H "Content-Type: application/json" -d '{"identifier": "someone@example.com"}'
```

Example (Human Passport token):

```powershell
curl -X POST http://localhost:4000/api/passport/verify -H "Content-Type: application/json" -d '{"humanPassportToken": "hp_xyz..."}'
```

Quick backend setup for Human Passport (Node.js)

```powershell
cd backend; npm install; npm run dev
# Copy the example env and add your secrets:
copy .env.example .env
# Edit backend/.env and set HUMAN_PASSPORT_API_KEY and JWT_SECRET (and DATABASE_URL if using Postgres)
```

Protecting medical routes
- The backend now requires both JWT authentication and a Human Passport verified user to access patient endpoints under `/api/hospital/patients`. The middleware will return 403 if the user's `humanVerified` flag is not true.

medisecure.vercel.app

https://medisecure.vercel.app/

🏥 MediSecure: Blockchain-Powered Healthcare Data Platform

Tagline: Empowering Healthcare Through Blockchain Security

📘 Executive Summary

MediSecure is a decentralized electronic health record (EHR) management platform that leverages blockchain and proxy re-encryption (PRE) to ensure data privacy, patient control, and interoperability across healthcare systems.

This platform provides secure medical record storage, controlled data sharing, and transparent access logs — all on a blockchain network powered by BlockDAG.

MediSecure empowers patients to own and control their health data, enabling authorized doctors, hospitals, and insurers to access encrypted records only with explicit consent.

💡 Problem

Today’s healthcare systems face three critical challenges:

Data Fragmentation – Patient records scattered across multiple hospitals and labs.

Data Breaches – Sensitive medical data often exposed due to centralized storage.

Lack of Transparency – Patients cannot see who accessed or shared their data.

🚀 Solution

MediSecure solves these with blockchain, encryption, and decentralization:

Challenge	MediSecure Solution
Centralized storage	Data stored in Web3.Storage (IPFS) with hash references on blockchain
Unauthorized access	Access controlled via Proxy Re-Encryption (PRE)
Lack of transparency	Immutable audit trail of all actions (view, upload, share) on blockchain
Poor patient control	Patient-centered architecture with cryptographic ownership keys
🏗️ System Architecture

MediSecure comprises three layers:

Layer	Description
🧠 Smart Contract (Hardhat)	Blockchain registry that stores encrypted metadata and manages permissions using BlockDAG.
⚙️ Oracle (Node.js)	Mock PRE oracle that re-encrypts patient records when emergency or grant access is triggered.
🌐 Frontend (React + Vite)	User interface for patients and doctors to upload, request, and view records. Connects via MetaMask wallet.
🖼️ System Flow Diagram
Patient → Upload Record → IPFS (web3.storage)
   ↓
Store metadata hash → Blockchain Smart Contract (HealthVaultRegistry)
   ↓
Doctor requests access → Oracle validates and re-encrypts record key
   ↓
Access granted → Doctor retrieves decrypted record via Web3 gateway

🔐 Key Features
👤 Patient Dashboard

Upload medical records (PDF, reports, prescriptions)

Encrypt and store on decentralized storage

Grant and revoke access to doctors

🩺 Doctor Dashboard

Request access to patient records

View approved EHRs

Verify data authenticity via blockchain hash

🧩 Smart Contract Layer

Manages record ownership

Tracks every access attempt

Logs emergency access via events

🔒 Security

Proxy Re-Encryption for shared access

IPFS-based immutable storage

JWT authentication for backend users

AES-based local encryption

⚙️ Technical Stack
Layer	Technology
Blockchain	BlockDAG EVM-compatible Network
Smart Contracts	Solidity (Hardhat)
Frontend	React (Vite) + MetaMask + Ethers.js
Backend	Node.js (Express) + MongoDB
Oracle	Node.js + Ethers.js v6
Storage	Web3.Storage (IPFS)
Authentication	JWT (JSON Web Token)
🧱 Folder Structure
MediSecure/
│
├── contracts/          # Hardhat smart contracts (HealthVaultRegistry.sol)
│   ├── scripts/
│   └── deploy.js
│
├── oracle/             # Proxy re-encryption mock server (Node.js)
│   └── server.js
│
├── backend/            # Node.js + MongoDB REST API
│   ├── routes/
│   ├── models/
│   └── server.js
│
├── frontend-vite/      # React frontend with MetaMask integration
│   ├── src/
│   ├── components/
│   └── App.jsx
│
└── README.md

🧭 Deployment Steps
1️⃣ Compile Smart Contracts
cd contracts
npx hardhat compile

2️⃣ Deploy to BlockDAG

Ensure wallet is funded on BlockDAG testnet:

npx hardhat run scripts/deploy.js --network blockdag

3️⃣ Start Oracle Service


4️⃣ Start Backend
cd backend
npm start
# Runs on http://localhost:4000

5️⃣ Start Frontend (Vite)
cd frontend-vite
npm run dev
# Open http://localhost:5173

🌍 Blockchain Integration Example
const registry = new ethers.Contract(
  REGISTRY_ADDRESS,
  HealthVaultRegistry.abi,
  signer
);

// Upload new record hash
await registry.registerRecord(patientAddress, ipfsHash);

📦 Environment Variables
Variable	Description
BLOCKDAG_RPC	RPC endpoint for BlockDAG
ORACLE_PRIVATE_KEY	Deployer wallet private key
REGISTRY_ADDRESS	Deployed smart contract address
JWT_SECRET	Token signing secret for backend
MONGO_URI	MongoDB connection string
💰 Business & Impact Model

MediSecure targets the intersection of blockchain and healthtech, with the potential to:

Digitize hospitals’ health records

Enable secure telemedicine data exchange

Allow insurers to verify claims via blockchain

Reduce fraud and duplication in medical data

Revenue Streams:

Subscription model for clinics/hospitals

API access for insurers and research labs

Premium on-chain audit analytics

👨‍💻 Team

Prepared by: MediSecure Dev Team
Led by Abdulganiyu Taofeeq
Expertise: Blockchain • Healthcare Informatics • Security • AI Systems

🏆 Vision

To redefine healthcare data management in Africa and beyond —
ensuring privacy, transparency, and patient sovereignty through blockchain technology.

📬 Contact

Website: coming soon

Email: medisecurechain@gmail.com

Network: BlockDAG 

Tagline: Empowering Healthcare Through Blockchain Security.
