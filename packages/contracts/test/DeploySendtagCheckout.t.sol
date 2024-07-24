// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Helper} from "../src/Helper.sol";
import {DeploySendtagCheckoutScript} from "../script/DeploySendtagCheckout.s.sol";
import {SendtagCheckout} from "../src/SendtagCheckout.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DeploySendtagCheckoutTest is Test, Helper {
    function setUp() public {
        this.labels();
    }

    function testItRuns() public {
        DeploySendtagCheckoutScript script = new DeploySendtagCheckoutScript();
        address multisig = address(SEND_REVENUE_SAFE);
        address token = address(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
        address owner = address(0xB055);
        vm.setEnv("MULTISIG", vm.toString(SEND_REVENUE_SAFE));
        vm.setEnv("TOKEN", vm.toString(token));
        vm.setEnv("OWNER", vm.toString(owner));
        SendtagCheckout sc = script.run();
        assertEq(sc.multisig(), multisig);
        assertEq(address(sc.token()), token);
        assertEq(sc.owner(), owner);
    }
}
