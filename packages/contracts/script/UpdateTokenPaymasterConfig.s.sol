// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {Helper} from "../src/Helper.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "../src/TokenPaymaster.sol";

// solhint-disable no-console
contract UpdateTokenPaymasterConfigScript is Script, Helper {
    uint256 private constant PRICE_DENOM = 1e26;
    uint40 private constant BASE_FEE_DEFAULT = 5e4; // ¢5

    function setUp() public {
        this.labels();
    }

    function run() public {
        address addr = vm.envAddress("PAYMASTER");
        require(addr != address(0), "PAYMASTER env variable not set");

        TokenPaymaster paymaster = TokenPaymaster(payable(addr));
        (
            uint256 _priceMarkup,
            uint128 _minEntryPointBalance,
            uint48 _refundPostopCost,
            uint48 _priceMaxAge,
            uint40 _baseFee,
            address _rewardsPool
        ) = paymaster.tokenPaymasterConfig();

        console2.log("current priceMarkup", _priceMarkup);
        console2.log("current minEntryPointBalance", _minEntryPointBalance);
        console2.log("current refundPostopCost", _refundPostopCost);
        console2.log("current priceMaxAge", _priceMaxAge);
        console2.log("current baseFee", _baseFee);
        console2.log("current rewardsPool", _rewardsPool);

        uint256 priceMarkup = vm.envOr("PRICE_MARKUP", _priceMarkup);
        uint128 minEntryPointBalance = uint128(vm.envOr("MIN_ENTRY_POINT_BALANCE", _minEntryPointBalance));
        uint48 refundPostopCost = uint48(vm.envOr("REFUND_POSTOP_COST", _refundPostopCost));
        uint48 priceMaxAge = uint48(vm.envOr("PRICE_MAX_AGE", _priceMaxAge));
        uint40 baseFee = uint40(vm.envOr("BASE_FEE", _baseFee));
        bool baseFeeClear = vm.envOr("BASE_FEE_CLEAR", false);
        address rewardsPool = vm.envOr("REWARDS_POOL", _rewardsPool);

        if (baseFeeClear) {
            console2.log("Clearing baseFee", baseFeeClear);
            baseFee = 0;
        }

        require(
            priceMaxAge != _priceMaxAge || refundPostopCost != _refundPostopCost
                || minEntryPointBalance != _minEntryPointBalance || priceMarkup != _priceMarkup || baseFee != _baseFee
                || rewardsPool != _rewardsPool,
            "Configs are the same"
        );
        require(priceMaxAge > 0, "PRICE_MAX_AGE env variable not set");
        require(refundPostopCost > 0, "REFUND_POSTOP_COST env variable not set");
        require(minEntryPointBalance > 0, "MIN_ENTRY_POINT_BALANCE env variable not set");
        require(priceMarkup > 0, "PRICE_MARKUP env variable not set");
        // ensure base fee is greater than 0, clearing the fee, or we are not changing the fee
        require(baseFee > 0 || (baseFee == 0 && baseFeeClear) || baseFee == _baseFee, "BASE_FEE env variable not set");

        vm.startBroadcast();
        TokenPaymasterConfig memory tpc = TokenPaymasterConfig({
            priceMaxAge: priceMaxAge,
            refundPostopCost: refundPostopCost,
            minEntryPointBalance: minEntryPointBalance,
            priceMarkup: priceMarkup,
            baseFee: baseFee,
            rewardsPool: rewardsPool
        });
        paymaster.setTokenPaymasterConfig(tpc);
        vm.stopBroadcast();
    }
}
