// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "./BaseSepoliaForkTest.sol";
// solhint-disable-next-line
import "forge-std/console2.sol";
import "../src/SendAccountFactory.sol";
import {SendAccount} from "../src/SendAccount.sol";
import "./Utils.sol";

import "account-abstraction/core/EntryPoint.sol";
import "account-abstraction/interfaces/IEntryPoint.sol";

import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "p256-verifier/P256.sol";
import "./WebAuthnTest.sol";

contract AccountSendUseropTest is BaseSepoliaForkTest, WebAuthnTest {
    using UserOperationLib for PackedUserOperation;

    EntryPoint public entryPoint;
    SendVerifier public verifier;
    SendAccountFactory public factory;

    // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.Initializable")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant INITIALIZABLE_STORAGE = 0xf0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a00;

    function setUp() public {
        this.createAndSelectFork();
        entryPoint = new EntryPoint();
        verifier = new SendVerifier();
        factory = new SendAccountFactory(entryPoint, verifier);
        /* solhint-disable */
        console.log("entryPoint address:", address(entryPoint));
        console.log("factory address:", address(factory));
        /* solhint-enable */
    }

    function testSimpleOp() public {
        P256KeyPair memory keyPair = demoP256KeyPair();
        bytes32[2] memory key = [bytes32(keyPair.publicKeyX), bytes32(keyPair.publicKeyY)];
        SendAccount.Call[] memory calls = new SendAccount.Call[](0);
        SendAccount acc = factory.createAccount(0, key, calls, 42);
        // solhint-disable-next-line
        console.log("new account address:", address(acc));
        vm.deal(address(acc), 1 ether);

        // dummy op
        PackedUserOperation memory op = PackedUserOperation({
            sender: address(acc),
            nonce: 0,
            initCode: hex"",
            callData: hex"00",
            // accountGasLimits = callGasLimit, verificationGasLimit
            accountGasLimits: bytes32(abi.encodePacked(uint128(2000000), uint128(2000000))),
            preVerificationGas: 2100000,
            gasFees: bytes32(abi.encodePacked(uint128(3e11), uint128(1e11))), // maxFeePerGas, maxPriorityFeePerGas
            paymasterAndData: hex"",
            signature: hex"00"
        });

        bytes32 hash = entryPoint.getUserOpHash(op);
        uint8 version = 1;
        uint48 validUntil = 0;
        bytes memory challenge = abi.encodePacked(version, validUntil, hash);
        assertEq(challenge.length, 39);
        (Signature memory sig,) = signP256(keyPair.privateKey, challenge);
        bytes memory ownerSig = abi.encodePacked(
            version,
            validUntil,
            uint8(0), // keySlot
            abi.encode(sig) // signature
        );

        op.signature = ownerSig;

        // expect a valid but reverting op
        PackedUserOperation[] memory ops = new PackedUserOperation[](1);
        ops[0] = op;
        vm.expectEmit(true, true, true, false);
        emit IEntryPoint.UserOperationEvent(
            hash,
            address(acc),
            address(0),
            0, // These and following are not checked.
            false,
            0 gwei,
            0
        );
        entryPoint.handleOps(ops, payable(address(acc)));

        // code coverage can't handle indirect calls
        // call validateUserOp directly
        SendAccount a2 = new SendAccount(acc.entryPoint(), acc.verifier());
        vm.store(address(a2), INITIALIZABLE_STORAGE, 0); // set _initialized = 0
        a2.initialize(0, key, calls);
        vm.prank(address(entryPoint));
        uint256 validationData = a2.validateUserOp(op, hash, 0);
        assertEq(validationData, 0);
    }

    function testValidUntil() public {
        P256KeyPair memory keyPair = demoP256KeyPair();
        bytes32[2] memory key = [bytes32(keyPair.publicKeyX), bytes32(keyPair.publicKeyY)];
        SendAccount.Call[] memory calls = new SendAccount.Call[](0);
        SendAccount acc = factory.createAccount(0, key, calls, 42);
        // solhint-disable-next-line
        console.log("new account address:", address(acc));
        vm.deal(address(acc), 1 ether);

        // dummy op
        PackedUserOperation memory op = PackedUserOperation({
            sender: address(acc),
            nonce: 0,
            initCode: hex"",
            callData: hex"00",
            // accountGasLimits = callGasLimit, verificationGasLimit
            accountGasLimits: bytes32(abi.encodePacked(uint128(2000000), uint128(2000000))),
            preVerificationGas: 2100000,
            gasFees: bytes32(abi.encodePacked(uint128(3e11), uint128(1e11))), // maxFeePerGas, maxPriorityFeePerGas
            paymasterAndData: hex"",
            signature: hex"00"
        });

        bytes32 hash = entryPoint.getUserOpHash(op);
        uint8 version = 1;
        uint48 validUntil = 1e9; // validUntil unix timestamp 1e9
        bytes memory challenge = abi.encodePacked(version, validUntil, hash);
        assertEq(challenge.length, 39);
        (Signature memory sig,) = signP256(keyPair.privateKey, challenge);
        bytes memory ownerSig = abi.encodePacked(
            version,
            validUntil,
            uint8(0), // keySlot
            abi.encode(sig) // signature
        );

        op.signature = ownerSig;
        // too late: can't execute after timestamp 1e9
        vm.warp(1e9 + 1);
        PackedUserOperation[] memory ops = new PackedUserOperation[](1);
        ops[0] = op;
        vm.expectRevert(abi.encodeWithSelector(IEntryPoint.FailedOp.selector, 0, "AA22 expired or not due"));
        entryPoint.handleOps(ops, payable(address(acc)));

        // just early enough: can execute at timestamp 1e9
        vm.warp(1e9);
        entryPoint.handleOps(ops, payable(address(acc)));
    }

    function testSignP256() public {
        P256KeyPair memory keyPair = demoP256KeyPair();
        bytes32 digest = sha256(abi.encodePacked("hello world"));
        (bytes32 r, bytes32 s) = vm.signP256(uint256(keyPair.privateKey), digest);
        s = bytes32(normalizeP256S(uint256(s)));
        bool result = P256.verifySignature(digest, uint256(r), uint256(s), keyPair.publicKeyX, keyPair.publicKeyY);
        assertTrue(result);
    }
}
