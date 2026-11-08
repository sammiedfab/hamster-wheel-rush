# Brief for the IMD Website job

Paste the text below into the IMD Website job ("Start from GitHub instead"), with this repository's link.
The leaderboard contract is already deployed on Sepolia (0xAD725e65b054079c7cc1DC129C75659C9340e1E7) and set in `public/index.html`.

---

Host Hamster Wheel Rush, a finished browser game for the Squeekchain community, as a static site. The whole site is one file: `public/index.html`. Serve that folder as the site root. There is no build step and no backend.

Keep the game exactly as it is: the design, copy, layout, game tuning and contract address. This is hosting, not a redesign. Do not add a dependency, analytics or a framework. Do not change anything in `contracts/` or `test/`.

What the site does, so you can check it works after hosting:
- Players tap to spin a hamster wheel for 10 seconds. Wheel speed sets the SQK mining rate (game points, not tokens).
- A banner reads Squeekchain's public API (https://api.squeekchain.com/v1/status) every 8 seconds. While the real hamster is running, players mine 2x.
- After a round, players can save their score with a browser wallet to the WheelRushLeaderboard contract on Sepolia (chain 11155111), view the Top 10, and make a share card for X.

Check after hosting: the page loads on a phone and a desktop with no console errors, the hamster banner shows a status (resting or running), a full round plays to the results screen, and the Top 10 screen loads from Sepolia.
