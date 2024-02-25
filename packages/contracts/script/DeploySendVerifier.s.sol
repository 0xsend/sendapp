// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {Helper} from "../src/Helper.sol";

import {DaimoVerifier, DaimoVerifierProxy} from "../src/DaimoVerifier.sol";

contract DeploySendVerifierScript is Script, Helper {
    function setUp() public {
        this.labels();
    }

    function run() public {
        vm.startBroadcast();

        // use daimo verifier implementation for now
        address verifier = address(new DaimoVerifier{salt: 0}());
        address owner = SEND_DEPLOYER; // FIXME: pick a multisig

        // solhint-disable-next-line no-console
        console2.log("verifier address:", verifier);

        require(address(verifier) == SEND_VERIFIER, "DeploySendVerifierScript: address mismatch");

        DaimoVerifierProxy dvp =
            new DaimoVerifierProxy{salt: 0}(verifier, abi.encodeWithSelector(DaimoVerifier.init.selector, owner));

        // solhint-disable-next-line no-console
        console2.log("DaimoVerifierProxy address:", address(dvp));

        require(address(dvp) == SEND_VERIFIER_PROXY, "DeploySendVerifierScript: address mismatch");

        vm.stopBroadcast();
    }
}
