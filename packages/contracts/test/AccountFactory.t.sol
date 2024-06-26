// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
// solhint-disable-next-line
import "forge-std/console2.sol";
import "../src/SendAccountFactory.sol";
import {SendAccount} from "../src/SendAccount.sol";
import {SendVerifier} from "../src/SendVerifier.sol";

import "account-abstraction/core/EntryPoint.sol";

contract AccountFactoryTest is Test {
    using UserOperationLib for PackedUserOperation;

    EntryPoint public entryPoint;
    SendAccountFactory public factory;
    SendVerifier public verifier;

    function setUp() public {
        entryPoint = new EntryPoint();
        verifier = new SendVerifier();
        factory = new SendAccountFactory(entryPoint, verifier);
    }

    function testDeploy() public {
        // invalid signing key, irrelevant here
        bytes32[2] memory key1 = [bytes32(0), bytes32(0)];

        // deploy account
        SendAccount.Call[] memory calls = new SendAccount.Call[](0);
        address counterfactual = factory.getAddress(0, key1, calls, 42);
        vm.expectEmit(true, true, true, true);
        emit SendAccountFactory.AccountCreated(counterfactual);
        SendAccount acc = factory.createAccount{value: 0}(0, key1, calls, 42);
        // solhint-disable-next-line
        console.log("new account address:", address(acc));
        assertEq(acc.numActiveKeys(), uint8(1));

        // deploy again = just returns the existing address
        // prefund still goes thru to the entrypoint contract
        assertEq(entryPoint.getDepositInfo(address(acc)).deposit, 0);
        SendAccount acc2 = factory.createAccount{value: 9}(0, key1, calls, 42);
        assertEq(address(acc), address(acc2));
        assertEq(entryPoint.getDepositInfo(address(acc)).deposit, 9);

        // get the counterfactual address, should be same
        assertEq(address(acc), counterfactual);
    }
}
