// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.23;

import "forge-std/Test.sol";

import "account-abstraction/core/EntryPoint.sol";
import "../src/DaimoAccount.sol";

abstract contract WebAuthnTest is Test {
    struct P256KeyPair {
        uint256 privateKey;
        uint256 publicKeyX;
        uint256 publicKeyY;
    }

    function demoP256KeyPair() public pure returns (P256KeyPair memory) {
        return P256KeyPair({
            privateKey: 0xA8568B74282DCC66FF70F10B4CE5CC7B391282F5381BBB4F4D8DD96974B16E6B,
            publicKeyX: 0xa0cd77bf34e8dc29f2631cf10b4dfe5cbeab1c1020d9c0d690a17e5e07db9bd6,
            publicKeyY: 0x9a6fd6fccbb9d91170fad924b3f8cd837ddf75c89e976925a9f6571e7ff4d6e6
        });
    }

    function signP256(uint256 privateKey, bytes memory challenge)
        public
        pure
        returns (Signature memory, bytes32 digest)
    {
        string memory challengeb64url = Base64URL.encode(challenge);
        string memory clientDataJSON = string(
            abi.encodePacked('{"type":"webauthn.get","challenge":"', challengeb64url, '","origin":"https://daimo.xyz"}')
        );

        uint256 challengeLocation = 23;
        uint256 responseTypeLocation = 1;

        bytes memory authenticatorData = new bytes(37);
        authenticatorData[32] = bytes1(0x05); // flags: user present, user verified

        digest = sha256(abi.encodePacked(authenticatorData, sha256(bytes(clientDataJSON))));

        (bytes32 r, bytes32 s) = vm.signP256(privateKey, digest);

        s = bytes32(normalizeP256S(uint256(s)));

        return (
            Signature({
                authenticatorData: authenticatorData,
                clientDataJSON: clientDataJSON,
                challengeLocation: challengeLocation,
                responseTypeLocation: responseTypeLocation,
                r: uint256(r),
                s: uint256(s)
            }),
            digest
        );
    }

    function normalizeP256S(uint256 s) public pure returns (uint256) {
        uint256 n = uint256(0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551);
        if (uint256(s) > n / 2) {
            s = n - s;
        }
        return s;
    }
}
