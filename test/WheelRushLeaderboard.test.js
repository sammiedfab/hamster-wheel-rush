const { expect } = require("chai");
const { ethers } = require("hardhat");

const SQUEEK_CORE_SEPOLIA = "0xFD6C166D4B8E2962E65746a13e5a0797CD4dE0c4";
const FORK = !!process.env.FORK;

async function deployWithMock() {
  const core = await (await ethers.getContractFactory("MockSqueekCore")).deploy();
  await core.set(706, 3205);
  const board = await (await ethers.getContractFactory("WheelRushLeaderboard")).deploy(await core.getAddress());
  return { core, board, signers: await ethers.getSigners() };
}

(FORK ? describe.skip : describe)("WheelRushLeaderboard (local)", () => {
  it("saves a score stamped with the hamster's round and block height", async () => {
    const { board, signers } = await deployWithMock();
    const [alice] = signers;
    await expect(board.connect(alice).submitScore(1752, 269, 130, 87))
      .to.emit(board, "ScoreSubmitted")
      .withArgs(alice.address, 1752, 269, 130, 87, 706, 3205, true);

    const best = await board.bestOf(alice.address);
    expect(best.sqkTenths).to.equal(1752);
    expect(best.squeekRound).to.equal(706);
    expect(best.squeekBlock).to.equal(3205);
    expect(await board.totalSubmissions()).to.equal(1);

    const top = await board.topScores();
    expect(top.length).to.equal(1);
    expect(top[0].player).to.equal(alice.address);
  });

  it("keeps the personal best when a lower score comes in", async () => {
    const { board, signers } = await deployWithMock();
    const [alice] = signers;
    await board.connect(alice).submitScore(1500, 230, 110, 60);
    await expect(board.connect(alice).submitScore(900, 190, 80, 20))
      .to.emit(board, "ScoreSubmitted")
      .withArgs(alice.address, 900, 190, 80, 20, 706, 3205, false);
    expect((await board.bestOf(alice.address)).sqkTenths).to.equal(1500);
    expect((await board.topScores())[0].sqkTenths).to.equal(1500);
    expect(await board.totalSubmissions()).to.equal(2);
  });

  it("rejects numbers the game can't produce", async () => {
    const { board } = await deployWithMock();
    await expect(board.submitScore(0, 100, 10, 0)).to.be.revertedWithCustomError(board, "ZeroScore");
    await expect(board.submitScore(6001, 100, 10, 0)).to.be.revertedWithCustomError(board, "ScoreTooHigh");
    await expect(board.submitScore(1000, 401, 10, 0)).to.be.revertedWithCustomError(board, "PeakTooHigh");
    await expect(board.submitScore(1000, 200, 301, 0)).to.be.revertedWithCustomError(board, "TooManyTaps");
    await expect(board.submitScore(1000, 200, 100, 101)).to.be.revertedWithCustomError(board, "TurboTooLong");
    await board.submitScore(6000, 400, 300, 100); // exactly at every cap is allowed
  });

  it("keeps the top 10 sorted, one entry per player", async () => {
    const { board, signers } = await deployWithMock();
    const scores = [500, 1200, 300, 1800, 900, 1100, 700, 1600, 200, 1400, 1000, 1300];
    for (let i = 0; i < scores.length; i++) await board.connect(signers[i]).submitScore(scores[i], 200, 100, 10);

    let top = await board.topScores();
    expect(top.length).to.equal(10);
    expect(top.map((s) => Number(s.sqkTenths))).to.deep.equal([1800, 1600, 1400, 1300, 1200, 1100, 1000, 900, 700, 500]);

    // signers[2] (300) improves to 1700: moves to 2nd, and 500 drops off
    await board.connect(signers[2]).submitScore(1700, 250, 120, 50);
    top = await board.topScores();
    expect(top.map((s) => Number(s.sqkTenths))).to.deep.equal([1800, 1700, 1600, 1400, 1300, 1200, 1100, 1000, 900, 700]);
    expect(top.filter((s) => s.player === signers[2].address).length).to.equal(1);

    // signers[3] (top, 1800) improves to 1900: stays first, still listed once
    await board.connect(signers[3]).submitScore(1900, 260, 130, 60);
    top = await board.topScores();
    expect(Number(top[0].sqkTenths)).to.equal(1900);
    expect(top.filter((s) => s.player === signers[3].address).length).to.equal(1);
    expect(top.length).to.equal(10);

    // a score too low for the board still counts as a personal best
    await board.connect(signers[8]).submitScore(250, 150, 60, 0);
    expect((await board.bestOf(signers[8].address)).sqkTenths).to.equal(250);
    expect((await board.topScores()).some((s) => s.player === signers[8].address)).to.equal(false);
  });

  it("keeps the earlier score ahead on a tie", async () => {
    const { board, signers } = await deployWithMock();
    await board.connect(signers[0]).submitScore(1000, 200, 100, 10);
    await board.connect(signers[1]).submitScore(1000, 200, 100, 10);
    const top = await board.topScores();
    expect(top[0].player).to.equal(signers[0].address);
    expect(top[1].player).to.equal(signers[1].address);
  });

  it("stores names up to 20 bytes and returns them with the board", async () => {
    const { board, signers } = await deployWithMock();
    const [alice] = signers;
    await expect(board.connect(alice).setName("Squeek Sprinter")).to.emit(board, "NameSet").withArgs(alice.address, "Squeek Sprinter");
    await expect(board.connect(alice).setName("x".repeat(21))).to.be.revertedWithCustomError(board, "NameTooLong");
    await board.connect(alice).submitScore(1234, 220, 120, 40);
    const [scores, names] = await board.topScoresWithNames();
    expect(scores[0].player).to.equal(alice.address);
    expect(names[0]).to.equal("Squeek Sprinter");
  });

  it("still saves the score with zero stamps if SqueekCore can't be read", async () => {
    const { core, board } = await deployWithMock();
    await core.setBroken(true);
    await board.submitScore(1000, 200, 100, 10);
    const top = await board.topScores();
    expect(top[0].squeekRound).to.equal(0);
    expect(top[0].squeekBlock).to.equal(0);

    const noCode = await (await ethers.getContractFactory("WheelRushLeaderboard")).deploy(ethers.Wallet.createRandom().address);
    await noCode.submitScore(1000, 200, 100, 10);
    expect((await noCode.topScores())[0].squeekRound).to.equal(0);
  });
});

(FORK ? describe : describe.skip)("WheelRushLeaderboard (Sepolia fork, real SqueekCore)", () => {
  it("stamps scores with the live Squeekchain round and block height", async () => {
    const core = await ethers.getContractAt(
      ["function state() view returns ((uint64 settledThroughRound, uint64 cumulativeWork, uint96 cumulativeBlockUnits, uint64 blockHeight, uint96 blockProgress, uint32 workPerThousandBlocks, uint256 authorizationNonce, bool paused))"],
      SQUEEK_CORE_SEPOLIA
    );
    const live = await core.state();
    const board = await (await ethers.getContractFactory("WheelRushLeaderboard")).deploy(SQUEEK_CORE_SEPOLIA);
    const [alice] = await ethers.getSigners();
    await board.connect(alice).submitScore(1752, 269, 130, 87);
    const best = await board.bestOf(alice.address);
    console.log(`      live SqueekCore: round ${live.settledThroughRound}, block height ${live.blockHeight}`);
    expect(best.squeekRound).to.equal(live.settledThroughRound);
    expect(best.squeekBlock).to.equal(live.blockHeight);
    expect(best.squeekRound).to.be.greaterThan(0n);
  });
});
