// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Helper} from "../src/Helper.sol";
import {TestERC20} from "account-abstraction/test/TestERC20.sol";
import {SendCheckHelper} from "./SendCheckHelper.t.sol";
import {DeploySendCheckScript} from "../script/DeploySendCheck.s.sol";
import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import "openzeppelin-contracts/contracts/utils/cryptography/MessageHashUtils.sol";
import "../src/SendCheck.sol";

struct SendCheckStub {
    TestERC20 token;
    TestERC20 token2;
    address sender;
    address receiver;
    uint256 ephemeralPrivKey;
    address ephemeralAddress;
}

contract SendCheckHelper is Test {
    SendCheck public sendCheck;

    SendCheckStub sendCheckStub;

    function setUp() public {
        DeploySendCheckScript deployScript = new DeploySendCheckScript();
        sendCheck = deployScript.run();

        setUpStubs();
    }

    function setUpStubs() internal {
        // setup /send check stubs
        address sender1 = vm.addr(0x123);
        address receiver1 = vm.addr(0x321);
        uint256 ephemeralPrivKey1 = 0x1010101010101010101010101010101010101010101010101010101010101010;
        sendCheckStub = SendCheckStub(
            new TestERC20(0), new TestERC20(0), sender1, receiver1, ephemeralPrivKey1, vm.addr(ephemeralPrivKey1)
        );
    }

    /// @notice Creates an ephemeral signature
    /// @notice An ephemeral signature is the hash of the receiver's address using the ephemeral private key (the ephemeral private key of the sender)
    /// @param receiver the receiver's address
    function createEphemeralSignature(address receiver, uint256 _ephemeralPrivateKey)
        internal
        pure
        returns (bytes memory)
    {
        bytes32 messageHash = MessageHashUtils.toEthSignedMessageHash(keccak256(abi.encodePacked(receiver)));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(_ephemeralPrivateKey, messageHash);

        bytes memory signature = abi.encodePacked(r, s, v);
        return signature;
    }

    /// @notice Tests that we can recover the ephemeral pubkey (`ephemeralAddress`) from a message (an address) and a signature (an address signed with the ephemeral privkey
    /// @param receiver an arbitary address to test against
    function testECDSA(address receiver) public {
        bytes32 messageHash = MessageHashUtils.toEthSignedMessageHash(keccak256(abi.encodePacked(receiver)));
        assertTrue(
            ECDSA.recover(messageHash, createEphemeralSignature(receiver, sendCheckStub.ephemeralPrivKey))
                == sendCheckStub.ephemeralAddress
        );
    }

    /// @notice Create a /send check with multiple tokens
    /// @param tokens the tokens to include in the check
    /// @param sender the sending address of the /send check
    /// @param ephemeralAddress the ephemeral address (derived from the sender's ephemeral keypair)
    /// @param amounts the amounts for each token
    function createSendCheck(
        IERC20[] memory tokens,
        address sender,
        address ephemeralAddress,
        uint256[] memory amounts
    ) internal {
        createSendCheck(tokens, sender, ephemeralAddress, amounts, block.timestamp + 1 days);
    }

    /// @notice Create a /send check with multiple tokens and custom expiration
    /// @param tokens the tokens to include in the check
    /// @param sender the sending address of the /send check
    /// @param ephemeralAddress the ephemeral address (derived from the sender's ephemeral keypair)
    /// @param amounts the amounts for each token
    /// @param expiresAt the expiration timestamp
    function createSendCheck(
        IERC20[] memory tokens,
        address sender,
        address ephemeralAddress,
        uint256[] memory amounts,
        uint256 expiresAt
    ) internal {
        vm.startPrank(sender, sender);
        // Approve each token
        for (uint256 i = 0; i < tokens.length; i++) {
            tokens[i].approve(address(sendCheck), amounts[i]);
        }
        sendCheck.createCheck(tokens, ephemeralAddress, amounts, expiresAt);
        vm.stopPrank();
    }

    function claimSendCheck(address receiver, address ephemeralAddress, uint256 ephemeralPrivkey) public {
        // receiver signs their address with the sender's privkey
        bytes memory signature = createEphemeralSignature(receiver, ephemeralPrivkey);
        vm.startPrank(receiver, receiver);
        sendCheck.claimCheck(ephemeralAddress, signature);
        vm.stopPrank();
    }
}
