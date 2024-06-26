// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "./BaseSepoliaForkTest.sol";
import "openzeppelin-contracts/contracts/proxy/utils/UUPSUpgradeable.sol";
import "openzeppelin-contracts-upgradeable/contracts/access/OwnableUpgradeable.sol";
import "../src/SendVerifier.sol";
import "./Utils.sol";
import {ERC1967Utils} from "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Utils.sol";

// Does nothing. Used to test upgradability.
contract VerifierBrick {
    function verifySignature(bytes memory message, bytes calldata signature, uint256 x, uint256 y)
        public
        pure
        returns (bool)
    {
        (message, signature, x, y); // silence warning
        return true;
    }

    /// Test contract, exclude from coverage
    function test() public {}
}

contract UpgradeableVerifierBrick is UUPSUpgradeable, OwnableUpgradeable {
    /// UUPSUpsgradeable: only allow owner to upgrade
    function _authorizeUpgrade(address newImplementation) internal view override onlyOwner {
        (newImplementation); // No-op; silence unused parameter warning
    }

    function upgradeTo(address newImplementation) public {
        upgradeToAndCall(newImplementation, bytes(""));
    }

    function verifySignature(bytes memory message, bytes calldata signature, uint256 x, uint256 y)
        public
        pure
        returns (bool)
    {
        (message, signature, x, y); // silence warning
        return true;
    }

    /// Test contract, exclude from coverage
    function test() public {}
}

contract VerifierTest is BaseSepoliaForkTest {
    address public implementation;
    SendVerifier public verifier;

    uint256 public dummyX;
    uint256 public dummyY;
    bytes public dummyMessage;
    bytes public dummySignature;

    function setUp() public {
        this.createAndSelectFork();
        implementation = address(new SendVerifier{salt: 0}());
        address initOwner = address(this);
        SendVerifierProxy proxy = new SendVerifierProxy{salt: 0}(
            implementation, abi.encodeWithSelector(SendVerifier.init.selector, initOwner)
        );
        verifier = SendVerifier(address(proxy));

        uint8 version = 1;
        uint48 validUntil = 1e9; // validUntil unix timestamp 1e9
        bytes32 expectedUserOpHash = hex"215ca7ecb510fd321864dc69106e538c19001224432d6ce73487e992b3dc54cb";
        dummyX = 0x65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e4;
        dummyY = 0x4a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437;
        dummyMessage = abi.encodePacked(version, validUntil, expectedUserOpHash);
        dummySignature = abi.encodePacked(
            uint8(0), // keySlot
            abi.encode( // signature
                Utils.rawSignatureToSignature({
                    challenge: dummyMessage,
                    r: 0x6f255bb79144ca77967dcf09c97072c0c399943f54310ef47c252fa8c4499ede,
                    s: 0x5ac0ae8ba13eee89509ab1c4151af3d9a8f58c24d3cd3c68579eb64549e7ef47
                })
            )
        );
    }

    // only test upgradeability, other functions are tested by SendAccount
    function testUpgrade() public {
        // Verifier is a UUPS proxy.
        // Show that the proxy points to the correct implementation.
        assertFalse(address(verifier) == implementation);
        assertEq(verifier.implementation(), implementation);

        // Call owner() to show it's correct
        address initOwner = address(this);
        assertEq(verifier.owner(), initOwner);

        // Transfer ownership
        address newOwner = address(0x5555);
        verifier.transferOwnership(newOwner);
        assertEq(verifier.owner(), newOwner);

        // Old owner can't upgrade
        vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, initOwner));
        vm.prank(initOwner);
        verifier.upgradeToAndCall(address(0x123), bytes(""));

        // Using new owner, try bricking the contract. Can't, not UUPS.
        VerifierBrick brick = new VerifierBrick();
        vm.expectRevert(abi.encodeWithSelector(ERC1967Utils.ERC1967InvalidImplementation.selector, address(brick)));
        vm.prank(newOwner);
        verifier.upgradeTo(address(brick));

        // Verify dummy stuff, check it fails

        vm.expectRevert();
        verifier.verifySignature(hex"12", hex"34", 56, 78);
        assertTrue(verifier.verifySignature(dummyMessage, dummySignature, dummyX, dummyY));

        // Brick the contract
        UpgradeableVerifierBrick upBrick = new UpgradeableVerifierBrick();
        vm.prank(newOwner);
        verifier.upgradeTo(address(upBrick));

        // Confirm it's bricked
        assertTrue(verifier.verifySignature(hex"12", hex"34", 56, 78));
        assertTrue(verifier.verifySignature(dummyMessage, dummySignature, dummyX, dummyY));

        // Unbrick the contract
        vm.prank(newOwner);
        verifier.upgradeTo(implementation);

        // Confirm unbricked, state still good
        vm.expectRevert();
        verifier.verifySignature(hex"12", hex"34", 56, 78);
        assertTrue(verifier.verifySignature(dummyMessage, dummySignature, dummyX, dummyY));
        assertEq(verifier.implementation(), implementation);
    }
}
