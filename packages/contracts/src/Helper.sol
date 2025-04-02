// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import {Script, console2} from "forge-std/Script.sol";

abstract contract Helper is Script {
    /**
     * The address of Send token (1B supply and 18 decimals) deployed to base.
     */
    address constant SEND_TOKEN = 0xEab49138BA2Ea6dd776220fE26b7b8E446638956;
    /**
     * The address of Send token V0 (100B supply and 0 decimals) deployed to mainnet and base.
     */
    address constant SEND_TOKEN_V0 = 0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A;
    /**
     * The address of the Send manager and deployer on mainnet.
     */
    address constant OG_SEND_DEPLOYER = 0x647eb43401e13e995D89Cf26cD87e68890EE3f89;
    /**
     * The address of the Send manager and deployer on base.
     * https://basescan.org/address/0x436454a68bef94901014e2af90f86e7355a029f3
     */
    address constant BASE_SEND_MVP_DEPLOYER = 0x436454a68BEF94901014E2AF90f86E7355a029F3;
    /**
     * Send: Treasury
     * https://etherscan.io/address/0x4bB2f4c771ccB60723a78a974a2537AD339071c7
     */
    address constant SEND_TREASURY_SAFE = 0x05CEa6C36f3a44944A4F4bA39B1820677AcB97EE;
    /**
     * Send: Revenue
     * https://basescan.io/address/0x71fa02bb11e4b119bEDbeeD2f119F62048245301
     */
    address constant SEND_REVENUE_SAFE = 0x71fa02bb11e4b119bEDbeeD2f119F62048245301;
    /**
     * Send: Transaction Revenue
     * https://basescan.io/address/0xB3dCBE168cFe6ccb123b2c13F7CF9Aa95B7Ec5aE
     */
    address constant SEND_TX_REVENUE_SAFE = 0xB3dCBE168cFe6ccb123b2c13F7CF9Aa95B7Ec5aE;
    /**
     * Send: Airdrops
     * https://etherscan.io/address/0x6204Bc0662ccd8a9A762d59fe7906733f251E3b7
     */
    address constant SEND_AIRDROPS_SAFE = 0x077c4E5983e5c495599C1Eb5c1511A52C538eB50;
    /**
     * Account-Abstraction (EIP-4337) v0.6.0 singleton EntryPoint implementation.
     * https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
     */
    address constant AA_ENTRY_POINT_V0_6 = 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789;
    /**
     * Account-Abstraction (EIP-4337) v0.7.0 singleton EntryPoint implementation.
     * https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032
     */
    address constant AA_ENTRY_POINT_V0_7 = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;
    /**
     * USDC on Base
     * https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
     */
    address constant USDC_BASE = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    /**
     * Send Rewards Safe on Base
     * https://basescan.org/address/0xD3DCFf1823714a4399AD2927A3800686D4CEB53A
     */
    address constant SEND_REWARDS_SAFE = 0xD3DCFf1823714a4399AD2927A3800686D4CEB53A;

    function labels() public {
        vm.label(SEND_TOKEN, "SEND_TOKEN");
        vm.label(SEND_TOKEN_V0, "SEND_TOKEN_V0");
        vm.label(OG_SEND_DEPLOYER, "OG_SEND_DEPLOYER");
        vm.label(BASE_SEND_MVP_DEPLOYER, "BASE_SEND_MVP_DEPLOYER");
        vm.label(SEND_TREASURY_SAFE, "SEND_TREASURY_SAFE");
        vm.label(SEND_REVENUE_SAFE, "SEND_REVENUE_SAFE");
        vm.label(SEND_AIRDROPS_SAFE, "SEND_AIRDROPS_SAFE");
        vm.label(AA_ENTRY_POINT_V0_6, "AA_ENTRY_POINT_V0_6");
        vm.label(AA_ENTRY_POINT_V0_7, "AA_ENTRY_POINT_V0_7");
        vm.label(USDC_BASE, "USDC_BASE");
        vm.label(SEND_REWARDS_SAFE, "SEND_REWARDS_SAFE");
        vm.label(SEND_TX_REVENUE_SAFE, "SEND_TX_REVENUE_SAFE");
    }
}
