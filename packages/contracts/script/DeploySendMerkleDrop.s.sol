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
        vm.startBroadcast();
        SendMerkleDrop smd = new SendMerkleDrop{salt: salt}(IERC20(SEND_TOKEN), SEND_AIRDROPS_SAFE);
        // solhint-disable-next-line no-console
        console2.log("Deployed SendMerkleDrop at address: ", address(smd));
        vm.stopBroadcast();
        require(SEND_MERKLE_DROP == address(smd), "Deployed contract address does not match expected address");
    }
}
