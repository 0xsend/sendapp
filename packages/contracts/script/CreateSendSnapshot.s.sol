// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script, console2} from 'forge-std/Script.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {Send} from '../src/Send.sol';
import {Helper} from '../src/Helper.sol';

contract CreateSendSnapshotScript is Script, Helper {
    function setUp() public {}

    function run() public {
        vm.broadcast();
        Send send = Send(SEND_TOKEN);
        send.createSnapshot();
    }
}
