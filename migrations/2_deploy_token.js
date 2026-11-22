const MyStartupToken = artifacts.require("MyStartupToken");

module.exports = async function (deployer, network, accounts) {
  const name = "StartupToken";
  const symbol = "STK";
  const initialSupply = 10000000; // 10 triệu token (giống Hardhat deployment)
  const owner = accounts[0];

  console.log(`\n[Truffle Migration] Triển khai MyStartupToken...`);
  console.log(`  Tên token:      ${name}`);
  console.log(`  Ký hiệu:        ${symbol}`);
  console.log(`  Tổng cung đầu:  ${initialSupply.toLocaleString()} token`);
  console.log(`  Chủ sở hữu:     ${owner}`);

  await deployer.deploy(MyStartupToken, name, symbol, initialSupply, owner);
  const tokenInstance = await MyStartupToken.deployed();
  console.log(`✓ Hợp đồng đã triển khai tại địa chỉ: ${tokenInstance.address}`);
};
