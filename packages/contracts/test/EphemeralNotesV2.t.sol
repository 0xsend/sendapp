// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import "../src/DaimoEphemeralNotesV2.sol";

contract TestDAI is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    // Exclude from forge coverage
    function test() public {}
}

contract EphemeralNotesV2Test is Test {
    TestDAI public token;
    DaimoEphemeralNotesV2 public notes;
    uint256 private constant ephemeralPrivateKey =
        0x1010101010101010101010101010101010101010101010101010101010101010;
    address private ephemeralAddress = vm.addr(ephemeralPrivateKey);
    address constant ALICE = address(0x123);
    address constant BOB = address(0x456);

    event NoteCreated(Note note);
    event NoteRedeemed(Note note, address redeemer);

    function setUp() public {
        token = new TestDAI("TestDAI", "DAI");
        notes = new DaimoEphemeralNotesV2(token);
    }

    // This is equivalent to what the users have to run on client side using ethers.js or equivalent
    function createEphemeralSignature(
        address redeemer
    ) internal pure returns (bytes memory) {
        bytes32 messageHash = ECDSA.toEthSignedMessageHash(
            keccak256(abi.encodePacked(redeemer))
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(
            ephemeralPrivateKey,
            messageHash
        );

        bytes memory signature = abi.encodePacked(r, s, v);
        return signature;
    }

    function testECDSA() public {
        bytes32 messageHash = ECDSA.toEthSignedMessageHash(
            keccak256(abi.encodePacked(ALICE))
        );
        assertTrue(
            ECDSA.recover(messageHash, createEphemeralSignature(ALICE)) ==
                ephemeralAddress
        );
    }

    function createAliceNote() internal {
        token.mint(ALICE, 1000);

        vm.startPrank(ALICE, ALICE);
        token.approve(address(notes), 501);
        vm.expectEmit(false, false, false, false);
        Note memory expectedNote = Note({
            ephemeralOwner: ephemeralAddress,
            from: ALICE,
            amount: 500
        });
        emit NoteCreated(expectedNote);
        notes.createNote(ephemeralAddress, 500);
        vm.stopPrank();
    }

    function testRegularFlow() public {
        // Alice approves token contract and creates a new note to ephemeralAddress
        createAliceNote();

        // Bob uses ephemeralAddress to sign his own address and redeem the note
        vm.startPrank(BOB, BOB);
        vm.expectEmit(false, false, false, false);
        Note memory expectedNote = Note({
            ephemeralOwner: ephemeralAddress,
            from: ALICE,
            amount: 500
        });
        emit NoteRedeemed(expectedNote, BOB);
        notes.claimNoteRecipient(
            ephemeralAddress,
            BOB,
            createEphemeralSignature(BOB)
        );
        vm.stopPrank();

        // Check transfer went through correctly
        assertEq(token.balanceOf(ALICE), 500);
        assertEq(token.balanceOf(BOB), 500);
        assertEq(token.balanceOf(address(notes)), 0);
    }

    function testWrongFlow() public {
        // Alice approves token contract and creates a new note to ephemeralAddress
        createAliceNote();

        // Bob uses ephemeralAddress to sign wrong address and redeem the note
        vm.startPrank(BOB, BOB);
        vm.expectRevert("EphemeralNotes: invalid signature");
        notes.claimNoteRecipient(
            ephemeralAddress,
            BOB,
            createEphemeralSignature(address(0x789))
        );
        vm.stopPrank();

        // Check transfer failed
        assertEq(token.balanceOf(ALICE), 500);
        assertEq(token.balanceOf(BOB), 0);
        assertEq(token.balanceOf(address(notes)), 500);
    }

    function testRevertFlow() public {
        // Alice approves token contract and creates a new note to ephemeralAddress
        createAliceNote();

        // Alice short circuits and reverts the note to herself
        // She does not need a valid signature from ephemeralAddress to do this
        vm.startPrank(ALICE, ALICE);
        notes.claimNoteSelf(ephemeralAddress);
        vm.stopPrank();

        // Check transfer went through correctly
        assertEq(token.balanceOf(ALICE), 1000);
        assertEq(token.balanceOf(address(notes)), 0);
    }

    function testWrongRevertFlow() public {
        // Alice approves token contract and creates a new note to ephemeralAddress
        createAliceNote();

        // Bob tries to short circuit and reverts the note to himself
        // He needs a valid signature from ephemeralAddress so it
        // should fail
        vm.startPrank(BOB, BOB);
        vm.expectRevert("EphemeralNotes: not note sender");
        notes.claimNoteSelf(ephemeralAddress);
        vm.stopPrank();

        // Check transfer failed
        assertEq(token.balanceOf(ALICE), 500);
        assertEq(token.balanceOf(BOB), 0);
        assertEq(token.balanceOf(address(notes)), 500);
    }
}
