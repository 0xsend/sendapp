// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {Helper} from "../src/Helper.sol";

import {DaimoVerifier, DaimoVerifierProxy} from "../src/DaimoVerifier.sol";
import "../src/DaimoAccountFactory.sol";

contract DeploySendAccountFactoryScript is Script, Helper {
    function setUp() public {
        this.labels();
    }

    function run() public {
        address verifier = computeCreate2Address(0, hashInitCode(type(DaimoVerifier).creationCode));
        address owner = SEND_DEPLOYER; // FIXME: pick a multisig
        bytes memory args = abi.encode(verifier, abi.encodeWithSelector(DaimoVerifier.init.selector, owner));
        address verifierProxy =
            computeCreate2Address(0, hashInitCode(type(DaimoVerifierProxy).creationCode, args), owner);

        vm.startBroadcast();

        DaimoAccountFactory factory = new DaimoAccountFactory(IEntryPoint(AA_ENTRY_POINT), DaimoVerifier(verifierProxy));

        require(address(verifier) == SEND_VERIFIER, "DeploySendAccountFactoryScript: address mismatch");
        require(address(verifierProxy) == SEND_VERIFIER_PROXY, "DeploySendAccountFactoryScript: address mismatch");
        require(address(factory) == SEND_ACCOUNT_FACTORY, "DeploySendAccountFactoryScript: address mismatch");

        vm.stopBroadcast();
    }
}
