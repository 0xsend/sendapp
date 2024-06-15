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
        sendCheckStub = SendCheckStub(new TestERC20(0), sender1, receiver1, ephemeralPrivKey1, vm.addr(ephemeralPrivKey1));
    }
    
    /// @notice Creates an ephemeral signature
    /// @notice An ephemeral signature is the hash of the receiver's address using the ephemeral private key (the ephemeral private key of the sender)
    /// @param receiver the receiver's address
    function createEphemeralSignature(
        address receiver,
        uint256 _ephemeralPrivateKey
    ) internal pure returns (bytes memory) {
        bytes32 messageHash = MessageHashUtils.toEthSignedMessageHash(
            keccak256(abi.encodePacked(receiver))
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(
            _ephemeralPrivateKey,
            messageHash
        );

        bytes memory signature = abi.encodePacked(r, s, v);
        return signature;
    }

    /// @notice Tests that we can recover the ephemeral pubkey (`ephemeralAddress`) from a message (an address) and a signature (an address signed with the ephemeral privkey
    /// @param receiver an arbitary address to test against
    function testECDSA(address receiver) public {
        bytes32 messageHash = MessageHashUtils.toEthSignedMessageHash(
            keccak256(abi.encodePacked(receiver))
        );
        assertTrue(
            ECDSA.recover(messageHash, createEphemeralSignature(receiver, sendCheckStub.ephemeralPrivKey)) == sendCheckStub.ephemeralAddress
        );
    }

    /// @notice Create a /send check
    /// @param token the token to create the /send check for
    /// @param sender the sending address of the /send check
    /// @param ephemeralAddress the ephemeral address (derived from the sender's ephemeral keypair)
    /// @param amount the /send check amount
    function createSendCheck(IERC20 token, address sender, address ephemeralAddress, uint amount) internal {
        vm.startPrank(sender, sender);
        token.approve(address(sendCheck), amount);
        sendCheck.createCheck(token, ephemeralAddress, amount);
        vm.stopPrank();
    }

    function claimSendCheck(IERC20 token, address receiver, address ephemeralAddress, uint256 ephemeralPrivkey) public {
        // receiver signs their address with the sender's privkey
        bytes memory signature = createEphemeralSignature(receiver, ephemeralPrivkey);
        vm.startPrank(receiver, receiver);
        sendCheck.claimCheck(token, ephemeralAddress, signature);
        vm.stopPrank();
    }
}