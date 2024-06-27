// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Helper} from "../src/Helper.sol";
import {DeploySendCheckScript} from "../script/DeploySendCheck.s.sol";
import {SendCheckHelper} from "./SendCheckHelper.t.sol";
import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import "openzeppelin-contracts/contracts/utils/cryptography/MessageHashUtils.sol";
import "../src/SendCheck.sol";
import {TestERC20} from "account-abstraction/test/TestERC20.sol";

contract SendCheckTest is SendCheckHelper {
    // TODO: assertions on emits
    event CheckCreated(Check check);
    event CheckClaimed(Check check, address redeemer);

    // /send checks can be created
    function testCreateCheck() public {
        (TestERC20 token, address sender) = (sendCheckStub.token, sendCheckStub.sender);
        token.sudoMint(sender, 500);

        createSendCheck(sendCheckStub.token, sender, sendCheckStub.ephemeralAddress, 500);
        (address ephemeralAddress, address from, uint256 amount, IERC20 _token) =
            sendCheck.checks(sendCheckStub.ephemeralAddress);
        assertEq(ephemeralAddress, sendCheckStub.ephemeralAddress);
        assertEq(from, sender);
        assertEq(amount, 500);
        assertEq(sendCheckStub.token.balanceOf(sender), 0);
        assertEq(sendCheckStub.token.balanceOf(address(sendCheck)), 500);
        assertEq(address(token), address(_token));
    }

    // /send check cannot be created
    function testCannotCreateCheck() public {
        (TestERC20 token, address sender) = (sendCheckStub.token, sendCheckStub.sender);
        token.sudoMint(sender, 500);
        vm.startPrank(sender, sender);

        // sender has insufficient funds
        vm.expectRevert();
        sendCheck.createCheck(token, sendCheckStub.ephemeralAddress, 1000);

        // invalid token address
        vm.expectRevert(bytes("Invalid token address"));
        sendCheck.createCheck(ERC20(address(0)), sendCheckStub.ephemeralAddress, 500);

        // invalid amount
        vm.expectRevert(bytes("Invalid amount"));
        sendCheck.createCheck(token, sendCheckStub.ephemeralAddress, 0);

        // invalid ephemeral address
        vm.expectRevert(bytes("Invalid ephemeral address"));
        sendCheck.createCheck(token, address(0), 500);

        vm.stopPrank();

        assertEq(token.balanceOf(sender), 500);
        assertEq(token.balanceOf(address(sendCheck)), 0);
    }

    // /send checks can be created and claimed by receivers with a valid signature
    function testAuthorizedFlow() public {
        (TestERC20 token, address sender) = (sendCheckStub.token, sendCheckStub.sender);
        token.sudoMint(sender, 500);

        // sender creates /send check
        createSendCheck(token, sender, sendCheckStub.ephemeralAddress, 500);

        // receiver can claim with a valid signature (signing their address with sender's privkey)
        address receiver = sendCheckStub.receiver;
        claimSendCheck(receiver, sendCheckStub.ephemeralAddress, sendCheckStub.ephemeralPrivKey);
        assertEq(token.balanceOf(sender), 0);
        assertEq(token.balanceOf(address(sendCheck)), 0);
        assertEq(token.balanceOf(receiver), 500);
    }

    // /send checks can be claimed by the sender (without a signature)
    function testClaimSelf() public {
        (TestERC20 token, address sender) = (sendCheckStub.token, sendCheckStub.sender);
        token.sudoMint(sender, 500);

        createSendCheck(token, sender, sendCheckStub.ephemeralAddress, 500);
        assertEq(token.balanceOf(sender), 0);
        assertEq(token.balanceOf(address(sendCheck)), 500);

        vm.prank(sender, sender);
        sendCheck.claimCheckSelf(sendCheckStub.ephemeralAddress);
        assertEq(token.balanceOf(sender), 500);
        assertEq(token.balanceOf(address(sendCheck)), 0);
    }

    // /send checks cannot be cancelled by other users (with a valid signature)
    function testCannotClaimSelf() public {
        (TestERC20 token, address sender) = (sendCheckStub.token, sendCheckStub.sender);
        token.sudoMint(sender, 1000);
        createSendCheck(token, sender, sendCheckStub.ephemeralAddress, 500);

        // check has already been claimed
        claimSendCheck(sendCheckStub.receiver, sendCheckStub.ephemeralAddress, sendCheckStub.ephemeralPrivKey);

        vm.expectRevert(bytes("Check does not exist"));
        sendCheck.claimCheckSelf(sendCheckStub.ephemeralAddress);

        // person other than the sender cannot self-claim check
        createSendCheck(token, sender, sendCheckStub.ephemeralAddress, 500);

        vm.startPrank(vm.addr(0x0000001), vm.addr(0x0000001));
        assertTrue(vm.addr(0x0000001) != sendCheckStub.sender);
        vm.expectRevert(bytes("Not check sender"));
        sendCheck.claimCheckSelf(sendCheckStub.ephemeralAddress);
        vm.stopPrank();
    }

    // /send checks cannot be claimed by unauthorized receivers (receivers without the sender's privkey)
    function testUnauthorizedFlow() public {
        (TestERC20 token, address sender) = (sendCheckStub.token, sendCheckStub.sender);
        token.sudoMint(sender, 1000);

        // sender creates /send check
        createSendCheck(sendCheckStub.token, sender, sendCheckStub.ephemeralAddress, 500);

        // receiver with invalid signature (does not possess sender's privkey) cannot claim check
        address receiver = sendCheckStub.receiver;
        uint256 invalidEphemeralPrivKey = uint256(keccak256(abi.encodePacked(block.timestamp)));

        vm.expectRevert(bytes("Invalid signature"));
        claimSendCheck(receiver, sendCheckStub.ephemeralAddress, invalidEphemeralPrivKey);
    }

    // /send checks cannot be claimed if they have already been redeemed
    function testCannotClaimRedeemedCheck() public {
        (TestERC20 token, address sender) = (sendCheckStub.token, sendCheckStub.sender);
        token.sudoMint(sender, 500);

        // create and redeem a check
        address receiver = sendCheckStub.receiver;
        createSendCheck(sendCheckStub.token, sender, sendCheckStub.ephemeralAddress, 500);
        claimSendCheck(receiver, sendCheckStub.ephemeralAddress, sendCheckStub.ephemeralPrivKey);
        assertEq(token.balanceOf(sender), 0);
        assertEq(token.balanceOf(receiver), 500);

        // receiver with valid signature cannot claim already redeemed check
        vm.expectRevert(bytes("Check does not exist"));
        claimSendCheck(receiver, sendCheckStub.ephemeralAddress, sendCheckStub.ephemeralPrivKey);
    }

    // /send check cannot be claimed if it's non-existent
    function testCannotClaimNonExistentCheck() public {
        (TestERC20 token, address sender) = (sendCheckStub.token, sendCheckStub.sender);
        token.sudoMint(sender, 500);

        createSendCheck(sendCheckStub.token, sender, sendCheckStub.ephemeralAddress, 500);

        // invalid ephemeralAddress
        vm.expectRevert(bytes("Check does not exist"));
        claimSendCheck(sendCheckStub.receiver, vm.addr(0x123), sendCheckStub.ephemeralPrivKey);
    }
}
