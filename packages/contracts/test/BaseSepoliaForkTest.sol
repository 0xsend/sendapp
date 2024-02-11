// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "forge-std/Test.sol";

abstract contract BaseSepoliaForkTest is Test {
    string defaultUrl = "https://base-sepolia.publicnode.com";
    string BASE_SEPOLIA_RPC_URL = vm.envOr("BASE_GOERRLI_RPC_URL", defaultUrl);

    function createAndSelectFork() public {
        vm.selectFork(vm.createFork(BASE_SEPOLIA_RPC_URL));
    }
}
