// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Helper} from "../src/Helper.sol";
import {DeploySendVerifierScript} from "../script/DeploySendVerifier.s.sol";

contract DeploySendVerifierTest is Test, Helper {
    function setUp() public {
        this.labels();
    }

    function testItRuns() public {
        DeploySendVerifierScript script = new DeploySendVerifierScript();
        script.run();
    }
}
