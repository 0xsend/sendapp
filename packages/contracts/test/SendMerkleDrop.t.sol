// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "forge-std/Test.sol";
import {SendToken} from "../src/SendToken.sol";
import {SendMerkleDrop} from "../src/SendMerkleDrop.sol";
import {Helper} from "../src/Helper.sol";

contract SendMerkleDropTest is Test, Helper {
    using stdStorage for StdStorage;

    address constant KNOWN_BOT = 0xae2Fc483527B8EF99EB5D9B44875F005ba1FaE13;
    uint256 constant INITIAL_MAX_BUY = 8000000;

    uint256 constant TRANCHE_ID = 3;
    uint256 constant TRANCHE_AMOUNT = 653359200;
    bytes32 constant TRANCHE_MERKLE_ROOT = 0x8f9787b27bc7ebe82a8ba2ebe0bd7a85a941c1ff90f1969e0d9ce7125b0cfbf8;

    SendToken private sendToken;
    SendMerkleDrop private sendMerkleDrop;

    function setUp() public {
        address[] memory knownBots = new address[](1);
        knownBots[0] = KNOWN_BOT;
        sendToken = new SendToken();
        sendMerkleDrop = new SendMerkleDrop(sendToken, address(this));

        assertEq(sendToken.balanceOf(address(this)), 100e9);

        sendToken.approve(address(sendMerkleDrop), TRANCHE_AMOUNT);
        sendMerkleDrop.addTranche(TRANCHE_MERKLE_ROOT, TRANCHE_AMOUNT);

        // Assertions
        bool isActive = sendMerkleDrop.trancheActive(TRANCHE_ID);
        assertEq(isActive, true);
        assertEq(sendMerkleDrop.trancheAmount(TRANCHE_ID), TRANCHE_AMOUNT);
    }

    function test_AllowSingleTrancheClaim() public {
        address bigboss = address(0x0030788CA58a0a5daC70941e76bA4ee604931bF1);
        uint256 bigbossBalance = sendToken.balanceOf(bigboss);
        uint256 index = 0;
        uint256 amount = 10102861;
        // generate the proofs using the gen-dist-merkle-tree script
        bytes32[] memory proof = new bytes32[](8);
        proof[0] = 0x003bcfb8884c6c8990f5b085f8bf440d9c0967b9f0a29f20da524af5f69d7d33;
        proof[1] = 0xfd50dacfd6b6eace3aa0ccc823ca3cdf4c7132ca93d677006de0c4c32e962917;
        proof[2] = 0xd8f1e18632df7acafcf711be752c49aa69ae3e8c70fd1fc7491af39593436c7f;
        proof[3] = 0xfc1df6463d5c4a081561bef68b4382af3667b61e12038957c82931ac7a09cb88;
        proof[4] = 0x1ee368f234902c55c5283a88b3c50a81e9d26f00a16d1ea4d07f3df77a86dcb9;
        proof[5] = 0x2c61a6d55e8c4312e200117f41b56518aa610691ebae575c63c968e9dbc18bd3;
        proof[6] = 0x68081526bcb95947a2ba9602dc549045ab06d44d7d3bcf9b86e3837e1eb605c7;
        proof[7] = 0x2b32968084bfa8fd05ac4b031bed577a33272cce7cd7c611efb36ca9ad09761e;
        sendMerkleDrop.claimTranche(bigboss, TRANCHE_ID, index, amount, proof);

        // Assertions
        assertEq(sendToken.balanceOf(bigboss), bigbossBalance + amount);
        assertEq(sendMerkleDrop.trancheAmountsClaimed(TRANCHE_ID), amount);
        assertTrue(sendMerkleDrop.isClaimed(TRANCHE_ID, index));
    }

    // test that another address cannot claim the same index
    function test_DenyDoubleClaim() public {
        address bob = address(0xb0b);
        uint256 bobBalance = sendToken.balanceOf(bob);
        uint256 index = 0;
        uint256 amount = 10102861;
        // generate the proofs using the gen-dist-merkle-tree script
        bytes32[] memory proof = new bytes32[](8);
        proof[0] = 0x003bcfb8884c6c8990f5b085f8bf440d9c0967b9f0a29f20da524af5f69d7d33;
        proof[1] = 0xfd50dacfd6b6eace3aa0ccc823ca3cdf4c7132ca93d677006de0c4c32e962917;
        proof[2] = 0xd8f1e18632df7acafcf711be752c49aa69ae3e8c70fd1fc7491af39593436c7f;
        proof[3] = 0xfc1df6463d5c4a081561bef68b4382af3667b61e12038957c82931ac7a09cb88;
        proof[4] = 0x1ee368f234902c55c5283a88b3c50a81e9d26f00a16d1ea4d07f3df77a86dcb9;
        proof[5] = 0x2c61a6d55e8c4312e200117f41b56518aa610691ebae575c63c968e9dbc18bd3;
        proof[6] = 0x68081526bcb95947a2ba9602dc549045ab06d44d7d3bcf9b86e3837e1eb605c7;
        proof[7] = 0x2b32968084bfa8fd05ac4b031bed577a33272cce7cd7c611efb36ca9ad09761e;

        vm.expectRevert("Incorrect merkle proof");
        sendMerkleDrop.claimTranche(bob, TRANCHE_ID, index, amount, proof);

        // Assertions
        assertEq(sendToken.balanceOf(bob), bobBalance);
        assertEq(sendMerkleDrop.trancheAmountsClaimed(TRANCHE_ID), 0);
        assertFalse(sendMerkleDrop.isClaimed(TRANCHE_ID, index));
    }
}
