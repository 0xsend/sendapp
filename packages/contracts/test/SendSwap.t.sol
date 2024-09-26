// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../script/DeploySendSwap.s.sol";
import "../src/SendSwap/SendRouter.sol";
import "../src/SendSwap/SendSwap.sol";
import "../src/SendSwap/SendRewards.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SendSwapTest is Test, DeploySendSwapScript {
    function setUp() external {
        // Call the run function from the deployment script to deploy contracts
        run();
    }

    function testAddLiquidity() external {
        uint256 initialLiquidityAmountSend = 10000 * 10**18;
        uint256 initialLiquidityAmountWETH = 1 * 10**18;

        // Add initial liquidity
        sendRouterWETH.addLiquidity(
            initialLiquidityAmountSend,
            initialLiquidityAmountWETH,
            initialLiquidityAmountSend * 95 / 100,
            initialLiquidityAmountWETH * 95 / 100,
            address(this),
            block.timestamp + 1000 * 60 * 10
        );

        // Check liquidity added
        (uint256 reserveSend, uint256 reserveWETH) = sendSwapWETH.getReserves();
        assertEq(reserveSend, initialLiquidityAmountSend);
        assertEq(reserveWETH, initialLiquidityAmountWETH);
    }

    function testDepositRewardTokens() external {
        uint256 rewardAmount = 200000 * 10**18;

        // Deposit reward tokens
        IERC20(SEND).approve(address(sendRewardsWETH), type(uint256).max);
        sendRewardsWETH.depositRewardTokens(rewardAmount);

        // Check reward tokens deposited
        uint256 depositedRewards = sendRewardsWETH.totalRewardTokens();
        assertEq(depositedRewards, rewardAmount);
    }
}