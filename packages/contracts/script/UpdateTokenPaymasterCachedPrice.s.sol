// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";

import "../src/TokenPaymaster.sol";

contract UpdateTokenPaymasterCachedPriceScript is Script {
    function run() public {
        address addr = vm.envAddress("PAYMASTER");

        require(addr != address(0), "PAYMASTER env variable not set");

        TokenPaymaster paymaster = TokenPaymaster(payable(addr));

        vm.startBroadcast();
        paymaster.updateCachedPrice(true);
        vm.stopBroadcast();
    }
}
