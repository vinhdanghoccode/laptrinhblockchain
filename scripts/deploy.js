const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const TOKEN_NAME     = "StartupToken";
  const TOKEN_SYMBOL   = "STK";
  const INITIAL_SUPPLY = 10_000_000;

  console.log("\nDeploying MyStartupToken...");
  console.log(`  Name:           ${TOKEN_NAME}`);
  console.log(`  Symbol:         ${TOKEN_SYMBOL}`);
  console.log(`  Initial Supply: ${INITIAL_SUPPLY.toLocaleString()} tokens`);

  const MyStartupToken = await ethers.getContractFactory("MyStartupToken");
  const token = await MyStartupToken.deploy(
    TOKEN_NAME,
    TOKEN_SYMBOL,
    INITIAL_SUPPLY,
    deployer.address
  );
  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log("\n✓ Contract deployed to:", address);
  console.log("\n--- Ghi lại địa chỉ này vào .env ---");
  console.log(`CONTRACT_ADDRESS=${address}`);
  console.log("-------------------------------------");
  console.log("\nVerify trên Etherscan:");
  console.log(
    `npx hardhat verify --network sepolia ${address} "${TOKEN_NAME}" "${TOKEN_SYMBOL}" ${INITIAL_SUPPLY} "${deployer.address}"`
  );
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
