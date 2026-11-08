// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ISqueekCore} from "../WheelRushLeaderboard.sol";

/// @dev Test stand-in for SqueekCore. Only for local tests; never deployed.
contract MockSqueekCore {
    ISqueekCore.CoreState private s;
    bool public broken;

    function set(uint64 round, uint64 height) external {
        s.settledThroughRound = round;
        s.blockHeight = height;
    }

    function setBroken(bool b) external {
        broken = b;
    }

    function state() external view returns (ISqueekCore.CoreState memory) {
        require(!broken, "core down");
        return s;
    }
}
