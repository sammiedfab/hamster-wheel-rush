// Deploys WheelRushLeaderboard pointed at the real SqueekCore on Sepolia.
// Local fork:  FORK=1 npx hardhat node   then   npx hardhat run scripts/deploy.js --network localhost
const { ethers } = require("hardhat");

const SQUEEK_CORE_SEPOLIA = "0xFD6C166D4B8E2962E65746a13e5a0797CD4dE0c4";

async function main() {
  const Board = await ethers.getContractFactory("WheelRushLeaderboard");
  const board = await Board.deploy(SQUEEK_CORE_SEPOLIA);
  await board.waitForDeployment();
  const [round, height] = await board.hamsterClock();
  console.log("WheelRushLeaderboard:", await board.getAddress());
  console.log(`SqueekCore check: round ${round}, block height ${height}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
