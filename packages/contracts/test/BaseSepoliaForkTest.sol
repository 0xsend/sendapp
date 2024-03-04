// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "forge-std/Test.sol";

import {P256} from "p256-verifier/P256.sol";

abstract contract BaseSepoliaForkTest is Test {
    string defaultUrl = "https://base-sepolia-rpc.publicnode.com";
    string BASE_SEPOLIA_RPC_URL = vm.envOr("BASE_SEPOLIA_RPC_URL", defaultUrl);

    function createAndSelectFork() public {
        vm.selectFork(vm.createFork(BASE_SEPOLIA_RPC_URL));
        vm.label(P256.VERIFIER, "P256Verifier");
    }
}
