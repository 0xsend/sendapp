// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SendRouter} from "../src/SendSwap/SendRouter.sol";
import {SendSwap} from "../src/SendSwap/SendSwap.sol";
import {SendRewards} from "../src/SendSwap/SendRewards.sol";
import {SendSwapLibrary} from "../src/SendSwap/SendSwapLibrary.sol";
import {TransparentUpgradeableProxy} from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import {ProxyAdmin} from "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract DeploySendSwapScript is Script {
    address private constant WETH = 0x4200000000000000000000000000000000000006;
    address private constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address private constant SEND = 0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A;
    address private constant FEE_TO = 0x0000000000000000000000000000000000000000;
    uint256 private constant PROTOCOL_FEE = 0;
    uint256 private constant POINTS_PER_BLOCK = 1;
    uint256 private constant END_BLOCK = 20922565;
    address private constant MIGRATOR = 0x0000000000000000000000000000000000000000;

    function setUp() public {
        // Setup code if needed
    }

    function run() public {
        // address deployerAddress = vm.envAddress("DEPLOYER_ADDRESS");
        // uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        uint256 deployerKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        vm.startBroadcast(deployerKey);

        // Deploy ProxyAdmin

        // Deploy ProxyAdmin
        ProxyAdmin proxyAdmin = new ProxyAdmin(deployerAddress);
        console2.log("Deployed ProxyAdmin at address: ", address(proxyAdmin));

        // Deploy SendSwapLibrary
        // SendSwapLibrary sendSwapLib = new SendSwapLibrary();
        // console2.log("Deployed SendSwapLibrary at address: ", address(sendSwapLib));

        // Deploy SendSwap for SEND/WETH
        SendSwap sendSwapWETHImpl = new SendSwap();
        TransparentUpgradeableProxy sendSwapWETHProxy = new TransparentUpgradeableProxy(
            address(sendSwapWETHImpl),
            address(proxyAdmin),
            abi.encodeWithSelector(SendSwap.initialize.selector, 'SendSwap WETH', SEND, WETH)
        );
        SendSwap sendSwapWETH = SendSwap(payable(address(sendSwapWETHProxy)));
        console2.log("Deployed SendSwap (SEND/WETH) at address: ", address(sendSwapWETH));

        // Deploy SendRouter for SEND/WETH
        SendRouter sendRouterWETHImpl = new SendRouter();
        TransparentUpgradeableProxy sendRouterWETHProxy = new TransparentUpgradeableProxy(
            address(sendRouterWETHImpl),
            address(proxyAdmin),
            abi.encodeWithSelector(SendRouter.initialize.selector, address(sendSwapWETH), FEE_TO, PROTOCOL_FEE, WETH)
        );
        SendRouter sendRouterWETH = SendRouter(payable(address(sendRouterWETHProxy)));
        console2.log("Deployed SendRouter (SEND/WETH) at address: ", address(sendRouterWETH));

        // Deploy SendFriend for SEND/WETH
        SendRewards sendRewardsWETHImpl = new SendRewards();
        TransparentUpgradeableProxy sendRewardsWETHProxy = new TransparentUpgradeableProxy(
            address(sendRewardsWETHImpl),
            address(proxyAdmin),
            abi.encodeWithSelector(SendRewards.initialize.selector, 
                address(sendSwapWETH), 
                0, // lastRewardBlock
                0, // bonusPointsAccrued
                0, // bonusPointsDistributed
                0, // accpointsPerShare
                MIGRATOR,
                POINTS_PER_BLOCK,
                END_BLOCK,
                address(sendRouterWETH),
                SEND
            )
        );
        SendRewards sendRewardsWETH = SendRewards(payable(address(sendRewardsWETHProxy)));
        console2.log("Deployed SendRewards (SEND/WETH) at address: ", address(sendRewardsWETH));

        // Initialize SendRewards in SendRouter
        sendRouterWETH.initRewards(sendRewardsWETH);
        
        console2.log("Initialized SendRewards in SendRouter");

        // Authorize the router
        sendSwapWETH.toggleRouterAuthorization(address(sendRouterWETH), true);
        console2.log("Authorized SendRouter in SendSwap");

        // Add initial liquidity
        // uint256 initialLiquidityAmountSend = 10000 * 10**18;
        // uint256 initialLiquidityAmountWETH = 1 * 10**18;
        // sendRouterWETH.addLiquidity(
        //     initialLiquidityAmountSend,
        //     initialLiquidityAmountWETH,
        //     initialLiquidityAmountSend * 95 / 100,
        //     initialLiquidityAmountWETH * 95 / 100,
        //     address(this),
        //     block.timestamp + 1000 * 60 * 10
        // );
        // console2.log("Added initial liquidity to SendRouter");

        // Deposit reward tokens
        // IERC20(SEND).approve(address(sendRewardsWETH), type(uint256).max);
        // sendRewardsWETH.depositRewardTokens(200000 * 10**18);
        // console2.log("Deposited reward tokens to SendRewards");

        vm.stopBroadcast();
    }
}