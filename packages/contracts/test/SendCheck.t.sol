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
    event CheckCreated(Check check);
    event CheckClaimed(Check check, address redeemer);

    function _singleCheckAmount(IERC20 token, uint256 amount) internal pure returns (CheckAmount[] memory) {
        CheckAmount[] memory amounts = new CheckAmount[](1);
        amounts[0] = CheckAmount(token, amount);
        return amounts;
    }

    // /send checks can be created with a single token
    function testCreateCheck() public {
        (TestERC20 token, address sender) = (sendCheckStub.token, sendCheckStub.sender);
        token.sudoMint(sender, 500);

        uint256 expiresAt = block.timestamp + 1 days;
        createSendCheck(_singleCheckAmount(token, 500), sender, sendCheckStub.ephemeralAddress, expiresAt);
        (address ephemeralAddress, address from, CheckAmount[] memory amounts, uint256 _expiresAt) =
            sendCheck.checks(sendCheckStub.ephemeralAddress);
        assertEq(ephemeralAddress, sendCheckStub.ephemeralAddress);
        assertEq(from, sender);
        assertEq(amounts.length, 1);
        assertEq(address(amounts[0].token), address(token));
        assertEq(amounts[0].amount, 500);
        assertEq(_expiresAt, expiresAt);
        assertEq(sendCheckStub.token.balanceOf(sender), 0);
        assertEq(sendCheckStub.token.balanceOf(address(sendCheck)), 500);
    }

    // /send checks can be created with multiple tokens
    function testCreateCheckMultiToken() public {
        (TestERC20 token1, TestERC20 token2, address sender) =
            (sendCheckStub.token, sendCheckStub.token2, sendCheckStub.sender);
        token1.sudoMint(sender, 500);
        token2.sudoMint(sender, 1000);

        CheckAmount[] memory amounts = new CheckAmount[](2);
        amounts[0] = CheckAmount(token1, 500);
        amounts[1] = CheckAmount(token2, 1000);

        uint256 expiresAt = block.timestamp + 1 days;
        createSendCheck(amounts, sender, sendCheckStub.ephemeralAddress, expiresAt);

        (address ephemeralAddress, address from, CheckAmount[] memory returnedAmounts, uint256 _expiresAt) =
            sendCheck.checks(sendCheckStub.ephemeralAddress);

        assertEq(ephemeralAddress, sendCheckStub.ephemeralAddress);
        assertEq(from, sender);
        assertEq(returnedAmounts.length, 2);
        assertEq(address(returnedAmounts[0].token), address(token1));
        assertEq(address(returnedAmounts[1].token), address(token2));
        assertEq(returnedAmounts[0].amount, 500);
        assertEq(returnedAmounts[1].amount, 1000);
        assertEq(_expiresAt, expiresAt);

        // Verify balances
        assertEq(token1.balanceOf(sender), 0);
        assertEq(token2.balanceOf(sender), 0);
        assertEq(token1.balanceOf(address(sendCheck)), 500);
        assertEq(token2.balanceOf(address(sendCheck)), 1000);
    }

    // /send check cannot be created
    function testCannotCreateCheck() public {
        (TestERC20 token, address sender) = (sendCheckStub.token, sendCheckStub.sender);
        token.sudoMint(sender, 500);
        vm.startPrank(sender, sender);
        token.approve(address(sendCheck), 1000);

        uint256 validExpiry = block.timestamp + 1 days;

        // sender has insufficient funds
        vm.expectRevert();
        sendCheck.createCheck(_singleCheckAmount(token, 1000), sendCheckStub.ephemeralAddress, validExpiry);

        // invalid token address
        vm.expectRevert(bytes("Invalid token address"));
        sendCheck.createCheck(_singleCheckAmount(IERC20(address(0)), 500), sendCheckStub.ephemeralAddress, validExpiry);

        // invalid amount
        vm.expectRevert(bytes("Invalid amount"));
        sendCheck.createCheck(_singleCheckAmount(token, 0), sendCheckStub.ephemeralAddress, validExpiry);

        // invalid ephemeral address
        vm.expectRevert(bytes("Invalid ephemeral address"));
        sendCheck.createCheck(_singleCheckAmount(token, 500), address(0), validExpiry);

        // invalid expiration (in the past)
        vm.expectRevert(bytes("Invalid expiration"));
        sendCheck.createCheck(_singleCheckAmount(token, 500), sendCheckStub.ephemeralAddress, block.timestamp - 1);

        // invalid expiration (current timestamp)
        vm.expectRevert(bytes("Invalid expiration"));
        sendCheck.createCheck(_singleCheckAmount(token, 500), sendCheckStub.ephemeralAddress, block.timestamp);

        // empty amounts array
        CheckAmount[] memory emptyAmounts = new CheckAmount[](0);
        vm.expectRevert(bytes("No tokens provided"));
        sendCheck.createCheck(emptyAmounts, sendCheckStub.ephemeralAddress, validExpiry);

        vm.stopPrank();

        assertEq(token.balanceOf(sender), 500);
        assertEq(token.balanceOf(address(sendCheck)), 0);
    }

    // cannot create check with duplicate tokens
    function testCannotCreateCheckDuplicateTokens() public {
        (TestERC20 token, address sender) = (sendCheckStub.token, sendCheckStub.sender);
        token.sudoMint(sender, 1000);
        vm.startPrank(sender, sender);
        token.approve(address(sendCheck), 1000);

        uint256 validExpiry = block.timestamp + 1 days;

        // Create array with duplicate token
        CheckAmount[] memory amounts = new CheckAmount[](2);
        amounts[0] = CheckAmount(token, 500);
        amounts[1] = CheckAmount(token, 500); // duplicate

        vm.expectRevert(bytes("Duplicate token"));
        sendCheck.createCheck(amounts, sendCheckStub.ephemeralAddress, validExpiry);

        vm.stopPrank();
    }

    // /send checks can be created and claimed by receivers with a valid signature
    function testAuthorizedFlow() public {
        (TestERC20 token, address sender) = (sendCheckStub.token, sendCheckStub.sender);
        token.sudoMint(sender, 500);

        // sender creates /send check
        createSendCheck(_singleCheckAmount(token, 500), sender, sendCheckStub.ephemeralAddress);

        // receiver can claim with a valid signature (signing their address with sender's privkey)
        address receiver = sendCheckStub.receiver;
        claimSendCheck(receiver, sendCheckStub.ephemeralAddress, sendCheckStub.ephemeralPrivKey);
        assertEq(token.balanceOf(sender), 0);
        assertEq(token.balanceOf(address(sendCheck)), 0);
        assertEq(token.balanceOf(receiver), 500);
    }

    // /send checks with multiple tokens can be claimed
    function testAuthorizedFlowMultiToken() public {
        (TestERC20 token1, TestERC20 token2, address sender) =
            (sendCheckStub.token, sendCheckStub.token2, sendCheckStub.sender);
        token1.sudoMint(sender, 500);
        token2.sudoMint(sender, 1000);

        CheckAmount[] memory amounts = new CheckAmount[](2);
        amounts[0] = CheckAmount(token1, 500);
        amounts[1] = CheckAmount(token2, 1000);

        createSendCheck(amounts, sender, sendCheckStub.ephemeralAddress);

        address receiver = sendCheckStub.receiver;
        claimSendCheck(receiver, sendCheckStub.ephemeralAddress, sendCheckStub.ephemeralPrivKey);

        // Verify all tokens transferred to receiver
        assertEq(token1.balanceOf(receiver), 500);
        assertEq(token2.balanceOf(receiver), 1000);
        assertEq(token1.balanceOf(address(sendCheck)), 0);
        assertEq(token2.balanceOf(address(sendCheck)), 0);
    }

    // /send checks can be claimed by the sender (without a signature)
    function testClaimSelf() public {
        (TestERC20 token, address sender) = (sendCheckStub.token, sendCheckStub.sender);
        token.sudoMint(sender, 500);

        createSendCheck(_singleCheckAmount(token, 500), sender, sendCheckStub.ephemeralAddress);
        assertEq(token.balanceOf(sender), 0);
        assertEq(token.balanceOf(address(sendCheck)), 500);

        vm.prank(sender, sender);
        sendCheck.claimCheckSelf(sendCheckStub.ephemeralAddress);
        assertEq(token.balanceOf(sender), 500);
        assertEq(token.balanceOf(address(sendCheck)), 0);
    }

    // /send checks with multiple tokens can be self-claimed
    function testClaimSelfMultiToken() public {
        (TestERC20 token1, TestERC20 token2, address sender) =
            (sendCheckStub.token, sendCheckStub.token2, sendCheckStub.sender);
        token1.sudoMint(sender, 500);
        token2.sudoMint(sender, 1000);

        CheckAmount[] memory amounts = new CheckAmount[](2);
        amounts[0] = CheckAmount(token1, 500);
        amounts[1] = CheckAmount(token2, 1000);

        createSendCheck(amounts, sender, sendCheckStub.ephemeralAddress);

        assertEq(token1.balanceOf(sender), 0);
        assertEq(token2.balanceOf(sender), 0);

        vm.prank(sender, sender);
        sendCheck.claimCheckSelf(sendCheckStub.ephemeralAddress);

        assertEq(token1.balanceOf(sender), 500);
        assertEq(token2.balanceOf(sender), 1000);
        assertEq(token1.balanceOf(address(sendCheck)), 0);
        assertEq(token2.balanceOf(address(sendCheck)), 0);
    }

    // /send checks cannot be cancelled by other users (with a valid signature)
    function testCannotClaimSelf() public {
        (TestERC20 token, address sender) = (sendCheckStub.token, sendCheckStub.sender);
        token.sudoMint(sender, 1000);
        createSendCheck(_singleCheckAmount(token, 500), sender, sendCheckStub.ephemeralAddress);

        // check has already been claimed
        claimSendCheck(sendCheckStub.receiver, sendCheckStub.ephemeralAddress, sendCheckStub.ephemeralPrivKey);

        vm.expectRevert(bytes("Check does not exist"));
        sendCheck.claimCheckSelf(sendCheckStub.ephemeralAddress);

        // person other than the sender cannot self-claim check
        createSendCheck(_singleCheckAmount(token, 500), sender, sendCheckStub.ephemeralAddress);

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
        createSendCheck(_singleCheckAmount(token, 500), sender, sendCheckStub.ephemeralAddress);

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
        createSendCheck(_singleCheckAmount(token, 500), sender, sendCheckStub.ephemeralAddress);
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

        createSendCheck(_singleCheckAmount(token, 500), sender, sendCheckStub.ephemeralAddress);

        // invalid ephemeralAddress
        vm.expectRevert(bytes("Check does not exist"));
        claimSendCheck(sendCheckStub.receiver, vm.addr(0x123), sendCheckStub.ephemeralPrivKey);
    }

    // /send checks cannot be claimed after expiration
    function testCannotClaimExpiredCheck() public {
        (TestERC20 token, address sender) = (sendCheckStub.token, sendCheckStub.sender);
        token.sudoMint(sender, 500);

        uint256 expiresAt = block.timestamp + 1 hours;
        createSendCheck(_singleCheckAmount(token, 500), sender, sendCheckStub.ephemeralAddress, expiresAt);

        // warp time past expiration
        vm.warp(expiresAt + 1);

        // receiver cannot claim expired check
        vm.expectRevert(bytes("Check expired"));
        claimSendCheck(sendCheckStub.receiver, sendCheckStub.ephemeralAddress, sendCheckStub.ephemeralPrivKey);

        // tokens should still be in the contract
        assertEq(token.balanceOf(address(sendCheck)), 500);
    }

    // /send checks can be claimed right before expiration
    function testClaimCheckBeforeExpiration() public {
        (TestERC20 token, address sender) = (sendCheckStub.token, sendCheckStub.sender);
        token.sudoMint(sender, 500);

        uint256 expiresAt = block.timestamp + 1 hours;
        createSendCheck(_singleCheckAmount(token, 500), sender, sendCheckStub.ephemeralAddress, expiresAt);

        // warp time to exactly the expiration (should still be claimable)
        vm.warp(expiresAt);

        // receiver can still claim at expiration time
        claimSendCheck(sendCheckStub.receiver, sendCheckStub.ephemeralAddress, sendCheckStub.ephemeralPrivKey);
        assertEq(token.balanceOf(sendCheckStub.receiver), 500);
        assertEq(token.balanceOf(address(sendCheck)), 0);
    }

    // expired /send checks can still be reclaimed by the sender
    function testClaimSelfExpiredCheck() public {
        (TestERC20 token, address sender) = (sendCheckStub.token, sendCheckStub.sender);
        token.sudoMint(sender, 500);

        uint256 expiresAt = block.timestamp + 1 hours;
        createSendCheck(_singleCheckAmount(token, 500), sender, sendCheckStub.ephemeralAddress, expiresAt);
        assertEq(token.balanceOf(sender), 0);
        assertEq(token.balanceOf(address(sendCheck)), 500);

        // warp time past expiration
        vm.warp(expiresAt + 1 days);

        // sender can still reclaim expired check
        vm.prank(sender, sender);
        sendCheck.claimCheckSelf(sendCheckStub.ephemeralAddress);
        assertEq(token.balanceOf(sender), 500);
        assertEq(token.balanceOf(address(sendCheck)), 0);
    }
}
