// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import {Send} from "../src/Send.sol";
import {SendMerkleDrop} from "../src/SendMerkleDrop.sol";
import {Helper} from "../src/Helper.sol";

contract SendMerkleDropTest is Test, Helper {
    using stdStorage for StdStorage;

    address constant KNOWN_BOT = 0xae2Fc483527B8EF99EB5D9B44875F005ba1FaE13;
    uint256 constant INITIAL_MAX_BUY = 8000000;

    uint256 constant TRANCHE_ID = 0;
    uint256 constant TRANCHE_AMOUNT = 717100769;
    bytes32 constant TRANCHE_MERKLE_ROOT = 0x83c580aeb9546d9144688a39f479473fd7917b708b113bfbd4d62947d62cddff;

    Send private send;
    SendMerkleDrop private sendMerkleDrop;

    function setUp() public {
        address[] memory knownBots = new address[](1);
        knownBots[0] = KNOWN_BOT;
        // Mock deploy your Send and SendMerkleDrop contracts.
        send = new Send(address(this), address(this), knownBots, INITIAL_MAX_BUY);
        sendMerkleDrop = new SendMerkleDrop(send, address(this));

        assertEq(send.balanceOf(address(this)), 100e9);

        send.approve(address(sendMerkleDrop), TRANCHE_AMOUNT);
        sendMerkleDrop.addTranche(TRANCHE_MERKLE_ROOT, TRANCHE_AMOUNT);

        // Assertions
        bool isActive = sendMerkleDrop.trancheActive(TRANCHE_ID);
        assertEq(isActive, true);
        assertEq(sendMerkleDrop.trancheAmount(TRANCHE_ID), TRANCHE_AMOUNT);
    }

    function test_AllowSingleTrancheClaim() public {
        address bigboss = address(0x0030788CA58a0a5daC70941e76bA4ee604931bF1);
        uint256 bigbossBalance = send.balanceOf(bigboss);
        uint256 index = 0;
        uint256 amount = 11421439;
        // generate the proofs using the gen-dist-merkle-tree script
        bytes32[] memory proof = new bytes32[](7);
        proof[0] = 0x8e4ea2465c15936de72810a89c9825477ddbb9b93565873b6afc87a2a94e0fe6;
        proof[1] = 0x45d342c1ee8f321942beff416c0945379f4ae7fb64c1fb5645c90c0ae4322224;
        proof[2] = 0x1c9fb1a853cfa93da25a6980945ff521d40e865f342b5df5021ef65b66672b4c;
        proof[3] = 0x1eada9fa1540ef5d2dfbba4e94e8882bcac13123d2516852ae6a1a99ce5ff84c;
        proof[4] = 0x79ff636addc41224348bae38436b7b484b8dcfe54b3ae865c601999cc3b188d5;
        proof[5] = 0xea66a672c773444a372fb9b89a6a256b31fb0d7dc271e6cb594c195888e6cd6b;
        proof[6] = 0x4aef939204c522684697c0317ca1e827e1bddf5ad4cffa13b6eedb7e55148143;
        sendMerkleDrop.claimTranche(bigboss, TRANCHE_ID, index, amount, proof);

        // Assertions
        assertEq(send.balanceOf(bigboss), bigbossBalance + amount);
        assertEq(sendMerkleDrop.trancheAmountsClaimed(TRANCHE_ID), amount);
        assertTrue(sendMerkleDrop.isClaimed(TRANCHE_ID, index));
    }

    // test that another address cannot claim the same index
    function test_DenyDoubleClaim() public {
        address bigboss = address(0x0030788CA58a0a5daC70941e76bA4ee604931bF1);
        uint256 bigbossBalance = send.balanceOf(bigboss);
        uint256 index = 1;
        uint256 amount = 14972584;
        // generate the proofs using the gen-dist-merkle-tree script
        bytes32[] memory proof = new bytes32[](8);
        proof[0] = 0x03d88fec8b1056fd4eb1384ae5505e73250bddecc9a9dbd61f5b2cf9ac42c049;
        proof[1] = 0xfd2424551414aeb865e85349361abf14f16fbec611eed747359631b5f42edb69;
        proof[2] = 0x0391fe8fd2534af68338b5af7b7f8e03fb7be94627d31e7f69dac7c1d5b45621;
        proof[3] = 0xad2be0620d1c680bd92208c46cb0875b3d080575e19b17c6370b2727920cb13b;
        proof[4] = 0x9e5340ffe5feecf4d86d0b204f19dd8a261c763d7f3509a241fdee00dd49dc30;
        proof[5] = 0x57a52ff0954d0cc012de51afeb58dce9c110ed6ff29f59048442c6e272912517;
        proof[6] = 0x544f9a0045fc5c8375d40ef6669f1ae2304e37c9e9c757c8c27894bc64eb6f1e;
        proof[7] = 0x4a783893acb72cf2b44688b04943edfc0d4c24d42335bad39828b1ac982c57ab;

        vm.expectRevert("Incorrect merkle proof");
        sendMerkleDrop.claimTranche(bigboss, TRANCHE_ID, index, amount, proof);

        // Assertions
        assertEq(send.balanceOf(bigboss), bigbossBalance);
        assertEq(sendMerkleDrop.trancheAmountsClaimed(TRANCHE_ID), 0);
        assertFalse(sendMerkleDrop.isClaimed(TRANCHE_ID, index));
    }
}
