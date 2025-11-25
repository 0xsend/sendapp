// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import "../src/TokenPaymaster.sol";
import "../src/utils/OracleHelper.sol";

/// @title Script to update TokenPaymaster oracle configuration
/// @notice Allows updating individual oracle config fields via environment variables
contract UpdateTokenPaymasterOracleScript is Script {
    function run() public {
        address paymasterAddr = vm.envAddress("PAYMASTER");
        require(paymasterAddr != address(0), "PAYMASTER env variable not set");

        // Required env vars - no defaults
        address tokenOracle = vm.envAddress("TOKEN_ORACLE");
        address nativeOracle = vm.envAddress("NATIVE_ORACLE");

        require(tokenOracle != address(0), "TOKEN_ORACLE env variable not set");
        require(nativeOracle != address(0), "NATIVE_ORACLE env variable not set");

        console2.log("New Oracle Configuration:");
        console2.log("  tokenOracle:", tokenOracle);
        console2.log("  nativeOracle:", nativeOracle);
        console2.log("  cacheTimeToLive:", vm.envOr("CACHE_TIME_TO_LIVE", uint256(3600)));
        console2.log("  maxOracleRoundAge:", vm.envOr("MAX_ORACLE_ROUND_AGE", uint256(86400)));

        // Build config struct directly from env vars
        OracleHelperConfig memory newConfig = OracleHelperConfig({
            cacheTimeToLive: uint48(vm.envOr("CACHE_TIME_TO_LIVE", uint256(3600))),
            maxOracleRoundAge: uint48(vm.envOr("MAX_ORACLE_ROUND_AGE", uint256(86400))),
            tokenOracle: IOracle(tokenOracle),
            nativeOracle: IOracle(nativeOracle),
            tokenToNativeOracle: vm.envOr("TOKEN_TO_NATIVE_ORACLE", false),
            tokenOracleReverse: vm.envOr("TOKEN_ORACLE_REVERSE", false),
            nativeOracleReverse: vm.envOr("NATIVE_ORACLE_REVERSE", false),
            priceUpdateThreshold: vm.envOr("PRICE_UPDATE_THRESHOLD", uint256(2e24))
        });

        vm.startBroadcast();
        TokenPaymaster(payable(paymasterAddr)).setOracleConfiguration(newConfig);
        console2.log("");
        console2.log("Oracle configuration updated");
        vm.stopBroadcast();
    }
}
