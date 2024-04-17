// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";

import {TestOracle2} from "../test/TestOracle2.sol";

/// @title DeployTestOracle2
/// @notice DeployTestOracle2 deploys two TestOracle2 contracts. This is due to testnet not having any chainlink data feeds.
/// @dev forge script ./script/DeployTestOracle2.s.sol:DeployTestOracle2Script
contract DeployTestOracle2Script is Script {
    function run() public {
        vm.startBroadcast();
        bytes32 salt = bytes32(uint256(1234));

        TestOracle2 usdcUsd = new TestOracle2{salt: salt}(
            100000000, // price 1 USD = 1 USDC
            8, // decimals
            "USDC/USD", // name
            msg.sender // owner
        );

        TestOracle2 ethUsd = new TestOracle2{salt: salt}(
            332282362360, // price 1 ETH = 3322.82362360 USDC
            8, // decimals
            "ETH/USD", // name
            msg.sender // owner
        );
        // solhint-disable-next-line no-console
        console2.log("usdcUsd address:", address(usdcUsd));
        // solhint-disable-next-line no-console
        console2.log("ethUsd address:", address(ethUsd));
        vm.stopBroadcast();
    }
}
