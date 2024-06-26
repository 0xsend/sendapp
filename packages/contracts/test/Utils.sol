// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
// solhint-disable-next-line
import "forge-std/console2.sol";
import {SendAccount} from "../src/SendAccount.sol";
import {SendVerifier, Signature} from "../src/SendVerifier.sol";
import "p256-verifier/utils/Base64URL.sol";

library Utils {
    function rawSignatureToSignature(bytes memory challenge, uint256 r, uint256 s)
        public
        pure
        returns (Signature memory)
    {
        string memory challengeb64url = Base64URL.encode(challenge);
        string memory clientDataJSON = string(
            abi.encodePacked('{"type":"webauthn.get","challenge":"', challengeb64url, '","origin":"https://daimo.xyz"}')
        );
        // solhint-disable-next-line
        console2.log("clientDataJSON:", clientDataJSON);

        uint256 challengeLocation = 23;
        uint256 responseTypeLocation = 1;

        bytes memory authenticatorData = new bytes(37);
        authenticatorData[32] = bytes1(0x05); // flags: user present, user verified

        return Signature({
            authenticatorData: authenticatorData,
            clientDataJSON: clientDataJSON,
            challengeLocation: challengeLocation,
            responseTypeLocation: responseTypeLocation,
            r: r,
            s: s
        });
    }
}
