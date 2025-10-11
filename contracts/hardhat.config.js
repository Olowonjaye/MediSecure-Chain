require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
module.exports = { solidity: "0.8.20", networks: { blockdag: { url: process.env.BLOCKDAG_RPC || "https://rpc.primordial.bdagscan.com", chainId: Number(process.env.BLOCKDAG_CHAIN_ID||1043), accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [] } } };
