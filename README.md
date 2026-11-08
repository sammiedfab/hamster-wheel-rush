# Hamster Wheel Rush

A 10-second tapping game for the Squeekchain hamster economy. Tap to spin the wheel, and the faster it turns, the faster you mine SQK. Save your best round to an on-chain leaderboard on Sepolia, where every score is stamped with the real hamster's position on Squeekchain.

## How it uses Squeekchain

- **Real hamster bonus.** The game polls Squeekchain's public status API (`https://api.squeekchain.com/v1/status`) every 8 seconds. While Squeektoshi, the real hamster, is running on his wheel, you mine 2×. A banner shows whether he is running and how fast.
- **On-chain leaderboard.** Saved scores go to `WheelRushLeaderboard` on Sepolia, which reads `SqueekCore.state()` and stamps each score with the last settled Squeekchain round and the Squeek block height.

## How to play

- Tap the TAP button, the wheel or Space. Each tap speeds the wheel up, and it slows down when you stop.
- Mining rate = wheel speed × 0.05 SQK per RPM per second.
- Above 180 RPM you are in Turbo and mine 1.5×. At 215 RPM and up the screen shakes.
- The real hamster bonus doubles everything while he runs.
- After a round: save your score on-chain, see the Top 10, or make a share card for X.

SQK in the game are points, not tokens. Nothing of value is paid out.

## What's here

| Path | What it is |
| --- | --- |
| `contracts/WheelRushLeaderboard.sol` | The leaderboard contract |
| `contracts/test/MockSqueekCore.sol` | A stand-in for SqueekCore, used only by the tests |
| `test/WheelRushLeaderboard.test.js` | Contract tests, local and against a Sepolia fork |
| `scripts/deploy.js` | Hardhat deploy script (used for the local fork test) |
| `web/index.html` | The game as a standalone web page, with wallet, save and leaderboard |
| `DEPLOY.md` | Step-by-step deployment from your own wallet with Remix |

## How the contract works

- `submitScore(sqkTenths, peakRpm, taps, turboTenths)` saves a round. Scores are in tenths, so 1752 means 175.2 SQK.
- On every submission, the contract calls `SqueekCore.state()` on Sepolia (`0xFD6C166D4B8E2962E65746a13e5a0797CD4dE0c4`). It stamps the score with the last settled Squeekchain round and the Squeek block height. If SqueekCore can't be read, the score is still saved with zero stamps.
- Each player keeps a personal best (`bestOf`). The top 10 personal bests form the board (`topScores`, or `topScoresWithNames` for the front end). A player appears on the board once. Ties keep the earlier score ahead.
- `setName(name)` sets a display name of up to 20 bytes.
- The contract rejects numbers the game can't produce: more than 600 SQK (300 SQK doubled by the hamster bonus), 400 RPM, 300 taps or 10 seconds of Turbo.
- There is no owner, no admin and no token.

Scores come from the player's browser, so a determined player can submit any number within the caps. That's fine for a just-for-fun testnet board, but don't attach real prizes to it without proper anti-cheat.

## Run the tests

```bash
npm install
```

```bash
npx hardhat test
```

To run the fork test, which deploys on a local copy of Sepolia and reads the real SqueekCore:

```bash
FORK=1 npx hardhat test
```

## Deployment

`WheelRushLeaderboard` is live on Sepolia at [`0xAD725e65b054079c7cc1DC129C75659C9340e1E7`](https://sepolia.etherscan.io/address/0xAD725e65b054079c7cc1DC129C75659C9340e1E7), reading SqueekCore at `0xFD6C166D4B8E2962E65746a13e5a0797CD4dE0c4`. The game in `web/index.html` is configured to use it.

To deploy your own copy, see `DEPLOY.md`.
