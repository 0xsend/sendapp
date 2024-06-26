// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "./BaseSepoliaForkTest.sol";
import "../src/TestUSDC.sol";
import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

import "../src/TokenPaymaster.sol";
import "account-abstraction/test/TestERC20.sol";
import "account-abstraction/test/TestUniswap.sol";
import "./TestOracle2.sol";
import "account-abstraction/test/TestWrappedNativeToken.sol";
import "account-abstraction/test/TestCounter.sol";
import "account-abstraction/core/EntryPoint.sol";
import "account-abstraction/samples/SimpleAccountFactory.sol";

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

using ECDSA for bytes32;

import "./BytesLib.sol";

interface MintableERC20 {
    function configureMinter(address minter, bool minterAllowed) external returns (bool);
    function mint(address to, uint256 amount) external;
}

contract BaseSepoliaTokenPaymasterTest is BaseSepoliaForkTest {
    EntryPoint entryPoint;
    SimpleAccountFactory factory;
    TokenPaymaster paymaster;
    SimpleAccount account;
    TestUSDC token;
    address operator = 0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f;
    address user;
    uint256 userKey;
    TestCounter counter;

    function setUp() external {
        this.createAndSelectFork();
        entryPoint = EntryPoint(payable(0x0000000071727De22E5E9d8BAf0edAc6f37da032));
    }

    function testItFails() external {
        // vm.skip(true); // dunno why the fork test isn't working correctly
        vm.rollFork(11234256);
        factory = new SimpleAccountFactory(entryPoint);
        paymaster = TokenPaymaster(payable(0x7e84448C1c94978f480D1895E6566C31c32fb136));
        token = TestUSDC(0x036CbD53842c5426634e7929541eC2318f3dCF7e);

        (user, userKey) = makeAddrAndKey("user");
        vm.deal(user, 100 ether);
        account = factory.createAccount(user, 0);
        vm.label(operator, "operator");

        vm.makePersistent(user, address(account));

        // mint some tokens to the account
        vm.startPrank(0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f, 0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f);
        token.transfer(address(account), 500 * 10 ** 6);
        vm.stopPrank();
        vm.startPrank(address(account), address(account));
        token.approve(address(paymaster), type(uint256).max);
        vm.stopPrank();
        PackedUserOperation memory op =
            fillUserOp(account, userKey, address(counter), 0, abi.encodeWithSelector(TestCounter.count.selector));
        op.paymasterAndData = abi.encodePacked(address(paymaster), uint128(300000), uint128(300000));
        op.signature = signUserOp(op, userKey);
        vm.expectRevert(abi.encodeWithSelector(IEntryPoint.FailedOp.selector, 0, "AA32 paymaster expired or not due"));
        submitUserOp(op);
    }

    function testItFailsOOG() external {
        // vm.skip(true); // dunno why the fork test isn't working correctly
        vm.rollFork(11279372);
        factory = new SimpleAccountFactory(entryPoint);

        paymaster = TokenPaymaster(payable(0x4c99CDaAb0cFe32B4ba77d30342B5C51e0444E5B));
        token = TestUSDC(0x036CbD53842c5426634e7929541eC2318f3dCF7e);

        (user, userKey) = makeAddrAndKey("user");
        vm.deal(user, 100 ether);
        account = factory.createAccount(user, 0);
        vm.label(operator, "operator");

        // mint some tokens to the account
        vm.startPrank(0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f, 0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f);
        token.transfer(address(account), 500 * 10 ** 6);
        vm.stopPrank();
        vm.startPrank(address(account), address(account));
        token.approve(address(paymaster), type(uint256).max);
        vm.stopPrank();
        PackedUserOperation memory op =
            fillUserOp(account, userKey, address(counter), 0, abi.encodeWithSelector(TestCounter.count.selector));
        // accountGasLimits = verificationGasLimit | callGasLimit
        op.accountGasLimits = bytes32(abi.encodePacked(bytes16(uint128(550000)), bytes16(uint128(100000))));
        op.preVerificationGas = 70000; // should also cover calldata cost.
        // gasFees = maxFeePerGas | maxPriorityFeePerGas
        op.gasFees = bytes32(abi.encodePacked(bytes16(uint128(10000000)), bytes16(uint128(10000000))));
        // paymasterAndData = paymaster | paymasterVerificationGasLimit | paymasterPostOpGasLimit
        op.paymasterAndData = abi.encodePacked(address(paymaster), uint128(150000), uint128(50000));
        op.signature = signUserOp(op, userKey);
        vm.recordLogs();
        submitUserOp(op);

        Vm.Log[] memory entries = vm.getRecordedLogs();

        assertEq(entries.length, 8, "log entries length");

        assertEq(
            entries[6].topics[0], keccak256("PostOpRevertReason(bytes32,address,uint256,bytes)"), "PostOpRevertReason"
        );
    }

    function testItDoesNotFailOOG() external {
        // vm.skip(true); // dunno why the fork test isn't working correctly
        vm.rollFork(11279372);
        factory = new SimpleAccountFactory(entryPoint);

        paymaster = TokenPaymaster(payable(0x4c99CDaAb0cFe32B4ba77d30342B5C51e0444E5B));
        token = TestUSDC(0x036CbD53842c5426634e7929541eC2318f3dCF7e);

        (user, userKey) = makeAddrAndKey("user");
        vm.deal(user, 100 ether);
        account = factory.createAccount(user, 0);
        vm.label(operator, "operator");

        // mint some tokens to the account
        vm.startPrank(0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f, 0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f);
        token.transfer(address(account), 500 * 10 ** 6);
        vm.stopPrank();
        vm.startPrank(address(account), address(account));
        token.approve(address(paymaster), type(uint256).max);
        vm.stopPrank();
        PackedUserOperation memory op =
            fillUserOp(account, userKey, address(counter), 0, abi.encodeWithSelector(TestCounter.count.selector));
        // accountGasLimits = verificationGasLimit | callGasLimit
        op.accountGasLimits = bytes32(abi.encodePacked(bytes16(uint128(550000)), bytes16(uint128(100000))));
        op.preVerificationGas = 70000; // should also cover calldata cost.
        // gasFees = maxFeePerGas | maxPriorityFeePerGas
        op.gasFees = bytes32(abi.encodePacked(bytes16(uint128(10000000)), bytes16(uint128(10000000))));
        // paymasterAndData = paymaster | paymasterVerificationGasLimit | paymasterPostOpGasLimit
        op.paymasterAndData = abi.encodePacked(address(paymaster), uint128(150000), uint128(60000));
        op.signature = signUserOp(op, userKey);
        vm.recordLogs();
        submitUserOp(op);
        Vm.Log[] memory entries = vm.getRecordedLogs();
        assertEq(entries.length, 7, "log entries length");
        assertEq(entries[2].topics[0], keccak256("TokenPriceUpdated(uint256,uint256,uint256)"), "token price updated");
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
        // gasFees = maxFeePerGas | maxPriorityFeePerGas
        op.gasFees = bytes32(abi.encodePacked(bytes16(uint128(1e9)), bytes16(uint128(block.basefee + 1e9))));
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
        entryPoint.handleOps(ops, payable(address(account)));
    }
}
