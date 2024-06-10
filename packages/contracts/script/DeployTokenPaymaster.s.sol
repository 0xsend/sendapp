// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "../src/TokenPaymaster.sol";

contract DeployTokenPaymasterScript is Script {
    uint256 private constant PRICE_DENOM = 1e26;
    uint40 private constant BASE_FEE_DEFAULT = 5e4; // ¢5

    function run() public {
        bytes32 salt = bytes32(uint256(1));

        address token = vm.envAddress("TOKEN");
        address entryPoint = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;
        address weth = vm.envAddress("WETH");
        address uniswap = vm.envAddress("UNISWAP_ROUTER");
        address tokenOracle = vm.envAddress("TOKEN_ORACLE");
        address nativeOracle = vm.envAddress("NATIVE_ORACLE");
        uint256 cacheTimeToLive = vm.envOr("CACHE_TIME_TO_LIVE", uint256(3600));

        require(token != address(0), "TOKEN env variable not set");
        require(weth != address(0), "WETH env variable not set");
        require(uniswap != address(0), "UNISWAP_ROUTER env variable not set");
        require(tokenOracle != address(0), "TOKEN_ORACLE env variable not set");
        require(nativeOracle != address(0), "NATIVE_ORACLE env variable not set");

        TokenPaymasterConfig memory tpc = TokenPaymasterConfig({
            priceMaxAge: 86400,
            refundPostopCost: 40000,
            minEntryPointBalance: 1000 gwei,
            priceMarkup: PRICE_DENOM * 15 / 10, // 50%,
            baseFee: BASE_FEE_DEFAULT,
            rewardsPool: address(0x71fa02bb11e4b119bEDbeeD2f119F62048245301) // Send Revenues Safe
        });

        OracleHelperConfig memory ohc = OracleHelperConfig({
            cacheTimeToLive: uint48(cacheTimeToLive), // 1 hour
            maxOracleRoundAge: 86400, // 1 day
            nativeOracle: IOracle(nativeOracle),
            priceUpdateThreshold: PRICE_DENOM * 12 / 100, // 20%
            tokenOracle: IOracle(tokenOracle),
            nativeOracleReverse: false,
            tokenOracleReverse: false,
            tokenToNativeOracle: false
        });

        UniswapHelperConfig memory uhc = UniswapHelperConfig({minSwapAmount: 1, slippage: 5, uniswapPoolFee: 500});
        vm.startBroadcast();

        TokenPaymaster paymaster = new TokenPaymaster{salt: salt}(
            IERC20Metadata(token),
            IEntryPoint(entryPoint),
            IERC20(weth),
            ISwapRouter(uniswap),
            tpc,
            ohc,
            uhc,
            msg.sender
        );

        // solhint-disable-next-line no-console
        console2.log("Deployed TokenPaymaster at address: ", address(paymaster));

        IEntryPoint(entryPoint).depositTo{value: 0.25 ether}(address(paymaster));
        paymaster.addStake{value: 0.25 ether}(1);
        vm.stopBroadcast();
    }
}
