// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/utils/Create2.sol";
import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "./SendAccount.sol";

/**
 * This factory deploys ERC-4337 SendAccount contracts using CREATE2.
 *
 * The factory's createAccount returns the target account address even if it it's already deployed.
 * This way, the entryPoint.getSenderAddress() can be called either before or after the account is created.
 */
contract SendAccountFactory {
    SendAccount public immutable accountImplementation;
    IEntryPoint public immutable entryPoint;
    SendVerifier public immutable verifier;

    event AccountCreated(address indexed account);

    constructor(IEntryPoint _entryPoint, SendVerifier _verifier) {
        entryPoint = _entryPoint;
        verifier = _verifier;
        accountImplementation = new SendAccount(_entryPoint, _verifier);
    }

    /**
     * Create an account, and return its address.
     * Ceturns the address even if the account is already deployed.
     * Note that during UserOperation execution, this method is called only if the account is not deployed.
     * This method returns an existing account address so that entryPoint.getSenderAddress() would work even
     * after account creation.
     */
    function createAccount(uint8 keySlot, bytes32[2] memory key, SendAccount.Call[] calldata initCalls, uint256 salt)
        public
        payable
        returns (SendAccount ret)
    {
        address addr = getAddress(keySlot, key, initCalls, salt);

        // Prefund the account with msg.value
        if (msg.value > 0) {
            entryPoint.depositTo{value: msg.value}(addr);
        }

        // Otherwise, no-op if the account is already deployed
        uint256 codeSize = addr.code.length;
        if (codeSize > 0) {
            return SendAccount(payable(addr));
        }

        ret = SendAccount(
            payable(
                new ERC1967Proxy{salt: bytes32(salt)}(
                    address(accountImplementation), abi.encodeCall(SendAccount.initialize, (keySlot, key, initCalls))
                )
            )
        );

        emit AccountCreated(address(ret));
    }

    /**
     * Calculate the counterfactual address of this account as it would be returned by createAccount()
     */
    function getAddress(uint8 keySlot, bytes32[2] memory key, SendAccount.Call[] calldata initCalls, uint256 salt)
        public
        view
        returns (address)
    {
        return Create2.computeAddress(
            bytes32(salt),
            keccak256(
                abi.encodePacked(
                    type(ERC1967Proxy).creationCode,
                    abi.encode(
                        address(accountImplementation),
                        abi.encodeCall(SendAccount.initialize, (keySlot, key, initCalls))
                    )
                )
            )
        );
    }
}
