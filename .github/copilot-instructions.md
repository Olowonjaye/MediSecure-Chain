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

```md
<!-- Copilot / AI agent instructions tailored to MediSecure-Chain -->
# MediSecure-Chain — assistant quick notes

Keep guidance short and concrete. Use referenced files below as single source-of-truth.

- Key folders
  - `contracts/` — Hardhat (Solidity). Scripts: `contracts/scripts/deploy_registry.js`. Run from `contracts/`.
  - `frontend/` — Vite + React (main: `frontend/src/main.jsx`, UI in `frontend/src/components`).
  - `backend/` — Express auth & audit microservice (main: `backend/server.js`). Helper re-encrypt code in `backend/utils/reencrypt.js`.

- Big picture (data flows)
  - Upload: `frontend/src/components/UploadRecord.jsx` encrypts with Web Crypto (AES-GCM), uploads ciphertext to IPFS (`ipfs-http-client`), hashes ciphertext, then calls smart contract `registerResource(resourceId, cid, cipherHash, metadata)` via `frontend/src/services/blockchain.js`.
  - Access control: `frontend/src/components/AccessControl.jsx` calls contract methods `grantAccess`/`revokeAccess`. Grant payloads include an encrypted key blob (in the demo this is simulated).
  - Re-encryption: backend exposes a re-encrypt helper used by frontend to convert owner-encrypted keys into medic-specific blobs. The function `backend/utils/reencrypt.js::reencrypt()` is a stub (string concat). Treat it as placeholder — any real crypto replacement must include tests and migration notes.

- Concrete developer workflows
  - Contracts (from `contracts/`):
    - npm install
    - npm run compile  (runs `npx hardhat compile`)
    - npm run deploy:blockdag  (runs `npx hardhat run scripts/deploy_registry.js --network blockdag`)
  - Frontend (from `frontend/`):
    - npm install
    - npm run dev   (vite dev server)
    - npm run build
  - Backend (from `backend/`):
    - npm install
    - npm start (node server.js) — server uses lowdb JSON at `backend/db/db.json`

- Project-specific conventions & gotchas
  - Ethers versions differ: contracts use ethers v5 (Hardhat), frontend/backend use ethers v6. When writing examples, import/use the correct API (e.g., BrowserProvider is v6 browser API).
  - ResourceId computation must be identical between components: `ethers.keccak256(ethers.toUtf8Bytes(owner + cid))`. See `frontend` for the exact usage.
  - Contract ABI is embedded in `frontend/src/services/blockchain.js` (`MedisecureRegistry.json` under `frontend/src/abis`). If you change contracts, update this ABI and the `CONTRACT_ADDRESS` or use Vite env `VITE_CONTRACT_ADDRESS`.
  - IPFS is used with Infura in the frontend. CI/tests should mock IPFS or run a local node.
  - Backend is ESM (`package.json` type: module) but contract scripts use CommonJS — do not change script patterns without testing.

- Integration points to inspect when changing behavior
  - `frontend/src/services/blockchain.js` — ABI/address + contract call patterns used by UI components.
  - `frontend/src/components/UploadRecord.jsx` — encryption, IPFS upload, resourceId formation.
  - `frontend/src/components/AccessControl.jsx` — grant/revoke UI flow.
  - `backend/server.js` — auth, JWT, lowdb storage, audit endpoint. Useful for local dev mocking.
  - `backend/utils/reencrypt.js` — placeholder re-encryption logic.

- Small examples (copy/paste safe)
  - resourceId: `const resourceId = ethers.keccak256(ethers.toUtf8Bytes(owner + cid));`
  - frontend contract call (ethers v6):
    ```js
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    const tx = await contract.registerResource(...);
    await tx.wait();
    ```

- When to open a PR vs. small edits
  - Small documentation, UI text, or non-sensitive frontend tweaks: PR is preferred but small edits may be pushed.
  - Any contract changes, backend crypto changes (including replacing `reencrypt`), or dependency upgrades: open a PR with tests, deployment notes, and updated `CONTRACT_ADDRESS` when redeployed.

If anything here is unclear or you'd like expansion (CI steps, test harness, or a real re-encryption example), tell me which area and I'll extend this file.
```
