# Deploy the Hamster Wheel Rush leaderboard to Sepolia

This puts `WheelRushLeaderboard` on the Sepolia testnet, the same network as Squeekchain, and connects the game to it. You deploy from your own wallet in the browser, so your private key never leaves it.

You need:

- A browser wallet such as MetaMask.
- A little Sepolia test ETH for gas. It's free from a Sepolia faucet, for example Google Cloud's Web3 faucet. Deploying and a few test submissions use well under 0.05 test ETH.

## 1. Switch your wallet to Sepolia

In MetaMask, turn on "Show test networks" and select **Sepolia**.

## 2. Compile in Remix

1. Open https://remix.ethereum.org.
2. Create a file called `WheelRushLeaderboard.sol` and paste in the contents of `contracts/WheelRushLeaderboard.sol`.
3. Open the **Solidity compiler** tab:
   - Compiler: **0.8.24**
   - Under Advanced Configurations, turn on **Optimization** with **200** runs (this matches the tests).
   - Click **Compile WheelRushLeaderboard.sol**.

## 3. Deploy

1. Open the **Deploy & run transactions** tab.
2. Environment: **Injected Provider - MetaMask**. Check that it shows Sepolia (chain 11155111).
3. Contract: **WheelRushLeaderboard**.
4. Next to Deploy, enter the SqueekCore address as the `core` argument:

   ```
   0xFD6C166D4B8E2962E65746a13e5a0797CD4dE0c4
   ```

5. Click **Deploy** and confirm in MetaMask.
6. When it's mined, copy the contract address from **Deployed Contracts**.

Check it: expand the deployed contract in Remix and click `hamsterClock`. It should return the hamster's current Squeekchain round and block height, both above zero. If you get zeros, the `core` address was entered wrong; deploy again.

## 4. Verify the source (recommended)

Verifying lets anyone read the code on the explorer. In Remix, open the **Contract Verification** plugin (enable it from the Plugin Manager if needed), pick Sourcify and/or Etherscan, choose Sepolia, and verify the deployed address. Other Squeekchain builders verify their contracts on Sourcify, so reviewers expect it.

## 5. Connect the game

Open `web/index.html`, find `CONFIG` near the bottom, and paste your address:

```js
const CONFIG = Object.assign({
  address: "0xYourLeaderboardAddress",
```

## 6. Host the game

The `web` folder is the whole site, one file. Any static host works:

- **Vercel**: run `npx vercel web` from this folder, or import the folder at vercel.com/new.
- **Netlify**: drag the `web` folder onto app.netlify.com/drop.
- **GitHub Pages**: push the folder to a repository and turn on Pages.

Wallets only connect on a real web page (https or localhost), so test the hosted link, not a file opened from your disk. The private Claude artifact version of the game can't connect a wallet either.

## After deploying

- The contract has no owner and no admin functions. Nobody, including you, can edit or delete scores. To change the rules, deploy a new contract and update `CONFIG.address`.
- Players pay their own small test-ETH gas to save a score or a name.
