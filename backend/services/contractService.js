const { ethers } = require("ethers");
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const fs = require("fs");
const path = require("path");

function loadABI() {
  const p = path.join(
    __dirname,
    "../../artifacts/contracts/MyStartupToken.sol/MyStartupToken.json"
  );
  if (!fs.existsSync(p)) throw new Error("Artifact không tồn tại. Chạy: npm run compile");
  return JSON.parse(fs.readFileSync(p, "utf8")).abi;
}

function getProvider() {
  const url = process.env.LOCAL_RPC_URL || process.env.RPC_URL ||
    (process.env.SEPOLIA_RPC_URL && !process.env.SEPOLIA_RPC_URL.includes("YOUR_ALCHEMY_KEY")
      ? process.env.SEPOLIA_RPC_URL
      : "http://127.0.0.1:8545");
  return new ethers.JsonRpcProvider(url);
}

function getSigner() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY chưa cấu hình trong .env");
  return new ethers.Wallet(pk, getProvider());
}

function getContract(withSigner = false) {
  const addr = process.env.CONTRACT_ADDRESS;
  if (!addr) throw new Error("CONTRACT_ADDRESS chưa cấu hình trong .env");
  return new ethers.Contract(loadABI ? addr : addr, loadABI(), withSigner ? getSigner() : getProvider());
}

// ─── Read ───────────────────────────────────────────────────────
async function getTokenInfo() {
  const c = getContract(false);
  const info = await c.tokenInfo();
  return {
    name: info.tokenName,
    symbol: info.tokenSymbol,
    totalSupply: ethers.formatEther(info.supply),
    maxSupply: ethers.formatEther(info.maxSupply),
    owner: info.ownerAddr,
    contractAddress: process.env.CONTRACT_ADDRESS,
  };
}

async function getBalance(address) {
  if (!ethers.isAddress(address)) throw new Error("Địa chỉ ví không hợp lệ");
  const raw = await getContract(false).balanceOf(address);
  return { address, balance: ethers.formatEther(raw), balanceWei: raw.toString() };
}

// ─── Write ──────────────────────────────────────────────────────
async function mintTokens(toAddress, amountEther) {
  if (!ethers.isAddress(toAddress)) throw new Error("Địa chỉ ví không hợp lệ");
  if (isNaN(+amountEther) || +amountEther <= 0) throw new Error("Số lượng phải > 0");
  const tx = await getContract(true).mint(toAddress, ethers.parseEther(String(amountEther)));
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber, to: toAddress, amount: String(amountEther), gasUsed: receipt.gasUsed.toString() };
}

async function burnTokens(amountEther) {
  if (isNaN(+amountEther) || +amountEther <= 0) throw new Error("Số lượng phải > 0");
  const tx = await getContract(true).burn(ethers.parseEther(String(amountEther)));
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber, from: await getSigner().getAddress(), amount: String(amountEther), gasUsed: receipt.gasUsed.toString() };
}

async function transferTokens(toAddress, amountEther) {
  if (!ethers.isAddress(toAddress)) throw new Error("Địa chỉ ví không hợp lệ");
  if (isNaN(+amountEther) || +amountEther <= 0) throw new Error("Số lượng phải > 0");
  const tx = await getContract(true).transfer(toAddress, ethers.parseEther(String(amountEther)));
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber, from: await getSigner().getAddress(), to: toAddress, amount: String(amountEther), gasUsed: receipt.gasUsed.toString() };
}

async function getAllowance(ownerAddress, spenderAddress) {
  if (!ethers.isAddress(ownerAddress) || !ethers.isAddress(spenderAddress)) {
    throw new Error("Địa chỉ ví không hợp lệ");
  }
  const raw = await getContract(false).allowance(ownerAddress, spenderAddress);
  return {
    owner: ownerAddress,
    spender: spenderAddress,
    allowance: ethers.formatEther(raw),
    allowanceWei: raw.toString()
  };
}

async function approveSpender(spenderAddress, amountEther) {
  if (!ethers.isAddress(spenderAddress)) throw new Error("Địa chỉ ví không hợp lệ");
  if (isNaN(+amountEther) || +amountEther < 0) throw new Error("Số lượng phải >= 0");
  const tx = await getContract(true).approve(spenderAddress, ethers.parseEther(String(amountEther)));
  const receipt = await tx.wait();
  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    owner: await getSigner().getAddress(),
    spender: spenderAddress,
    amount: String(amountEther),
    gasUsed: receipt.gasUsed.toString()
  };
}

module.exports = {
  getTokenInfo,
  getBalance,
  getAllowance,
  mintTokens,
  burnTokens,
  transferTokens,
  approveSpender
};
