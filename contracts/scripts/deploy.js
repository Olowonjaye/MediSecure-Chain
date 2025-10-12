const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  // Allow passing an initial admin via env, otherwise default to deployer
  const initialAdmin = process.env.INITIAL_ADMIN && process.env.INITIAL_ADMIN !== ''
    ? process.env.INITIAL_ADMIN
    : deployer.address;

  const MedisecureRegistry = await ethers.getContractFactory('MedisecureRegistry');
  const registry = await MedisecureRegistry.deploy(initialAdmin);
  await registry.deployed();

  console.log('MedisecureRegistry deployed to:', registry.address);

  // Save ABI and address for frontend/backend
  const artifact = await artifacts.readArtifact('MedisecureRegistry');
  const out = {
    address: registry.address,
    abi: artifact.abi,
  };

  const outPath = path.join(__dirname, '..', 'MedisecureDeployment.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log('Wrote deployment info to', outPath);

  // Also copy deployment info to backend folder so backend can consume it
  try {
    const backendDir = path.join(__dirname, '..', '..', 'backend', 'contracts');
    fs.mkdirSync(backendDir, { recursive: true });
    const backendOut = path.join(backendDir, 'MedisecureDeployment.json');
    fs.writeFileSync(backendOut, JSON.stringify(out, null, 2));
    console.log('Also wrote deployment info to', backendOut);
  } catch (err) {
    console.warn('Could not write backend deployment file:', err.message || err);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
