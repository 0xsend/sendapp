// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {SendMerkleDrop} from "../src/SendMerkleDrop.sol";
import {Helper} from "../src/Helper.sol";

contract DeploySendMerkleDropScript is Script, Helper {
    function setUp() public {
        this.labels();
    }

    function run() public {
        bytes32 salt = bytes32(uint256(31415));
        bytes memory args = abi.encode(IERC20(SEND_TOKEN), SEND_AIRDROPS_SAFE);
        address contractAddress = computeCreate2Address(salt, hashInitCode(type(SendMerkleDrop).creationCode, args));

        console2.log("Deploying SendMerkleDrop contract to address: %s", contractAddress);

        vm.startBroadcast();
        new SendMerkleDrop{salt: salt}(IERC20(SEND_TOKEN), SEND_AIRDROPS_SAFE);
        vm.stopBroadcast();
    }
}
