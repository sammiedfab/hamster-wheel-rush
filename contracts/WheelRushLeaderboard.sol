// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice The one SqueekCore view this contract uses. Struct layout matches the
/// deployed SqueekCore ABI (docs.squeekchain.com/developers/core/).
interface ISqueekCore {
    struct CoreState {
        uint64 settledThroughRound;
        uint64 cumulativeWork;
        uint96 cumulativeBlockUnits;
        uint64 blockHeight;
        uint96 blockProgress;
        uint32 workPerThousandBlocks;
        uint256 authorizationNonce;
        bool paused;
    }

    function state() external view returns (CoreState memory);
}

/// @title Hamster Wheel Rush leaderboard
/// @notice Players save their best 10-second round on Sepolia. Every score is
/// stamped with the real hamster's position on Squeekchain (the last settled
/// round and the Squeek block height) read from SqueekCore at submit time.
/// @dev Scores come from the player's browser, so they can't be proven. The caps
/// below only reject numbers the game can't produce. This is a just-for-fun
/// board on a testnet: there is no prize, token or owner.
contract WheelRushLeaderboard {
    struct Score {
        address player;
        uint32 sqkTenths;    // 1752 = 175.2 SQK
        uint16 peakRpm;
        uint16 taps;
        uint16 turboTenths;  // 87 = 8.7 seconds in Turbo
        uint64 squeekRound;  // SqueekCore settledThroughRound when submitted
        uint64 squeekBlock;  // SqueekCore blockHeight when submitted
        uint64 timestamp;
    }

    uint256 public constant BOARD_SIZE = 10;
    // Limits of the game itself: 400 RPM x 0.05 SQK per RPM x 1.5 Turbo x 2 real-hamster bonus x 10 s = 600 SQK.
    uint32 public constant MAX_SQK_TENTHS = 6000;
    uint16 public constant MAX_PEAK_RPM = 400;
    uint16 public constant MAX_TAPS = 300;         // 30 taps per second for 10 seconds
    uint16 public constant MAX_TURBO_TENTHS = 100; // the whole round
    uint256 public constant MAX_NAME_BYTES = 20;

    ISqueekCore public immutable squeekCore;

    mapping(address => Score) public bestOf;
    mapping(address => string) public nameOf;
    uint256 public totalSubmissions;

    Score[] private board; // highest first, at most one entry per player

    event ScoreSubmitted(
        address indexed player,
        uint32 sqkTenths,
        uint16 peakRpm,
        uint16 taps,
        uint16 turboTenths,
        uint64 squeekRound,
        uint64 squeekBlock,
        bool personalBest
    );
    event NameSet(address indexed player, string name);

    error ZeroScore();
    error ScoreTooHigh();
    error PeakTooHigh();
    error TooManyTaps();
    error TurboTooLong();
    error NameTooLong();

    constructor(address core) {
        squeekCore = ISqueekCore(core);
    }

    /// @notice Save a round. Only a new personal best changes your board entry.
    function submitScore(uint32 sqkTenths, uint16 peakRpm, uint16 taps, uint16 turboTenths)
        external
        returns (bool personalBest)
    {
        if (sqkTenths == 0) revert ZeroScore();
        if (sqkTenths > MAX_SQK_TENTHS) revert ScoreTooHigh();
        if (peakRpm > MAX_PEAK_RPM) revert PeakTooHigh();
        if (taps > MAX_TAPS) revert TooManyTaps();
        if (turboTenths > MAX_TURBO_TENTHS) revert TurboTooLong();

        (uint64 round, uint64 height) = hamsterClock();
        Score memory s = Score({
            player: msg.sender,
            sqkTenths: sqkTenths,
            peakRpm: peakRpm,
            taps: taps,
            turboTenths: turboTenths,
            squeekRound: round,
            squeekBlock: height,
            timestamp: uint64(block.timestamp)
        });

        unchecked { totalSubmissions++; }
        personalBest = sqkTenths > bestOf[msg.sender].sqkTenths;
        if (personalBest) {
            bestOf[msg.sender] = s;
            _placeOnBoard(s);
        }
        emit ScoreSubmitted(msg.sender, sqkTenths, peakRpm, taps, turboTenths, round, height, personalBest);
    }

    /// @notice Show a name instead of your address on the board. Empty clears it.
    function setName(string calldata name) external {
        if (bytes(name).length > MAX_NAME_BYTES) revert NameTooLong();
        nameOf[msg.sender] = name;
        emit NameSet(msg.sender, name);
    }

    /// @notice The top scores, highest first.
    function topScores() external view returns (Score[] memory) {
        return board;
    }

    /// @notice The top scores with each player's name, for a front end in one call.
    function topScoresWithNames() external view returns (Score[] memory scores, string[] memory names) {
        scores = board;
        names = new string[](scores.length);
        for (uint256 i = 0; i < scores.length; i++) names[i] = nameOf[scores[i].player];
    }

    /// @notice Where the real hamster is on Squeekchain right now.
    /// Returns zeros if SqueekCore can't be read, so a score is never lost.
    function hamsterClock() public view returns (uint64 round, uint64 height) {
        if (address(squeekCore).code.length == 0) return (0, 0);
        try squeekCore.state() returns (ISqueekCore.CoreState memory st) {
            return (st.settledThroughRound, st.blockHeight);
        } catch {
            return (0, 0);
        }
    }

    function _placeOnBoard(Score memory s) private {
        uint256 n = board.length;

        // Drop this player's older entry so each player appears once.
        for (uint256 i = 0; i < n; i++) {
            if (board[i].player == s.player) {
                for (uint256 j = i; j + 1 < n; j++) board[j] = board[j + 1];
                board.pop();
                n--;
                break;
            }
        }

        // Ties keep the earlier score ahead.
        uint256 pos = n;
        for (uint256 i = 0; i < n; i++) {
            if (s.sqkTenths > board[i].sqkTenths) {
                pos = i;
                break;
            }
        }
        if (pos >= BOARD_SIZE) return;

        board.push(s);
        for (uint256 j = n; j > pos; j--) board[j] = board[j - 1];
        board[pos] = s;
        if (board.length > BOARD_SIZE) board.pop();
    }
}
