// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {EntryPointSimulations} from "account-abstraction/core/EntryPointSimulations.sol";

// Exists so artifacts are correctly picked up by @wagmi/cli
contract DummyEntryPointSimulations is EntryPointSimulations {}
