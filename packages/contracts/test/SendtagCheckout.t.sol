// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.23;

import {Test} from "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {SendtagCheckout} from "../src/SendtagCheckout.sol";

contract Tendies is ERC20 {
    constructor() ERC20("TENDIES", "TENDIES") {}

    function mint(uint256 amount) public {
        _mint(msg.sender, amount);
    }
}

contract SendtagCheckoutTest is Test {
    SendtagCheckout checkout;
    Tendies token;
    address owner;
    address multisig;

    function setUp() public {
        token = new Tendies();
        multisig = address(0x1337);
        owner = address(0xB055);
        vm.startPrank(owner);
        checkout = new SendtagCheckout(multisig, token);
        vm.stopPrank();
    }

    /// @notice Test the checkout function with no referrer.
    /// Bob wants a sendtag, he just found send.app and wants to send some money
    function testFuzzCheckoutNoReferrer(uint256 amount) public {
        vm.assume(amount > 0);
        address sender = address(0xb0b);
        vm.startPrank(sender);
        token.mint(amount);
        token.approve(address(checkout), amount);
        checkout.checkout(amount, address(0), 0);
        vm.stopPrank();
        assertEq(token.balanceOf(multisig), amount);
        assertEq(token.balanceOf(sender), 0);
        assertEq(token.balanceOf(address(0)), 0);
    }

    /// @notice Test the checkout function with a referrer.
    /// Bob wants a sendtag, he just found send.app because of his friend Alice and uses her referral code
    function testFuzzCheckoutReferrer(uint256 amount, uint256 rewards) public {
        vm.assume(amount > 0);
        vm.assume(rewards <= amount);
        address sender = address(0xb0b);
        address referrer = address(0xa71ce);
        vm.startPrank(sender);
        token.mint(amount);
        token.approve(address(checkout), amount);
        if (rewards > 0) {
            vm.expectEmit(true, true, true, true);
            emit SendtagCheckout.ReferralReward(referrer, sender, rewards);
        }
        checkout.checkout(amount, referrer, rewards);
        vm.stopPrank();
        assertEq(token.balanceOf(multisig), amount - rewards);
        assertEq(token.balanceOf(sender), 0);
        assertEq(token.balanceOf(referrer), rewards);
    }

    /// @notice Test the checkout function with a rewards and invalid referrer.
    function testCheckoutInvalidReferrer(uint256 amount, uint256 rewards) public {
        vm.assume(amount > 0);
        vm.assume(rewards > 0);
        vm.assume(rewards <= amount);
        address sender = address(0xb0b);
        vm.startPrank(sender);
        token.mint(amount);
        token.approve(address(checkout), amount);
        vm.expectRevert("Invalid referrer address");
        checkout.checkout(amount, address(0), rewards);
        vm.stopPrank();
    }

    /// @notice Test the toggle function.
    function testToggle() public {
        assertTrue(checkout.open());
        vm.startPrank(owner);
        checkout.toggle();
        vm.stopPrank();
        assertFalse(checkout.open());

        // cannot checkout now
        address sender = address(0xb0b);
        vm.startPrank(sender);
        uint256 amount = 100;
        token.mint(amount);
        token.approve(address(checkout), amount);
        vm.expectRevert("Closed");
        checkout.checkout(amount, address(0), 0);
        vm.stopPrank();

        // non-owners cannot toggle
        vm.startPrank(address(0x1337));
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, address(0x1337)));
        checkout.toggle();
        vm.stopPrank();

        // can turn back on
        vm.startPrank(owner);
        checkout.toggle();
        vm.stopPrank();
        assertTrue(checkout.open());

        // can checkout again
        vm.startPrank(sender);
        checkout.checkout(amount, address(0), 0);
        vm.stopPrank();
    }

    function testWithdrawToken() public {
        uint256 amount = 100;
        vm.startPrank(address(0xb0b));
        token.mint(amount);
        token.transfer(address(checkout), amount);
        vm.stopPrank();

        assertEq(token.balanceOf(address(checkout)), amount);

        vm.prank(owner);
        checkout.withdrawToken(token, amount);

        assertEq(token.balanceOf(address(checkout)), 0);
        assertEq(token.balanceOf(owner), amount);
    }

    function testWithdrawTokenUnauthorized() public {
        uint256 amount = 100;
        vm.startPrank(address(0xb0b));
        token.mint(amount);
        token.transfer(address(checkout), amount);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, address(0xb0b)));
        checkout.withdrawToken(token, amount);
        vm.stopPrank();
    }

    function testWithdrawETH() public {
        uint256 amount = 1 ether;
        vm.deal(address(checkout), amount);

        assertEq(address(checkout).balance, amount);

        vm.prank(owner);
        checkout.withdrawETH();

        assertEq(address(checkout).balance, 0);
        assertEq(owner.balance, amount);
    }

    function testWithdrawETHUnauthorized() public {
        uint256 amount = 1 ether;
        vm.deal(address(checkout), amount);

        vm.prank(address(0xb0b));
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, address(0xb0b)));
        checkout.withdrawETH();
    }

    function testWithdrawDifferentToken() public {
        Tendies differentToken = new Tendies();
        uint256 amount = 100;

        vm.startPrank(address(0xb0b));
        differentToken.mint(amount);
        differentToken.transfer(address(checkout), amount);
        vm.stopPrank();

        assertEq(differentToken.balanceOf(address(checkout)), amount);

        vm.prank(owner);
        checkout.withdrawToken(IERC20(address(differentToken)), amount);

        assertEq(differentToken.balanceOf(address(checkout)), 0);
        assertEq(differentToken.balanceOf(owner), amount);
    }
}
