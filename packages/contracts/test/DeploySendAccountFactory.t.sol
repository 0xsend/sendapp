// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Helper} from "../src/Helper.sol";
import {DeploySendAccountFactoryScript} from "../script/DeploySendAccountFactory.s.sol";

contract DeploySendAccountFactoryTest is Test, Helper {
    function setUp() public {
        this.labels();
    }

    function testItRuns() public {
        DeploySendAccountFactoryScript script = new DeploySendAccountFactoryScript();
        script.run();
    }
}
