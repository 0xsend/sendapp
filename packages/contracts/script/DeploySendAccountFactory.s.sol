// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {Helper} from "../src/Helper.sol";

import {SendVerifier, SendVerifierProxy} from "../src/SendVerifier.sol";
import "../src/SendAccountFactory.sol";

contract DeploySendAccountFactoryScript is Script, Helper {
    function setUp() public {
        this.labels();
    }

    function run() public {
        address verifier = vm.computeCreate2Address(0, hashInitCode(type(SendVerifier).creationCode));
        address owner = SEND_DEPLOYER; // FIXME: pick a multisig
        bytes memory args = abi.encode(verifier, abi.encodeWithSelector(SendVerifier.init.selector, owner));
        address verifierProxy = vm.computeCreate2Address(0, hashInitCode(type(SendVerifierProxy).creationCode, args));

        vm.startBroadcast();
        address factory =
            address(new SendAccountFactory{salt: 0}(IEntryPoint(AA_ENTRY_POINT_V0_7), SendVerifier(verifierProxy)));

        /* solhint-disable no-console */
        console2.log("SendVerifier address:", verifier);
        console2.log("SendVerifierProxy address:", verifierProxy);
        console2.log("SendAccountFactory address:", factory);
        vm.stopBroadcast();
    }
}
