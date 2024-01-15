// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "forge-std/Test.sol";

abstract contract BaseGoerliForkTest is Test {
    string defaultUrl = "https://goerli.base.org";
    string BASE_GOERLI_RPC_URL = vm.envOr("BASE_GOERRLI_RPC_URL", defaultUrl);

    function createAndSelectFork() public {
        vm.selectFork(vm.createFork(BASE_GOERLI_RPC_URL));
    }
}
