require("dotenv").config();

let _testProvider;
function getTestProvider() {
  if (!_testProvider) {
    const ganache = require("ganache");
    _testProvider = ganache.provider({
      chain: { networkId: 1337, chainId: 1337 },
      logging: { quiet: true }
    });
  }
  return _testProvider;
}

module.exports = {
  test_directory: "./test_truffle",

  networks: {
    test: {
      provider: getTestProvider,
      network_id: 1337,
    },
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
    },
    sepolia: {
      provider: () => {
        const HDWalletProvider = require("@truffle/hdwallet-provider");
        const privateKey = process.env.PRIVATE_KEY;
        const rpcUrl = process.env.SEPOLIA_RPC_URL;
        if (!privateKey || !rpcUrl) {
          throw new Error("Missing PRIVATE_KEY or SEPOLIA_RPC_URL in .env");
        }
        return new HDWalletProvider({
          privateKeys: [privateKey],
          providerOrUrl: rpcUrl,
        });
      },
      network_id: 11155111,
      gas: 5500000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
  },

  compilers: {
    solc: {
      version: "0.8.20",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
};
