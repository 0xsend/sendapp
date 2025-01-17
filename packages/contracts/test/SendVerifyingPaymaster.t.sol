// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import "forge-std/console2.sol";
import {Helper} from "../src/Helper.sol";
import {DeploySendVerifyingPaymasterScript} from "../script/DeploySendVerifyingPaymaster.s.sol";
import "account-abstraction/core/EntryPoint.sol";
import {SendVerifyingPaymaster} from "../src/SendVerifyingPaymaster.sol";

contract SendVerifyingPaymasterTest is Test, Helper {
    SendVerifyingPaymaster paymaster;

    function setUp() public {
        this.labels();
        address owner = makeAddr("owner");
        address verifier = makeAddr("verifier");
        deal(owner, 2 ether);

        address entryPoint = address(new EntryPoint());

        vm.etch(AA_ENTRY_POINT_V0_7, entryPoint.code);

        vm.startPrank(owner);
        paymaster = SendVerifyingPaymaster(new DeploySendVerifyingPaymasterScript().deploy(owner, verifier));
        vm.stopPrank();
    }

    function testDeploy() public {
        assertNotEq(address(paymaster), address(0));
    }

    function testParsePaymasterAndDataReference() public {
        bytes memory data = hex"9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0000000000000000000000000000493e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000deadbeef00000000000000000000000000000000000000000000000000000000000012341234";
        (uint48 _validUntil, uint48 _validAfter, bytes memory _signature) = paymaster.parsePaymasterAndData(data);
        assertEq(_validUntil, 0x00000000deadbeef);
        assertEq(_validAfter, 0x0000000000001234);
        assertEq(_signature, hex"1234");
    }


}
