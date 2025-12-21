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

    function _singleTokenArray(IERC20 token) internal pure returns (IERC20[] memory) {
        IERC20[] memory tokens = new IERC20[](1);
        tokens[0] = token;
        return tokens;
    }

    function _singleAmountArray(uint256 amount) internal pure returns (uint256[] memory) {
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        return amounts;
    }

    // /send checks can be created with a single token
    function testCreateCheck() public {
        (TestERC20 token, address sender) = (sendCheckStub.token, sendCheckStub.sender);
        token.sudoMint(sender, 500);

        uint256 expiresAt = block.timestamp + 1 days;
        createSendCheck(
            _singleTokenArray(token), sender, sendCheckStub.ephemeralAddress, _singleAmountArray(500), expiresAt
        );
        (address ephemeralAddress, address from, IERC20[] memory tokens, uint256[] memory amounts, uint256 _expiresAt) =
            sendCheck.checks(sendCheckStub.ephemeralAddress);
        assertEq(ephemeralAddress, sendCheckStub.ephemeralAddress);
        assertEq(from, sender);
        assertEq(tokens.length, 1);
        assertEq(amounts.length, 1);
        assertEq(address(tokens[0]), address(token));
        assertEq(amounts[0], 500);
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

        IERC20[] memory tokens = new IERC20[](2);
        tokens[0] = token1;
        tokens[1] = token2;
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 500;
        amounts[1] = 1000;

        uint256 expiresAt = block.timestamp + 1 days;
        createSendCheck(tokens, sender, sendCheckStub.ephemeralAddress, amounts, expiresAt);

        (
            address ephemeralAddress,
            address from,
            IERC20[] memory returnedTokens,
            uint256[] memory returnedAmounts,
            uint256 _expiresAt
        ) = sendCheck.checks(sendCheckStub.ephemeralAddress);

        assertEq(ephemeralAddress, sendCheckStub.ephemeralAddress);
        assertEq(from, sender);
        assertEq(returnedTokens.length, 2);
        assertEq(returnedAmounts.length, 2);
        assertEq(address(returnedTokens[0]), address(token1));
        assertEq(address(returnedTokens[1]), address(token2));
        assertEq(returnedAmounts[0], 500);
        assertEq(returnedAmounts[1], 1000);
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
        sendCheck.createCheck(
            _singleTokenArray(token), sendCheckStub.ephemeralAddress, _singleAmountArray(1000), validExpiry
        );

        // invalid token address
        vm.expectRevert(bytes("Invalid token address"));
        sendCheck.createCheck(
            _singleTokenArray(IERC20(address(0))), sendCheckStub.ephemeralAddress, _singleAmountArray(500), validExpiry
        );

        // invalid amount
        vm.expectRevert(bytes("Invalid amount"));
        sendCheck.createCheck(
            _singleTokenArray(token), sendCheckStub.ephemeralAddress, _singleAmountArray(0), validExpiry
        );

        // invalid ephemeral address
        vm.expectRevert(bytes("Invalid ephemeral address"));
        sendCheck.createCheck(_singleTokenArray(token), address(0), _singleAmountArray(500), validExpiry);

        // invalid expiration (in the past)
        vm.expectRevert(bytes("Invalid expiration"));
        sendCheck.createCheck(
            _singleTokenArray(token), sendCheckStub.ephemeralAddress, _singleAmountArray(500), block.timestamp - 1
        );

        // invalid expiration (current timestamp)
        vm.expectRevert(bytes("Invalid expiration"));
        sendCheck.createCheck(
            _singleTokenArray(token), sendCheckStub.ephemeralAddress, _singleAmountArray(500), block.timestamp
        );

        // empty tokens array
        IERC20[] memory emptyTokens = new IERC20[](0);
        uint256[] memory emptyAmounts = new uint256[](0);
        vm.expectRevert(bytes("No tokens provided"));
        sendCheck.createCheck(emptyTokens, sendCheckStub.ephemeralAddress, emptyAmounts, validExpiry);

        // array length mismatch
        IERC20[] memory twoTokens = new IERC20[](2);
        twoTokens[0] = token;
        twoTokens[1] = sendCheckStub.token2;
        vm.expectRevert(bytes("Array length mismatch"));
        sendCheck.createCheck(twoTokens, sendCheckStub.ephemeralAddress, _singleAmountArray(500), validExpiry);

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
        IERC20[] memory tokens = new IERC20[](2);
        tokens[0] = token;
        tokens[1] = token; // duplicate
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 500;
        amounts[1] = 500;

        vm.expectRevert(bytes("Duplicate token"));
        sendCheck.createCheck(tokens, sendCheckStub.ephemeralAddress, amounts, validExpiry);

        vm.stopPrank();
    }

    // /send checks can be created and claimed by receivers with a valid signature
    function testAuthorizedFlow() public {
        (TestERC20 token, address sender) = (sendCheckStub.token, sendCheckStub.sender);
        token.sudoMint(sender, 500);

        // sender creates /send check
        createSendCheck(_singleTokenArray(token), sender, sendCheckStub.ephemeralAddress, _singleAmountArray(500));

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

        IERC20[] memory tokens = new IERC20[](2);
        tokens[0] = token1;
        tokens[1] = token2;
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 500;
        amounts[1] = 1000;

        createSendCheck(tokens, sender, sendCheckStub.ephemeralAddress, amounts);

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

        createSendCheck(_singleTokenArray(token), sender, sendCheckStub.ephemeralAddress, _singleAmountArray(500));
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

        IERC20[] memory tokens = new IERC20[](2);
        tokens[0] = token1;
        tokens[1] = token2;
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 500;
        amounts[1] = 1000;

        createSendCheck(tokens, sender, sendCheckStub.ephemeralAddress, amounts);

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
        createSendCheck(_singleTokenArray(token), sender, sendCheckStub.ephemeralAddress, _singleAmountArray(500));

        // check has already been claimed
        claimSendCheck(sendCheckStub.receiver, sendCheckStub.ephemeralAddress, sendCheckStub.ephemeralPrivKey);

        vm.expectRevert(bytes("Check does not exist"));
        sendCheck.claimCheckSelf(sendCheckStub.ephemeralAddress);

        // person other than the sender cannot self-claim check
        createSendCheck(_singleTokenArray(token), sender, sendCheckStub.ephemeralAddress, _singleAmountArray(500));

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
        createSendCheck(_singleTokenArray(token), sender, sendCheckStub.ephemeralAddress, _singleAmountArray(500));

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
        createSendCheck(_singleTokenArray(token), sender, sendCheckStub.ephemeralAddress, _singleAmountArray(500));
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

        createSendCheck(_singleTokenArray(token), sender, sendCheckStub.ephemeralAddress, _singleAmountArray(500));

        // invalid ephemeralAddress
        vm.expectRevert(bytes("Check does not exist"));
        claimSendCheck(sendCheckStub.receiver, vm.addr(0x123), sendCheckStub.ephemeralPrivKey);
    }

    // /send checks cannot be claimed after expiration
    function testCannotClaimExpiredCheck() public {
        (TestERC20 token, address sender) = (sendCheckStub.token, sendCheckStub.sender);
        token.sudoMint(sender, 500);

        uint256 expiresAt = block.timestamp + 1 hours;
        createSendCheck(
            _singleTokenArray(token), sender, sendCheckStub.ephemeralAddress, _singleAmountArray(500), expiresAt
        );

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
        createSendCheck(
            _singleTokenArray(token), sender, sendCheckStub.ephemeralAddress, _singleAmountArray(500), expiresAt
        );

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
        createSendCheck(
            _singleTokenArray(token), sender, sendCheckStub.ephemeralAddress, _singleAmountArray(500), expiresAt
        );
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
