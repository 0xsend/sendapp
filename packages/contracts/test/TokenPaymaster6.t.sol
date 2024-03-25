// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "../src/TokenPaymaster.sol";
import "account-abstraction/test/TestERC20.sol";
import "account-abstraction/test/TestUniswap.sol";
import "./TestOracle2.sol";
import "account-abstraction/test/TestWrappedNativeToken.sol";
import "account-abstraction/test/TestCounter.sol";
import "account-abstraction/core/EntryPoint.sol";
import "account-abstraction/core/EntryPointSimulations.sol";
import "account-abstraction/samples/SimpleAccountFactory.sol";
import "forge-std/Test.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

using ECDSA for bytes32;

import "./BytesLib.sol";

/// @title TokenPaymaster6Test
/// @notice This contract is used to test the TokenPaymaster contract.
/// It allows users to pay for gas fees using a 6 decimal token, TOK. The prices are calculated using two oracles,
/// one for the token and one for the native asset with USD as the bridging asset. The paymaster also uses Uniswap
/// to swap the native asset for the token and increase the paymaster's entry point deposit balance falls below a
/// certain threshold.
contract TokenPaymaster6Test is Test {
    EntryPoint entryPoint;
    EntryPointSimulations epSim;
    SimpleAccountFactory factory;
    TestUniswap uniswap;
    TokenPaymaster paymaster;
    TestERC20 token;
    TestWrappedNativeToken weth;
    TestOracle2 tokenOracle;
    TestOracle2 nativeAssetOracle;
    TestCounter counter;

    address payable beneficiary;
    address operator;
    address user;
    uint256 userKey;
    SimpleAccount account;

    uint128 minEntryPointBalance = 1e17;
    int256 initialTokenPrice = 100000000; // USD per TOK
    int256 initialNativeAssetPrice = 500000000; // USD per ETH
    /// @notice All 'price' variables are multiplied by this value to avoid rounding up
    uint256 private constant PRICE_DENOM = 1e26;

    uint40 private constant BASE_FEE_DEFAULT = 5e4; // ¢5

    function setUp() external {
        entryPoint = new EntryPoint();
        epSim = new EntryPointSimulations();
        weth = new TestWrappedNativeToken();
        uniswap = new TestUniswap(weth);
        factory = new SimpleAccountFactory(entryPoint);
        beneficiary = payable(makeAddr("beneficiary"));
        operator = makeAddr("operator");
        (user, userKey) = makeAddrAndKey("user");
        account = factory.createAccount(user, 0);
        token = new TestERC20(6);
        nativeAssetOracle = new TestOracle2(initialNativeAssetPrice, 8, "ETH/USD", operator);
        tokenOracle = new TestOracle2(initialTokenPrice, 8, "TOK/USD", operator);

        TokenPaymasterConfig memory tpc = TokenPaymasterConfig({
            priceMaxAge: 86400,
            refundPostopCost: 40000,
            minEntryPointBalance: minEntryPointBalance,
            priceMarkup: PRICE_DENOM * 15 / 10, // 50%,
            baseFee: BASE_FEE_DEFAULT
        });

        RewardsConfig memory rc = RewardsConfig({rewardsShare: 0, rewardsPool: address(0)});

        OracleHelperConfig memory ohc = OracleHelperConfig({
            cacheTimeToLive: 0,
            maxOracleRoundAge: 0,
            nativeOracle: IOracle(nativeAssetOracle),
            nativeOracleReverse: false,
            priceUpdateThreshold: PRICE_DENOM * 12 / 100, // 20%
            tokenOracle: IOracle(tokenOracle),
            tokenOracleReverse: false,
            tokenToNativeOracle: false
        });

        UniswapHelperConfig memory uhc = UniswapHelperConfig({minSwapAmount: 1, slippage: 5, uniswapPoolFee: 3});

        paymaster =
            new TokenPaymaster(token, entryPoint, weth, ISwapRouter(address(uniswap)), tpc, rc, ohc, uhc, operator);

        vm.label(address(entryPoint), "entryPoint");
        vm.label(address(epSim), "epSim");
        vm.label(address(weth), "weth");
        vm.label(address(uniswap), "uniswap");
        vm.label(address(factory), "factory");
        vm.label(address(account), "account");
        vm.label(address(token), "token");
        vm.label(address(nativeAssetOracle), "nativeAssetOracle");
        vm.label(address(tokenOracle), "tokenOracle");
        vm.label(address(paymaster), "paymaster");

        vm.deal(address(account), 1e18);
        vm.deal(operator, 1000e18);
        vm.startPrank(operator);
        weth.deposit{value: 1e18}();
        weth.transfer(address(uniswap), 1e18);
        entryPoint.depositTo{value: 100e18}(address(paymaster));
        paymaster.addStake{value: 100e18}(1);
        vm.stopPrank();
    }

    function testDeploy() external {
        (
            uint256 priceMarkup,
            uint128 _minEntryPointBalance,
            uint48 refundPostopCost,
            uint48 priceMaxAge,
            uint256 baseFee
        ) = paymaster.tokenPaymasterConfig();
        assertEq(priceMaxAge, 86400);
        assertEq(refundPostopCost, 40000);
        assertEq(_minEntryPointBalance, minEntryPointBalance);
        assertEq(priceMarkup, PRICE_DENOM * 15 / 10);
        assertEq(baseFee, BASE_FEE_DEFAULT);
    }

    function testOwnershipTransfer() external {
        vm.startPrank(operator);
        assertEq(paymaster.owner(), operator);
        paymaster.transferOwnership(beneficiary);
        assertEq(paymaster.owner(), beneficiary);
        vm.stopPrank();
    }

    function testInvalidDataLength() external {
        PackedUserOperation memory op =
            fillUserOp(account, userKey, address(counter), 0, abi.encodeWithSelector(TestCounter.count.selector));
        op.paymasterAndData = abi.encodePacked(address(paymaster), uint128(300000), uint128(300000), bytes16(0));
        op.signature = signUserOp(op, userKey);
        bytes4 errorSelector = bytes4(keccak256(bytes("Error(string)")));
        bytes memory revertReason = abi.encodeWithSelector(errorSelector, "TPM: invalid data length");
        vm.expectRevert(
            abi.encodeWithSelector(IEntryPoint.FailedOpWithRevert.selector, uint256(0), "AA33 reverted", revertReason)
        );
        submitUserOp(op);
    }

    function testFuzz_UpdateTokenPaymasterConfigSuccess(
        uint256 _priceMarkup,
        uint128 _minEntryPointBalance,
        uint48 _refundPostopCost,
        uint48 _priceMaxAge,
        uint40 _baseFee
    ) external {
        vm.assume(_priceMarkup <= 2 * PRICE_DENOM); // TPM: price markup too high
        vm.assume(_priceMarkup >= PRICE_DENOM); // TPM: price markup too low"
        TokenPaymasterConfig memory tcp = TokenPaymasterConfig({
            priceMaxAge: _priceMaxAge,
            refundPostopCost: _refundPostopCost,
            minEntryPointBalance: _minEntryPointBalance,
            priceMarkup: _priceMarkup,
            baseFee: _baseFee
        });
        vm.startPrank(operator);
        paymaster.setTokenPaymasterConfig(tcp);
        (
            uint256 priceMarkup,
            uint128 __minEntryPointBalance,
            uint48 refundPostopCost,
            uint48 priceMaxAge,
            uint256 baseFee
        ) = paymaster.tokenPaymasterConfig();
        vm.stopPrank();
        assertEq(priceMaxAge, tcp.priceMaxAge);
        assertEq(refundPostopCost, tcp.refundPostopCost);
        assertEq(__minEntryPointBalance, tcp.minEntryPointBalance);
        assertEq(priceMarkup, tcp.priceMarkup);
        assertEq(baseFee, tcp.baseFee);
    }

    function testFuzz_UpdateTokenPaymasterConfigFailMarkupTooLow(uint256 _priceMarkup, uint40 _baseFee) external {
        _priceMarkup = uint256(bound(_priceMarkup, 1, PRICE_DENOM - 1)); // 0% - 100%
        TokenPaymasterConfig memory tcp = TokenPaymasterConfig({
            priceMaxAge: 86400,
            refundPostopCost: 40000,
            minEntryPointBalance: minEntryPointBalance,
            priceMarkup: _priceMarkup,
            baseFee: _baseFee
        });
        vm.startPrank(operator);
        vm.expectRevert("TPM: price markup too low");
        paymaster.setTokenPaymasterConfig(tcp);
        vm.stopPrank();
    }

    function testFuzz_UpdateTokenPaymasterConfigFailMarkupTooHigh(uint256 _priceMarkup, uint40 _baseFee) external {
        _priceMarkup = uint256(bound(_priceMarkup, PRICE_DENOM * 2 + 1, type(uint256).max)); // 100% - 200%
        TokenPaymasterConfig memory tcp = TokenPaymasterConfig({
            priceMaxAge: 86400,
            refundPostopCost: 40000,
            minEntryPointBalance: minEntryPointBalance,
            priceMarkup: _priceMarkup,
            baseFee: _baseFee
        });
        vm.startPrank(operator);
        vm.expectRevert("TPM: price markup too high");
        paymaster.setTokenPaymasterConfig(tcp);
        vm.stopPrank();
    }

    function testFuzz_UpdateOracleConfigSuccess(
        uint48 _cacheTimeToLive,
        uint48 _maxOracleRoundAge,
        uint256 _priceUpdateThreshold
    ) external {
        vm.assume(_priceUpdateThreshold <= PRICE_DENOM); // TPM: update threshold too high
        OracleHelperConfig memory ohc = OracleHelperConfig({
            cacheTimeToLive: _cacheTimeToLive,
            maxOracleRoundAge: _maxOracleRoundAge,
            nativeOracle: IOracle(nativeAssetOracle),
            nativeOracleReverse: false,
            priceUpdateThreshold: _priceUpdateThreshold,
            tokenOracle: IOracle(tokenOracle),
            tokenOracleReverse: false,
            tokenToNativeOracle: false
        });
        vm.startPrank(operator);
        paymaster.setOracleConfiguration(ohc);
        (uint48 cacheTimeToLive, uint48 maxOracleRoundAge,,,,,, uint256 priceUpdateThreshold) =
            paymaster.oracleHelperConfig();
        vm.stopPrank();
        assertEq(cacheTimeToLive, ohc.cacheTimeToLive);
        assertEq(maxOracleRoundAge, ohc.maxOracleRoundAge);
        assertEq(priceUpdateThreshold, ohc.priceUpdateThreshold);
    }

    function testFuzz_UpdateUniswapConfigSuccess(uint256 _minSwapAmount, uint24 _uniswapPoolFee, uint8 _slippage)
        external
    {
        UniswapHelperConfig memory uc =
            UniswapHelperConfig({minSwapAmount: _minSwapAmount, uniswapPoolFee: _uniswapPoolFee, slippage: _slippage});
        vm.startPrank(operator);
        paymaster.setUniswapConfiguration(uc);
        (uint256 minSwapAmount, uint24 uniswapPoolFee, uint8 slippage) = paymaster.uniswapHelperConfig();
        vm.stopPrank();
        assertEq(minSwapAmount, uc.minSwapAmount);
        assertEq(slippage, uc.slippage);
        assertEq(uniswapPoolFee, uc.uniswapPoolFee);
    }

    function testOnlyOwnerCanUpdateTokenPaymasterConfig() external {
        TokenPaymasterConfig memory tcp = TokenPaymasterConfig({
            priceMaxAge: 86400,
            refundPostopCost: 40000,
            minEntryPointBalance: minEntryPointBalance,
            priceMarkup: PRICE_DENOM * 15 / 10,
            baseFee: BASE_FEE_DEFAULT
        });
        vm.startPrank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        paymaster.setTokenPaymasterConfig(tcp);
        vm.stopPrank();
    }

    function testOnlyOwnerCanUpdateOracleConfig() external {
        OracleHelperConfig memory ohc = OracleHelperConfig({
            cacheTimeToLive: 0,
            maxOracleRoundAge: 0,
            nativeOracle: IOracle(nativeAssetOracle),
            nativeOracleReverse: false,
            priceUpdateThreshold: PRICE_DENOM * 12 / 100, // 20%
            tokenOracle: IOracle(tokenOracle),
            tokenOracleReverse: false,
            tokenToNativeOracle: false
        });
        vm.startPrank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        paymaster.setOracleConfiguration(ohc);
        vm.stopPrank();
    }

    function testOnlyOwnerCanUpdateUniswapConfig() external {
        UniswapHelperConfig memory uc = UniswapHelperConfig({minSwapAmount: 1, uniswapPoolFee: 3, slippage: 5});
        vm.startPrank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        paymaster.setUniswapConfiguration(uc);
        vm.stopPrank();
    }

    function testUpdateRewardsConfig() external {
        address _rewardsPool = makeAddr("rewardsPool");
        RewardsConfig memory rc = RewardsConfig({
            rewardsShare: 50, // 000.05%
            rewardsPool: _rewardsPool
        });
        vm.startPrank(operator);
        paymaster.setRewardsConfig(rc);
        (uint256 rewardsShare, address rewardsPool) = paymaster.rewardsConfig();
        vm.stopPrank();
        assertEq(rewardsShare, rc.rewardsShare);
        assertEq(_rewardsPool, rewardsPool);
    }

    function testFuzzUpdateRewardsConfig(uint16 _rewardsShare, address _rewardsPool) external {
        vm.assume(_rewardsShare <= 10000);
        vm.assume(_rewardsPool != address(0));
        RewardsConfig memory rc = RewardsConfig({rewardsShare: _rewardsShare, rewardsPool: _rewardsPool});
        vm.startPrank(operator);
        paymaster.setRewardsConfig(rc);
        (uint256 rewardsShare, address rewardsPool) = paymaster.rewardsConfig();
        vm.stopPrank();
        assertEq(rewardsShare, rc.rewardsShare);
        assertEq(_rewardsPool, rewardsPool);
    }

    function testOnlyOwnerCanUpdateRewardsConfig() external {
        RewardsConfig memory rc = RewardsConfig({rewardsShare: 50, rewardsPool: makeAddr("rewardsPool")});
        vm.startPrank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        paymaster.setRewardsConfig(rc);
        vm.stopPrank();
    }

    function testUpdateRewardsConfigInvalidPool() external {
        RewardsConfig memory rc = RewardsConfig({rewardsShare: 50, rewardsPool: address(0)});
        vm.startPrank(operator);
        vm.expectRevert("TPM: invalid rewards pool");
        paymaster.setRewardsConfig(rc);
        vm.stopPrank();
    }

    function testRewardShareTooHigh() external {
        RewardsConfig memory rc = RewardsConfig({rewardsShare: 10001, rewardsPool: makeAddr("rewardsPool")});
        vm.startPrank(operator);
        vm.expectRevert("TPM: invalid rewards share percentage");
        paymaster.setRewardsConfig(rc);
        vm.stopPrank();
    }

    function testRewardShareTransfersCorrectAmount() external {
        address _rewardsPool = makeAddr("rewardsPool");
        RewardsConfig memory rc = RewardsConfig({
            rewardsShare: 3300, // 33% of base fee
            rewardsPool: _rewardsPool
        });
        vm.startPrank(operator);
        paymaster.setRewardsConfig(rc);
        vm.stopPrank();

        token.sudoMint(address(account), 2e18);
        token.sudoApprove(address(account), address(paymaster), 2e18);
        PackedUserOperation memory op =
            fillUserOp(account, userKey, address(counter), 0, abi.encodeWithSelector(TestCounter.count.selector));
        op.paymasterAndData = abi.encodePacked(address(paymaster), uint128(300000), uint128(300000));
        op.signature = signUserOp(op, userKey);

        uint256 maxFeePerGas = UserOperationLib.unpackLow128(op.gasFees);
        vm.fee(maxFeePerGas);
        vm.txGasPrice(maxFeePerGas);
        vm.recordLogs();
        submitUserOp(op);
        Vm.Log[] memory entries = vm.getRecordedLogs();
        assertEq(entries.length, 6, "entries.length != 6");
        // assert reward pool received correct amount of base fee
        assertEq(token.balanceOf(_rewardsPool), 16500); // 33% of 50000
    }

    function testFuzzRewardShareTransfersCorrectAmount(uint40 _baseFee, uint16 _rewardsShare, uint256 _bal) external {
        vm.assume(_rewardsShare <= 10000);
        _bal = bound(_bal, 1e18, token.totalSupply());
        vm.assume(_bal > _baseFee);
        address _rewardsPool = makeAddr("rewardsPool");
        RewardsConfig memory rc = RewardsConfig({rewardsShare: _rewardsShare, rewardsPool: _rewardsPool});
        TokenPaymasterConfig memory tpc = TokenPaymasterConfig({
            priceMaxAge: 86400,
            refundPostopCost: 40000,
            minEntryPointBalance: minEntryPointBalance,
            priceMarkup: PRICE_DENOM * 15 / 10,
            baseFee: _baseFee
        });
        vm.startPrank(operator);
        paymaster.setTokenPaymasterConfig(tpc);
        paymaster.setRewardsConfig(rc);
        vm.stopPrank();

        // ensure account has enough tokens and allowance for user op and base fee
        token.sudoMint(address(account), _bal);
        token.sudoApprove(address(account), address(paymaster), _bal);
        PackedUserOperation memory op =
            fillUserOp(account, userKey, address(counter), 0, abi.encodeWithSelector(TestCounter.count.selector));
        op.paymasterAndData = abi.encodePacked(address(paymaster), uint128(300000), uint128(300000));
        op.signature = signUserOp(op, userKey);

        uint256 maxFeePerGas = UserOperationLib.unpackLow128(op.gasFees);
        vm.fee(maxFeePerGas);
        vm.txGasPrice(maxFeePerGas);
        vm.recordLogs();
        submitUserOp(op);
        // assert reward pool received correct amount of base fee
        assertEq(token.balanceOf(_rewardsPool), _baseFee * PRICE_DENOM * _rewardsShare / 10000 / PRICE_DENOM);
    }

    // Only owner should withdraw eth from paymaster to destination
    function testFuzz_WithdrawNativeAsset(uint256 _amount) external {
        address pAddr = address(paymaster);
        vm.deal(pAddr, 100e18);
        vm.assume(_amount < pAddr.balance);
        vm.startPrank(operator);
        paymaster.withdrawEth(beneficiary, _amount);
        vm.stopPrank();
        assertEq(pAddr.balance, 100e18 - _amount);
    }

    function testWithdrawNativeAsset() external {
        uint256 _amount = 1e18;
        address pAddr = address(paymaster);
        vm.deal(pAddr, 100e18);
        vm.startPrank(operator);
        paymaster.withdrawEth(beneficiary, _amount);
        vm.stopPrank();
        assertEq(pAddr.balance, 100e18 - _amount);

        vm.startPrank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        paymaster.withdrawEth(beneficiary, _amount);
        vm.stopPrank();
    }

    function testFuzz_WithdrawToken(uint256 _amount) external {
        vm.assume(_amount < token.totalSupply());
        token.sudoMint(address(paymaster), _amount);
        vm.startPrank(operator);
        uint256 balance = token.balanceOf(address(paymaster));
        paymaster.withdrawToken(beneficiary, _amount);
        assertEq(token.balanceOf(address(paymaster)), balance - _amount);
        vm.stopPrank();
    }

    function testWithdrawToken(uint256 _amount) external {
        vm.assume(_amount < token.totalSupply());
        token.sudoMint(address(paymaster), _amount);
        vm.startPrank(operator);
        paymaster.withdrawToken(beneficiary, _amount);
        vm.stopPrank();
        assertEq(token.balanceOf(address(paymaster)), 0);

        vm.startPrank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        paymaster.withdrawToken(beneficiary, _amount);
        vm.stopPrank();
    }

    function testUpdatePrice() external {
        uint256 _tokenPrice = 400000000;
        vm.startPrank(operator);
        tokenOracle.setPrice(int256(_tokenPrice));
        vm.stopPrank();
        vm.expectEmit(address(paymaster));
        uint256 prevPrice = paymaster.cachedPrice();
        uint256 expected = paymaster.calculatePrice(_tokenPrice, uint256(initialNativeAssetPrice), false, false);
        emit OracleHelper.TokenPriceUpdated(expected, prevPrice, uint48(block.timestamp));
        paymaster.updateCachedPrice(true);
        assertEq(paymaster.cachedPrice(), expected);
    }

    function testFuzz_UpdatePrice(uint256 _tokenPrice) external {
        vm.assume(_tokenPrice < PRICE_DENOM);
        vm.assume(_tokenPrice > 0);
        vm.startPrank(operator);
        tokenOracle.setPrice(int256(_tokenPrice));
        vm.stopPrank();
        vm.expectEmit(address(paymaster));
        uint256 expected = paymaster.calculatePrice(_tokenPrice, uint256(initialNativeAssetPrice), false, false);
        uint256 prevPrice = paymaster.cachedPrice();
        emit OracleHelper.TokenPriceUpdated(expected, prevPrice, uint48(block.timestamp));
        paymaster.updateCachedPrice(true);
        assertEq(paymaster.cachedPrice(), expected);
    }

    // sanity check for everything works without paymaster
    function testCall() external {
        vm.deal(address(account), 1e18);
        PackedUserOperation memory op =
            fillUserOp(account, userKey, address(counter), 0, abi.encodeWithSelector(TestCounter.count.selector));
        op.signature = signUserOp(op, userKey);
        submitUserOp(op);
    }

    // paymaster should reject if postOpGaSLimit is too low
    function testPaymasterShouldRejectIfPostOpGasLimitIsTooLow() external {
        (,, uint48 refundPostopCost,,) = paymaster.tokenPaymasterConfig();
        PackedUserOperation memory op =
            fillUserOp(account, userKey, address(counter), 0, abi.encodeWithSelector(TestCounter.count.selector));
        // verification gas limit | paymasterPostOpGasLimit | paymasterData
        op.paymasterAndData = abi.encodePacked(address(paymaster), uint128(300000), uint128(refundPostopCost - 1));
        op.signature = signUserOp(op, userKey);
        bytes4 errorSelector = bytes4(keccak256(bytes("Error(string)")));
        bytes memory revertReason = abi.encodeWithSelector(errorSelector, "TPM: postOpGasLimit too low");
        vm.expectRevert(
            abi.encodeWithSelector(IEntryPoint.FailedOpWithRevert.selector, uint256(0), "AA33 reverted", revertReason)
        );
        submitUserOp(op);
    }

    // paymaster should reject if account does not have enough tokens or allowance
    function testShouldRejectIfAccountDoesNotHaveEnoughTokensOrAllowance() external {
        PackedUserOperation memory op =
            fillUserOp(account, userKey, address(counter), 0, abi.encodeWithSelector(TestCounter.count.selector));
        op.paymasterAndData = abi.encodePacked(address(paymaster), uint128(300000), uint128(300000));
        op.signature = signUserOp(op, userKey);
        uint256 prefund = getRequiredPrefund(op);
        (uint256 priceMarkup,, uint48 refundPostopCost,, uint256 baseFee) = paymaster.tokenPaymasterConfig();
        uint256 maxFeePerGas = UserOperationLib.unpackLow128(op.gasFees); // maxFeePerGas
        uint256 nativeAmount = prefund + (refundPostopCost * maxFeePerGas);
        uint256 priceWithMarkup = (paymaster.cachedPrice() * PRICE_DENOM) / priceMarkup;
        uint256 expectedAllowance = paymaster.weiToToken(nativeAmount, priceWithMarkup) + baseFee;
        token.sudoMint(address(account), expectedAllowance - 1);
        bytes memory revertReason = abi.encodeWithSelector(
            IERC20Errors.ERC20InsufficientAllowance.selector, address(paymaster), 0, expectedAllowance
        );
        vm.expectRevert(
            abi.encodeWithSelector(IEntryPoint.FailedOpWithRevert.selector, uint256(0), "AA33 reverted", revertReason)
        );
        submitUserOp(op);
    }

    // should be able to sponsor the UserOp while charging correct amount of ERC-20 tokens
    function testShouldBeAbleToSponsorTheUserOpWhileChargingCorrectAmountOfERC20Tokens() external {
        token.sudoMint(address(account), 1e18);
        token.sudoApprove(address(account), address(paymaster), 1e18);
        PackedUserOperation memory op =
            fillUserOp(account, userKey, address(counter), 0, abi.encodeWithSelector(TestCounter.count.selector));
        op.paymasterAndData = abi.encodePacked(address(paymaster), uint128(300000), uint128(300000));
        op.signature = signUserOp(op, userKey);

        uint256 maxFeePerGas = UserOperationLib.unpackLow128(op.gasFees);
        vm.fee(maxFeePerGas);
        vm.txGasPrice(maxFeePerGas);
        vm.recordLogs();
        submitUserOp(op);
        Vm.Log[] memory entries = vm.getRecordedLogs();

        assertEq(entries.length, 5, "entries.length != 5");
        assertEq(entries[0].topics[0], keccak256("Transfer(address,address,uint256)"), "precharge transfer");
        assertEq(entries[2].topics[0], keccak256("Transfer(address,address,uint256)"), "postOp transfer");
        assertEq(entries[3].topics.length, 2, "entries[3].topics.length != 2");
        assertEq(
            entries[3].topics[0],
            keccak256("UserOperationSponsored(address,uint256,uint256,uint256,uint256)"),
            "UserOperationSponsored"
        );
        assertEq(entries[3].topics[1], bytes32(uint256(uint160(address(account)))));
        assertEq(
            entries[4].topics[0],
            keccak256("UserOperationEvent(bytes32,address,address,uint256,bool,uint256,uint256)"),
            "UserOperationEvent"
        );

        uint256 preChargeTokens = abi.decode(entries[0].data, (uint256));
        uint256 refundTokens = abi.decode(entries[2].data, (uint256));
        (uint256 actualTokenCharge, uint256 actualGasCostPaymaster, uint256 actualTokenPriceWithMarkup, uint256 baseFee)
        = abi.decode(entries[3].data, (uint256, uint256, uint256, uint256));
        uint256 actualTokenChargeEvents = preChargeTokens - refundTokens;
        (, bool success, uint256 actualGasCostEntryPoint,) =
            abi.decode(entries[4].data, (uint256, bool, uint256, uint256));
        assertEq(success, true);
        assertEq(token.balanceOf(address(account)), 1e18 - actualTokenCharge - baseFee);

        uint256 addedPostOpCost = maxFeePerGas * 40000;
        uint256 expectedTokenPriceWithMarkup =
            PRICE_DENOM * uint256(initialTokenPrice) / uint256(initialNativeAssetPrice) * 10 / 15;
        uint256 expectedTokenCharge =
            (actualGasCostPaymaster + addedPostOpCost) * PRICE_DENOM / expectedTokenPriceWithMarkup + baseFee;
        uint256 postOpGasCost = actualGasCostEntryPoint - actualGasCostPaymaster;

        assertEq(actualTokenChargeEvents, actualTokenCharge + baseFee, "actualTokenChargeEvents != actualTokenCharge");
        assertEq(actualTokenChargeEvents, expectedTokenCharge, "actualTokenChargeEvents != expectedTokenCharge");
        assertEq(
            actualTokenPriceWithMarkup,
            expectedTokenPriceWithMarkup,
            "actualTokenPriceWithMarkup != expectedTokenPriceWithMarkup"
        );
        assertApproxEqAbs(postOpGasCost / tx.gasprice, 50000, 20000);
    }

    // should update cached token price if the change is above configured percentage
    function testShouldUpdateCachedTokenPriceIfTheChangeIsAboveConfiguredPercentage() external {
        token.sudoMint(address(account), 1e18);
        token.sudoApprove(address(account), address(paymaster), type(uint256).max);
        vm.startPrank(operator);
        tokenOracle.setPrice(initialTokenPrice * 5);
        nativeAssetOracle.setPrice(initialNativeAssetPrice * 10);
        vm.stopPrank();
        vm.warp(2);

        PackedUserOperation memory op =
            fillUserOp(account, userKey, address(counter), 0, abi.encodeWithSelector(TestCounter.count.selector));
        op.paymasterAndData = abi.encodePacked(address(paymaster), uint128(3e5), uint128(3e5));
        op.signature = signUserOp(op, userKey);

        uint256 maxFeePerGas = UserOperationLib.unpackLow128(op.gasFees);
        vm.fee(maxFeePerGas);
        vm.txGasPrice(maxFeePerGas);
        vm.recordLogs();
        PackedUserOperation[] memory ops = new PackedUserOperation[](1);
        ops[0] = op;
        entryPoint.handleOps{gas: 3e7}(ops, beneficiary);
        Vm.Log[] memory entries = vm.getRecordedLogs();

        assertEq(entries.length, 6, "entries.length != 5");
        assertEq(entries[0].topics[0], keccak256("Transfer(address,address,uint256)"), "precharge transfer");
        assertEq(entries[2].topics[0], keccak256("TokenPriceUpdated(uint256,uint256,uint256)"), "token price updated");
        assertEq(entries[3].topics[0], keccak256("Transfer(address,address,uint256)"), "postOp transfer");
        assertEq(
            entries[4].topics[0],
            keccak256("UserOperationSponsored(address,uint256,uint256,uint256,uint256)"),
            "UserOperationSponsored"
        );
        assertEq(
            entries[5].topics[0],
            keccak256("UserOperationEvent(bytes32,address,address,uint256,bool,uint256,uint256)"),
            "UserOperationEvent"
        );

        uint256 oldExpectedPrice = PRICE_DENOM * uint256(initialTokenPrice) / uint256(initialNativeAssetPrice);
        uint256 newExpectedPrice = oldExpectedPrice / 2; // ether DOUBLED in price relative to token
        uint256 oldExpectedPriceWithMarkup = oldExpectedPrice * 10 / 15;
        uint256 newExpectedPriceWithMarkup = oldExpectedPriceWithMarkup / 2;

        (,, uint256 actualTokenPriceWithMarkup,) = abi.decode(entries[4].data, (uint256, uint256, uint256, uint256));
        (uint256 currentPrice, uint256 previousPrice, uint256 cachedPriceTimestamp) =
            abi.decode(entries[2].data, (uint256, uint256, uint256));

        assertEq(actualTokenPriceWithMarkup, newExpectedPriceWithMarkup);
        assertEq(currentPrice, newExpectedPrice);
        assertEq(previousPrice, oldExpectedPrice);
        assertEq(cachedPriceTimestamp, block.timestamp);
    }

    // should use token price supplied by the client if it is better than cached
    function testShouldUseTokenPriceSuppliedByTheClientIfItIsBetterThanCached() external {
        token.sudoMint(address(account), 1 ether);
        token.sudoApprove(address(account), address(paymaster), type(uint256).max);

        uint256 price = paymaster.cachedPrice();
        assertEq(price * 100 / PRICE_DENOM, 20);
        uint256 overridePrice = PRICE_DENOM * 132 / 1000;

        PackedUserOperation memory op =
            fillUserOp(account, userKey, address(counter), 0, abi.encodeWithSelector(TestCounter.count.selector));
        op.paymasterAndData = abi.encodePacked(address(paymaster), uint128(3e5), uint128(3e5), bytes32(overridePrice));
        op.signature = signUserOp(op, userKey);

        uint256 maxFeePerGas = UserOperationLib.unpackLow128(op.gasFees);
        vm.fee(maxFeePerGas);
        vm.txGasPrice(maxFeePerGas);
        vm.recordLogs();
        PackedUserOperation[] memory ops = new PackedUserOperation[](1);
        ops[0] = op;
        entryPoint.handleOps{gas: 3e7}(ops, beneficiary);
        Vm.Log[] memory entries = vm.getRecordedLogs();

        assertEq(entries.length, 5);

        uint256 preChargeTokens = abi.decode(entries[0].data, (uint256)) - BASE_FEE_DEFAULT;
        uint256 requiredPrefund = getRequiredPrefund(op) + 40000 * maxFeePerGas; // 40000 is the refundPostopCost
        uint256 preChargeTokenPrice = requiredPrefund * PRICE_DENOM / preChargeTokens;
        uint256 roundingError = 63461538;

        // console2.log("price", price);
        // console2.log("overridePrice", overridePrice);
        // console2.log("preChargeTokenPrice", preChargeTokenPrice);

        assertApproxEqAbs(preChargeTokenPrice, overridePrice, roundingError);
    }

    // should use cached token price if the one supplied by the client is worse
    function testShouldUseCachedTokenPriceIfTheOneSuppliedByTheClientIsWorse() external {
        token.sudoMint(address(account), 1 ether);
        token.sudoApprove(address(account), address(paymaster), type(uint256).max);

        uint256 price = paymaster.cachedPrice();
        assertEq(price * 100 / PRICE_DENOM, 20);
        uint256 overridePrice = PRICE_DENOM * 50; // higher means lower token price

        PackedUserOperation memory op =
            fillUserOp(account, userKey, address(counter), 0, abi.encodeWithSelector(TestCounter.count.selector));
        // gasFees = maxFeePerGas | maxGas
        op.gasFees = bytes32(abi.encodePacked(bytes16(uint128(1e10)), bytes16(uint128(1e9))));
        op.paymasterAndData = abi.encodePacked(address(paymaster), uint128(3e5), uint128(3e5), bytes32(overridePrice));
        op.signature = signUserOp(op, userKey);

        uint256 maxFeePerGas = UserOperationLib.unpackLow128(op.gasFees);
        vm.fee(maxFeePerGas);
        vm.txGasPrice(maxFeePerGas);
        vm.recordLogs();
        PackedUserOperation[] memory ops = new PackedUserOperation[](1);
        ops[0] = op;
        entryPoint.handleOps{gas: 3e7}(ops, beneficiary);
        Vm.Log[] memory entries = vm.getRecordedLogs();

        assertEq(entries.length, 5);

        uint256 preChargeTokens = abi.decode(entries[0].data, (uint256)) - BASE_FEE_DEFAULT;
        uint256 requiredPrefund = getRequiredPrefund(op) + 40000 * maxFeePerGas; // 40000 is the refundPostopCost
        uint256 preChargeTokenPrice = requiredPrefund * PRICE_DENOM / preChargeTokens;

        // console2.log("price", price);
        // console2.log("overridePrice", overridePrice);
        // console2.log("preChargeTokenPrice", preChargeTokenPrice);

        assertEq(preChargeTokenPrice, price * 10 / 15);
    }

    // should charge the overdraft tokens if the pre-charge ended up lower than the final transaction cost
    function testShouldChargeTheOverdraftTokensIfThePreChargeEndedUpLowerThanTheFinalTransactionCost() external {
        token.sudoMint(address(account), 1 ether);
        token.sudoApprove(address(account), address(paymaster), type(uint256).max);

        vm.startPrank(operator);
        // Ether price increased 100 times!
        tokenOracle.setPrice(int256(initialTokenPrice));
        nativeAssetOracle.setPrice(int256(initialNativeAssetPrice * 100));
        vm.stopPrank();
        vm.warp(200); // cannot happen too fast though

        PackedUserOperation memory op =
            fillUserOp(account, userKey, address(counter), 0, abi.encodeWithSelector(TestCounter.count.selector));
        // gasFees = maxFeePerGas | maxGas
        op.gasFees = bytes32(abi.encodePacked(bytes16(uint128(0)), bytes16(uint128(1e9))));
        op.paymasterAndData = abi.encodePacked(address(paymaster), uint128(3e5), uint128(3e5));
        op.signature = signUserOp(op, userKey);

        uint256 maxFeePerGas = UserOperationLib.unpackLow128(op.gasFees);
        vm.fee(maxFeePerGas);
        vm.txGasPrice(maxFeePerGas);
        vm.recordLogs();
        PackedUserOperation[] memory ops = new PackedUserOperation[](1);
        ops[0] = op;
        entryPoint.handleOps{gas: 1e7}(ops, beneficiary);
        Vm.Log[] memory entries = vm.getRecordedLogs();

        assertEq(entries.length, 6, "log entries length");
        assertEq(entries[0].topics[0], keccak256("Transfer(address,address,uint256)"), "precharge: transfer"); // precharge
        assertEq(entries[2].topics[0], keccak256("TokenPriceUpdated(uint256,uint256,uint256)"), "token price updated"); // token price updated
        assertEq(entries[3].topics[0], keccak256("Transfer(address,address,uint256)"), "overdraft: transfer"); // overdraft
        assertEq(
            entries[4].topics[0],
            keccak256("UserOperationSponsored(address,uint256,uint256,uint256,uint256)"),
            "sponsored: transfer"
        ); // sponsored
        assertEq(
            entries[5].topics[0],
            keccak256("UserOperationEvent(bytes32,address,address,uint256,bool,uint256,uint256)"), // event
            "UserOperationEvent"
        );
        // ensure both transfers are from account to Paymaster
        assertEq(address(uint160(uint256(entries[0].topics[1]))), address(account), "from account");
        assertEq(address(uint160(uint256(entries[0].topics[2]))), address(paymaster), "to paymaster");
        assertEq(entries[0].topics[1], entries[3].topics[1], "from account: transfer");
        assertEq(entries[0].topics[2], entries[3].topics[2], "to paymaster: transfer");

        (, bool success,,) = abi.decode(entries[5].data, (uint256, bool, uint256, uint256));
        uint256 preChargeTokens = abi.decode(entries[0].data, (uint256));
        uint256 overdraftTokens = abi.decode(entries[3].data, (uint256));
        (uint256 actualTokenCharge,,, uint256 baseFee) =
            abi.decode(entries[4].data, (uint256, uint256, uint256, uint256));

        assertEq(success, true, "success");
        assertEq(
            preChargeTokens + overdraftTokens,
            actualTokenCharge + baseFee,
            "preChargeTokens + overdraftTokens == actualTokenCharge + baseFee"
        );
        // console2.log("preChargeTokens", preChargeTokens);
        // console2.log("overdraftTokens", overdraftTokens);
        // console2.log("actualTokenCharge", actualTokenCharge);
    }

    // should revert in the first postOp run if the pre-charge ended up lower than the final transaction cost but the client has no tokens to cover the overdraft
    function testShouldRevertInTheFirstPostOpRunIfThePreChargeEndedUpLowerThanTheFinalTransactionCostButTheClientHasNoTokensToCoverTheOverdraft(
    ) external {
        address alice = makeAddr("alice");
        token.sudoMint(address(account), 0.01 ether);
        token.sudoApprove(address(account), address(paymaster), type(uint256).max);

        vm.startPrank(operator);
        // Ether price increased 100 times!
        tokenOracle.setPrice(int256(initialTokenPrice));
        nativeAssetOracle.setPrice(int256(initialNativeAssetPrice * 100));
        vm.stopPrank();
        vm.warp(200); // cannot happen too fast though

        // Withdraw most of the tokens the account has inside the inner transaction
        PackedUserOperation memory op = fillUserOp(
            account, userKey, address(token), 0, abi.encodeWithSelector(ERC20.transfer.selector, alice, 0.009 ether)
        );
        // accountGasLimits = verificationGasLimit | callGasLimit
        op.accountGasLimits = bytes32(abi.encodePacked(bytes16(uint128(150000)), bytes16(uint128(62348))));
        // gasFees = maxFeePerGas | maxGas
        op.gasFees = bytes32(abi.encodePacked(bytes16(uint128(21000)), bytes16(uint128(1e9))));
        op.paymasterAndData = abi.encodePacked(address(paymaster), uint128(3e5), uint128(3e5));
        op.signature = signUserOp(op, userKey);

        uint256 maxFeePerGas = UserOperationLib.unpackLow128(op.gasFees);
        vm.fee(maxFeePerGas);
        vm.txGasPrice(maxFeePerGas);
        vm.recordLogs();
        PackedUserOperation[] memory ops = new PackedUserOperation[](1);
        ops[0] = op;
        entryPoint.handleOps{gas: 1e7}(ops, beneficiary);

        Vm.Log[] memory entries = vm.getRecordedLogs();

        assertEq(entries.length, 6, "log entries length");
        (, bool success,,) = abi.decode(entries[5].data, (uint256, bool, uint256, uint256));
        assertEq(success, false, "success is false");

        assertEq(
            entries[4].topics[0], keccak256("PostOpRevertReason(bytes32,address,uint256,bytes)"), "PostOpRevertReason"
        );

        (, bytes memory revertReason) = abi.decode(entries[4].data, (uint256, bytes));
        bytes memory expectedRevertReason = abi.encodeWithSelector(
            IERC20Errors.ERC20InsufficientBalance.selector, address(account), 3449889999950000, 113483640000000000
        );
        assertEq(
            revertReason,
            abi.encodeWithSelector(IEntryPoint.PostOpReverted.selector, expectedRevertReason),
            "reverts with ERC20InsufficientBalance"
        );
    }

    // should swap tokens for ether if it falls below configured value and deposit it
    function testShouldSwapTokensForEtherIfItFallsBelowConfiguredValueAndDepositIt() external {
        token.sudoMint(address(account), 1 ether);
        token.sudoApprove(address(account), address(paymaster), type(uint256).max);

        (uint256 deposit,,,,) = entryPoint.deposits(address(paymaster));
        vm.startPrank(operator);
        paymaster.withdrawTo(payable(account), deposit);
        vm.stopPrank();

        // deposit exactly the minimum amount so next user op will trigger the swap
        entryPoint.depositTo{value: minEntryPointBalance}(address(paymaster));

        PackedUserOperation memory op =
            fillUserOp(account, userKey, address(counter), 0, abi.encodeWithSelector(TestCounter.count.selector));
        // accountGasLimits = verificationGasLimit | callGasLimit
        op.accountGasLimits = bytes32(abi.encodePacked(bytes16(uint128(150000)), bytes16(uint128(62348))));
        // gasFees = maxFeePerGas | maxGas
        op.gasFees = bytes32(abi.encodePacked(bytes16(uint128(21000)), bytes16(uint128(1e9))));
        op.paymasterAndData = abi.encodePacked(address(paymaster), uint128(3e5), uint128(3e5));
        op.signature = signUserOp(op, userKey);

        uint256 maxFeePerGas = UserOperationLib.unpackLow128(op.gasFees);
        vm.fee(maxFeePerGas);
        vm.txGasPrice(maxFeePerGas);
        vm.recordLogs();

        PackedUserOperation[] memory ops = new PackedUserOperation[](1);
        ops[0] = op;
        entryPoint.handleOps{gas: 1e7}(ops, beneficiary);

        Vm.Log[] memory entries = vm.getRecordedLogs();

        assertEq(entries.length, 11, "log entries length");

        assertEq(
            entries[4].topics[0],
            keccak256("StubUniswapExchangeEvent(uint256,uint256,address,address)"),
            "UniswapExchangeEvent"
        );
        (uint256 amountIn, uint256 amountOut,,) = abi.decode(entries[4].data, (uint256, uint256, address, address));
        uint256 deFactoExchangeRate = amountOut / amountIn;
        uint256 expectedPrice = uint256(initialTokenPrice) / uint256(initialNativeAssetPrice);
        assertEq(deFactoExchangeRate, expectedPrice, "deFactoExchangeRate");
    }

    // @note this test case does not make much sense because it's impossible to approve the tokens before the account exists.
    // should sponsor the UserOp with initCode
    function testShouldSponsorUserOperationWithInitCode() external {
        address newAccount = factory.getAddress(user, 123);
        token.sudoMint(newAccount, 1e18);
        token.sudoApprove(newAccount, address(paymaster), 1e18);
        PackedUserOperation memory op = fillUserOp(
            SimpleAccount(payable(newAccount)),
            userKey,
            address(counter),
            0,
            abi.encodeWithSelector(TestCounter.count.selector)
        );
        op.preVerificationGas = 0; // should also cover calldata cost.
        // accountGasLimits = verificationGasLimit | callGasLimit
        op.accountGasLimits = bytes32(abi.encodePacked(bytes16(uint128(200000)), bytes16(uint128(300000))));
        op.paymasterAndData = abi.encodePacked(address(paymaster), uint128(300000), uint128(300000));
        op.initCode = abi.encodePacked(
            address(factory), abi.encodeWithSelector(SimpleAccountFactory.createAccount.selector, user, 123)
        );
        op.signature = signUserOp(op, userKey);

        submitUserOp(op);
    }

    function getRequiredPrefund(PackedUserOperation memory op) internal pure returns (uint256 requiredPrefund) {
        uint256 verificationGasLimit = uint256(uint128(bytes16(op.accountGasLimits)));
        uint256 callGasLimit = uint256(uint128(uint256(op.accountGasLimits)));
        uint256 paymasterVerificationGasLimit = uint256(uint128(bytes16(BytesLib.slice(op.paymasterAndData, 20, 16))));
        uint256 postOpGasLimit = uint256(uint128(bytes16(BytesLib.slice(op.paymasterAndData, 36, 16))));
        uint256 preVerificationGas = op.preVerificationGas;
        uint256 maxFeePerGas = uint256(uint128(uint256(op.gasFees)));

        uint256 requiredGas =
            verificationGasLimit + callGasLimit + paymasterVerificationGasLimit + postOpGasLimit + preVerificationGas;
        requiredPrefund = requiredGas * maxFeePerGas;
    }

    function fillUserOp(SimpleAccount _sender, uint256 _key, address _to, uint256 _value, bytes memory _data)
        public
        view
        returns (PackedUserOperation memory op)
    {
        op.sender = address(_sender);
        op.nonce = entryPoint.getNonce(address(_sender), 0);
        op.callData = abi.encodeWithSelector(SimpleAccount.execute.selector, _to, _value, _data);
        // accountGasLimits = verificationGasLimit | callGasLimit
        op.accountGasLimits = bytes32(abi.encodePacked(bytes16(uint128(150000)), bytes16(uint128(21000))));
        op.preVerificationGas = 21000; // should also cover calldata cost.
        // gasFees = maxFeePerGas | maxGas
        op.gasFees = bytes32(abi.encodePacked(bytes16(uint128(0)), bytes16(uint128(1e9))));
        op.signature = signUserOp(op, _key);
        return op;
    }

    function signUserOp(PackedUserOperation memory op, uint256 _key) public view returns (bytes memory signature) {
        bytes32 hash = entryPoint.getUserOpHash(op);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(_key, MessageHashUtils.toEthSignedMessageHash(hash));
        signature = abi.encodePacked(r, s, v);
    }

    function submitUserOp(PackedUserOperation memory op) public {
        PackedUserOperation[] memory ops = new PackedUserOperation[](1);
        ops[0] = op;
        entryPoint.handleOps(ops, beneficiary);
    }
}
