// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Helper} from "../src/Helper.sol";
import {DeploySendMerkleDropScript} from "../script/DeploySendMerkleDrop.s.sol";

contract DeploySendMerkleDropTest is Test, Helper {
    function setUp() public {
        this.labels();
    }

    function testItRuns() public {
        DeploySendMerkleDropScript script = new DeploySendMerkleDropScript();
        script.deploy(SEND_TOKEN, address(this));
    }
}
