// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

// Fake SEND Token for testnet and local development.
contract SendToken is ERC20 {
    constructor() ERC20("send", "SEND") {
        // 100 billion
        _mint(msg.sender, 1e11);
    }

    // SEND has 0 decimals
    function decimals() public pure virtual override returns (uint8) {
        return 0;
    }
}
