// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {Helper} from "../src/Helper.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "../src/TokenPaymaster.sol";

contract AddTokenPaymasterDepositScript is Script, Helper {
    function setUp() public {
        this.labels();
    }

    function run() public {
        address addr = vm.envAddress("PAYMASTER");
        uint256 deposit = vm.envUint("DEPOSIT");

        require(addr != address(0), "PAYMASTER env variable not set");
        require(deposit > 0, "DEPOSIT env variable not set");

        TokenPaymaster paymaster = TokenPaymaster(payable(addr));
        address entryPoint = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;

        vm.startBroadcast();
        IEntryPoint(entryPoint).depositTo{value: deposit}(address(paymaster));
        vm.stopBroadcast();
    }
}
