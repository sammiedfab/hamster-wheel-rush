require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    hardhat: {
      // Use Sepolia's chain ID on a fork so wallets and the web page treat it like the real network.
      chainId: process.env.FORK ? 11155111 : 31337,
      // FORK=1 npm test runs the fork test against the real Squeekchain contracts on Sepolia.
      forking: process.env.FORK
        ? { url: process.env.SEPOLIA_RPC || "https://ethereum-sepolia-rpc.publicnode.com" }
        : undefined,
    },
  },
};
