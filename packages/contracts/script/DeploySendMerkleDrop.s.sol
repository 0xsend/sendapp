// SPDX-License-Identifier: GPL-3.0
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
        vm.startBroadcast();
        deploy(vm.envAddress("SEND_TOKEN"), vm.envAddress("SEND_MERKLE_DROP_OWNER"));
        vm.stopBroadcast();
    }

    function deploy(address token, address owner) public returns (address) {
        bytes32 salt = bytes32(uint256(31415));
        SendMerkleDrop smd = new SendMerkleDrop{salt: salt}(IERC20(token), owner);
        // solhint-disable-next-line no-console
        console2.log("Deployed SendMerkleDrop at address: ", address(smd));
        return address(smd);
    }
}
