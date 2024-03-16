// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "../src/TokenPaymaster.sol";
import "account-abstraction/test/TestERC20.sol";
import "account-abstraction/test/TestUniswap.sol";
import "./TestOracle2.sol";
import "account-abstraction/test/TestWrappedNativeToken.sol";
import "account-abstraction/core/EntryPoint.sol";
import "forge-std/Test.sol";

struct SampleResponse {
    uint8 decimals;
    uint80 roundId;
    int256 answer;
    uint256 startedAt;
    uint256 updatedAt;
    uint80 answeredInRound;
}

contract OracleHelperTest is Test {
    EntryPoint entryPoint;
    TestUniswap uniswap;
    TokenPaymaster paymaster;
    TestERC20 token;
    TestWrappedNativeToken weth;
    TestOracle2 tokenOracle;
    TestOracle2 nativeAssetOracle;

    address payable beneficiary;
    address operator;
    uint256 userKey;

    /// @notice All 'price' variables are multiplied by this value to avoid rounding up
    uint256 private constant PRICE_DENOM = 1e26;

    TokenPaymasterConfig tpc = TokenPaymasterConfig({
        priceMaxAge: 86400,
        refundPostopCost: 40000,
        minEntryPointBalance: 0,
        priceMarkup: PRICE_DENOM * 19 / 10 // 190%
    });

    UniswapHelperConfig uhc = UniswapHelperConfig({minSwapAmount: 1, slippage: 5, uniswapPoolFee: 3});

    // LINK/USD
    SampleResponse linkUsd = SampleResponse({
        decimals: 8,
        roundId: 110680464442257310968,
        answer: 633170000, // Answer: $6.3090 - note: price is USD per LINK
        startedAt: 1684929731,
        updatedAt: 1684929731,
        answeredInRound: 110680464442257310968
    });

    // ETH/USD
    SampleResponse ethUsd = SampleResponse({
        decimals: 8,
        roundId: 110680464442257311466,
        answer: 181451000000, // Answer: $1,817.65 - USD per ETH
        startedAt: 1684929347,
        updatedAt: 1684929347,
        answeredInRound: 110680464442257311466
    });

    // LINK/ETH
    // the direct route may be better in some use-cases
    SampleResponse linkEth = SampleResponse({
        decimals: 18,
        roundId: 73786976294838213626,
        answer: 3492901256673149, // Answer: Ξ0.0034929013 - the answer is exact ETH.WEI per LINK
        startedAt: 1684924307,
        updatedAt: 1684924307,
        answeredInRound: 73786976294838213626
    });

    // ETH/BTC
    // considering BTC to be a token to test a reverse price feed logic with real data
    SampleResponse ethBtc = SampleResponse({
        decimals: 8,
        roundId: 18446744073709566497,
        answer: 6810994, // ₿0.06810994
        startedAt: 1684943615,
        updatedAt: 1684943615,
        answeredInRound: 18446744073709566497
    });

    function setUp() public {
        entryPoint = new EntryPoint();
        weth = new TestWrappedNativeToken();
        uniswap = new TestUniswap(weth);
        beneficiary = payable(makeAddr("beneficiary"));
        operator = makeAddr("operator");

        token = new TestERC20(6);

        // constructor args are meant to be overridden in tests
        nativeAssetOracle = new TestOracle2(1, 0);
        tokenOracle = new TestOracle2(1, 0);

        // default values meant to be overridden in tests
        OracleHelperConfig memory ohc = OracleHelperConfig({
            cacheTimeToLive: 0,
            maxOracleRoundAge: 0,
            nativeOracle: IOracle(address(0)),
            priceUpdateThreshold: 0,
            tokenOracle: IOracle(tokenOracle),
            nativeOracleReverse: false,
            tokenOracleReverse: false,
            tokenToNativeOracle: true
        });

        paymaster = new TokenPaymaster(
            token,
            entryPoint,
            TestWrappedNativeToken(payable(0)),
            ISwapRouter(operator), // cannot approve to zero address
            tpc,
            ohc,
            uhc,
            operator
        );

        vm.label(address(entryPoint), "entryPoint");
        vm.label(address(weth), "weth");
        vm.label(address(uniswap), "uniswap");
        vm.label(address(token), "token");
        vm.label(address(nativeAssetOracle), "nativeAssetOracle");
        vm.label(address(tokenOracle), "tokenOracle");
        vm.label(address(paymaster), "paymaster");
    }

    function testCannotDeployAsTokenToNativeOracleWithNonZeroAddress() external {
        OracleHelperConfig memory ohc = OracleHelperConfig({
            cacheTimeToLive: 0,
            maxOracleRoundAge: 0,
            nativeOracle: IOracle(nativeAssetOracle),
            priceUpdateThreshold: 0,
            tokenOracle: IOracle(tokenOracle),
            nativeOracleReverse: false,
            tokenOracleReverse: false,
            tokenToNativeOracle: true
        });

        vm.expectRevert("TPM: native oracle must be zero");
        new TokenPaymaster(
            token,
            entryPoint,
            TestWrappedNativeToken(payable(0)),
            ISwapRouter(operator), // cannot approve to zero address
            tpc,
            ohc,
            uhc,
            operator
        );
    }

    // with one-hop direct price ETH per TOKEN
    function testWithOneHopDirectPriceEthToToken() public {
        tokenOracle.setPrice(linkEth.answer); // 1 LINK = 0.0034929013 ETH
        tokenOracle.setDecimals(linkEth.decimals);

        // ensure native asset price is not used during calculation
        nativeAssetOracle.setPrice(type(int256).max);

        uint256 tokenOracleDecimalPower = 10 ** tokenOracle.decimals();
        uint256 expectedPrice = uint256(linkEth.answer) * PRICE_DENOM / tokenOracleDecimalPower;
        uint256 expectedTokensPerEth = 1 ether * tokenOracleDecimalPower / uint256(linkEth.answer);

        vm.startPrank(operator);
        OracleHelperConfig memory ohc = OracleHelperConfig({
            cacheTimeToLive: 0,
            maxOracleRoundAge: 0,
            nativeOracle: IOracle(address(0)),
            priceUpdateThreshold: 0,
            tokenOracle: IOracle(tokenOracle),
            nativeOracleReverse: false,
            tokenOracleReverse: false,
            tokenToNativeOracle: true
        });
        paymaster.setOracleConfiguration(ohc); // required to update oracle decimal powers
        paymaster.updateCachedPrice(true);
        vm.stopPrank();

        priceShouldMatch(expectedPrice, expectedTokensPerEth);
    }

    // with one-hop reverse price TOKEN per ETH
    function testWithOneHopReversePriceTokenToEth() public {
        tokenOracle.setPrice(ethBtc.answer); // 1 ETH = 0.06810994 BTC
        tokenOracle.setDecimals(ethBtc.decimals);

        // ensure native asset price is not used during calculation
        nativeAssetOracle.setPrice(type(int256).max);

        uint256 tokenOracleDecimalPower = 10 ** tokenOracle.decimals();
        uint256 expectedPrice = PRICE_DENOM * tokenOracleDecimalPower / uint256(ethBtc.answer);
        uint256 expectedTokensPerEth = 1 ether * uint256(ethBtc.answer) / tokenOracleDecimalPower;

        // sanity check direct price and cached-like reverse price
        assertEq(expectedTokensPerEth, 1 ether * PRICE_DENOM / expectedPrice, "sanity check");

        vm.startPrank(operator);
        OracleHelperConfig memory ohc = OracleHelperConfig({
            cacheTimeToLive: 0,
            maxOracleRoundAge: 0,
            nativeOracle: IOracle(address(0)),
            priceUpdateThreshold: 0,
            tokenOracle: IOracle(tokenOracle),
            tokenToNativeOracle: true,
            tokenOracleReverse: true,
            nativeOracleReverse: false
        });
        paymaster.setOracleConfiguration(ohc); // required to update oracle decimal powers
        paymaster.updateCachedPrice(true);
        vm.stopPrank();

        priceShouldMatch(expectedPrice, expectedTokensPerEth);
    }

    // with two-hops price USD-per-TOKEN and USD-per-ETH using LINK/USD and ETH/USD
    function testWithTwoHopPriceUsdToTokenAndUsdToEth() public {
        tokenOracle.setPrice(linkUsd.answer); // 1 LINK = $6.3090
        tokenOracle.setDecimals(linkUsd.decimals);
        nativeAssetOracle.setPrice(ethUsd.answer); // 1 ETH = $1,817.65
        nativeAssetOracle.setDecimals(ethUsd.decimals);

        uint256 tokenOracleDecimalPower = 10 ** tokenOracle.decimals();
        uint256 nativeOracleDecimalPower = 10 ** nativeAssetOracle.decimals();
        uint256 expectedPrice = PRICE_DENOM * (uint256(linkUsd.answer) * nativeOracleDecimalPower)
            / (uint256(ethUsd.answer) * tokenOracleDecimalPower);
        uint256 expectedTokensPerEth = 1 ether * PRICE_DENOM / expectedPrice;

        vm.startPrank(operator);
        OracleHelperConfig memory ohc = OracleHelperConfig({
            cacheTimeToLive: 0,
            maxOracleRoundAge: 0,
            nativeOracle: IOracle(nativeAssetOracle),
            priceUpdateThreshold: 0,
            tokenOracle: IOracle(tokenOracle),
            nativeOracleReverse: false,
            tokenOracleReverse: false,
            tokenToNativeOracle: false
        });
        paymaster.setOracleConfiguration(ohc); // required to update oracle decimal powers
        paymaster.updateCachedPrice(true);
        vm.stopPrank();

        priceShouldMatch(expectedPrice, expectedTokensPerEth);
    }

    function priceShouldMatch(uint256 expectedPrice, uint256 expectedTokensPerEth) internal {
        uint256 price = paymaster.cachedPrice();
        uint256 tokensPerEth = paymaster.weiToToken(1 ether, price);
        assertEq(price, expectedPrice, "price is not as expected");
        assertEq(tokensPerEth, expectedTokensPerEth, "tokens per eth is not as expected");
    }
}
