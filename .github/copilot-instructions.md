<!-- Copilot / AI agent instructions tailored to the MediSecure-Chain repository -->
# MediSecure-Chain — AI coding assistant notes

This file contains focused, actionable guidance for an AI agent editing or extending this repository. Keep entries short and concrete — use the referenced files as the single source-of-truth.

- Project layout (high level):
  - `contracts/` — Hardhat smart contracts (Solidity). Key script: `contracts/scripts/deploy_registry.js`. Compile with `npm run compile` from the `contracts` folder.
  - `frontend/` — Vite + React UI. Main sources in `frontend/src/` (components, services). Entry: `frontend/src/main.jsx`. Start dev server with `npm run dev` in `frontend`.
  - `backend/` — Minimal Express microservice used for re-encryption helper. Entry: `backend/server.js`. Start with `npm start` in `backend`.

- Big-picture architecture and data flows:
  - Upload flow (frontend `UploadRecord.jsx`): encrypt data with Web Crypto (AES-GCM), upload ciphertext blob to IPFS (`ipfs-http-client`), compute SHA-256 hash, then call smart contract `registerResource(resourceId, cid, cipherHash, metadata)` via `ethers` (frontend `services/blockchain.js` exports ABI/address).
  - Access control (frontend `AccessControl.jsx`): uses `grantAccess` and `revokeAccess` on the on-chain `MedisecureRegistry` contract. Grants send an encrypted key blob (currently simulated via `ethers.randomBytes`), revokes are simple on-chain calls.
  - Re-encryption (backend `server.js` + `utils/reencrypt.js`): POST `/api/re_encrypt` expects `{resourceId, ownerEncryptedKey, medicPubKey}` and returns a re-encrypted blob. The implementation is intentionally stubbed: `reencrypt()` concatenates strings — treat it as placeholder for a real proxy re-encryption implementation.

- Important implementation details & patterns to preserve:
  - Frontend expects `window.ethereum` (MetaMask) and uses `ethers` v6 browser APIs: `new ethers.BrowserProvider(window.ethereum)` and `provider.getSigner()`.
  - Resource identifiers are computed in the UI as `ethers.keccak256(ethers.toUtf8Bytes(owner + cid))`. Keep this exact construction when producing or consuming resourceId values.
  - Contract ABI is embedded in `frontend/src/services/blockchain.js` (not fetched dynamically). If you update the contract, update that ABI and the `CONTRACT_ADDRESS` constant (or wire a Vite env variable `VITE_CONTRACT_ADDRESS`).
  - IPFS usage: `ipfs-http-client` is instantiated with Infura in `UploadRecord.jsx`. Tests or CI that need IPFS should mock or run a local IPFS node.

- Build / run / deploy checklist (concrete commands):
  - Contracts (from `contracts/`):
    - npm install
    - npm run compile
    - npm run deploy:blockdag (runs `npx hardhat run scripts/deploy_registry.js --network blockdag`)
  - Frontend (from `frontend/`):
    - npm install
    - npm run dev (Vite dev server)
    - npm run build (production bundle)
  - Backend (from `backend/`):
    - npm install
    - npm start (runs `node server.js`)

- Tests & verification:
  - There are no unit tests in the repo. Quick smoke tests:
    - Start backend, run the frontend dev site, and in the browser use MetaMask (or a testnet) to invoke contract calls.
    - For contract unit tests, add Hardhat tests under `contracts/test/` and use `npx hardhat test`.

- Conventions and gotchas:
  - JS modules: backend is `type: "module"`, so use ESM imports. Contracts scripts use CommonJS (`require`) — keep the existing pattern in `contracts/scripts` when running with `npx hardhat`.
  - ethers versions vary: contracts use `ethers` v5 (Hardhat), frontend/backend use `ethers` v6 — be careful when writing shared utilities or examples; import/usage differs between v5 and v6.
  - Minimal security scaffolding: the backend's `reencrypt` is a stub; do not assume cryptographic correctness. Any change that replaces the stub should include tests and clear upgrade notes.

- Useful code examples to copy/paste:
  - Generating resourceId (frontend):
    - `const resourceId = ethers.keccak256(ethers.toUtf8Bytes(owner + cid));`
  - Contract call pattern (frontend):
    - `const provider = new ethers.BrowserProvider(window.ethereum);
       const signer = await provider.getSigner();
       const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
       const tx = await contract.registerResource(...);
       await tx.wait();`

- When to open a PR vs. push direct edits:
  - Small docs, README, or frontend UX text changes: open a PR.
  - Any contract change, backend crypto changes, or dependency upgrades: open a PR with tests and deployment notes (include new `CONTRACT_ADDRESS` if contracts are redeployed).

If anything in this file looks incomplete or you need examples for a specific task (tests, CI, re-encryption implementation), tell me what area to expand and I'll iterate.
