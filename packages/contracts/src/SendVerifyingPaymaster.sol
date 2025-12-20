// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "account-abstraction/samples/VerifyingPaymaster.sol";

/// @title A thin wrapper around VerifyingPaymaster from account-abstraction
/// @author @0xBigBoss
/// @dev This is for deterministic deployments using CREATE2. The owner is passed in as a constructor argument.
contract SendVerifyingPaymaster is VerifyingPaymaster {
    constructor(IEntryPoint _entryPoint, address _verifier, address _owner)
        VerifyingPaymaster(_entryPoint, _verifier)
    {
        transferOwnership(_owner);
    }
}
