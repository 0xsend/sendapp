// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SendMerkleDrop is Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    /**
     *
     * + Constructor          +
     *
     */

    constructor(IERC20 _token, address _owner) {
        token = _token;
        transferOwnership(_owner);
    }

    /**
     *
     * + Globals              +
     *
     */

    IERC20 public token;
    mapping(uint256 => bytes32) public merkleRoots;
    mapping(uint256 => mapping(uint256 => uint256)) private claimedBitmaps;
    uint256 public trancheCursor;
    mapping(uint256 => uint256) public trancheAmounts;
    mapping(uint256 => uint256) public trancheAmountsClaimed;

    /**
     *
     * + Events               +
     *
     */

    event Claimed(address claimer, uint256 tranche, uint256 amount);
    event TrancheAdded(uint256 tranche, bytes32 merkleRoot, uint256 totalAmount);
    event TrancheExpired(uint256 tranche);

    /**
     *
     * + Management          +
     *
     */

    function addTranche(bytes32 _merkleRoot, uint256 _amount) external onlyOwner returns (uint256 trancheId) {
        token.safeTransferFrom(msg.sender, address(this), _amount);

        trancheId = trancheCursor;

        merkleRoots[trancheId] = _merkleRoot;
        trancheAmounts[trancheId] = _amount;
        trancheAmountsClaimed[trancheId] = 0;

        trancheCursor = trancheCursor.add(1);

        emit TrancheAdded(trancheId, _merkleRoot, _amount);
    }

    function expireTranche(uint256 _trancheId) external onlyOwner {
        bytes32 merkleRoot = merkleRoots[_trancheId];
        require(merkleRoot != bytes32(0), "Tranche has already been expired");
        merkleRoots[_trancheId] = bytes32(0);
        if (trancheAmounts[_trancheId].sub(trancheAmountsClaimed[_trancheId]) > 0) {
            token.safeTransfer(msg.sender, trancheAmounts[_trancheId].sub(trancheAmountsClaimed[_trancheId]));
        }
        emit TrancheExpired(_trancheId);
    }

    function transferToken(address _tokenContract, address _transferTo, uint256 _value) external onlyOwner {
        IERC20(_tokenContract).safeTransfer(_transferTo, _value);
    }

    function withdraw(uint256 _amount, address payable _to) external onlyOwner {
        _to.transfer(_amount);
    }

    /**
     *
     * + Claiming Logic               +
     *
     */

    function claimTranche(
        address _address,
        uint256 _tranche,
        uint256 _index,
        uint256 _amount,
        bytes32[] memory _merkleProof
    ) external {
        _claimTranche(_address, _tranche, _index, _amount, _merkleProof);

        _disburse(_address, _amount);
    }

    function claimTranches(
        address _address,
        uint256[] memory _tranches,
        uint256[] memory _indexes,
        uint256[] memory _amounts,
        bytes32[][] memory _merkleProofs
    ) external {
        uint256 len = _tranches.length;

        require(len == _amounts.length && len == _merkleProofs.length, "Mismatching inputs");

        uint256 totalAmount = 0;

        for (uint256 i = 0; i < len; i++) {
            _claimTranche(_address, _tranches[i], _indexes[i], _amounts[i], _merkleProofs[i]);

            totalAmount = totalAmount.add(_amounts[i]);
        }

        _disburse(_address, totalAmount);
    }

    function verifyClaim(
        address _address,
        uint256 _tranche,
        uint256 _index,
        uint256 _amount,
        bytes32[] memory _merkleProof
    ) external view returns (bool valid) {
        return _verifyClaim(_address, _tranche, _index, _amount, _merkleProof);
    }

    function trancheActive(uint256 _tranche) external view returns (bool valid) {
        return merkleRoots[_tranche] != bytes32(0);
    }

    function trancheAmount(uint256 _tranche) external view returns (uint256 amount) {
        return trancheAmounts[_tranche];
    }

    function trancheAmountClaimed(uint256 _tranche) external view returns (uint256 amount) {
        return trancheAmountsClaimed[_tranche];
    }

    function isClaimed(uint256 _tranche, uint256 _index) public view returns (bool claimed) {
        uint256 claimedWordIndex = _index / 256;
        uint256 claimedBitIndex = _index % 256;
        uint256 claimedWord = claimedBitmaps[_tranche][claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }

    /**
     *
     * + Private              +
     *
     */

    function _setClaimed(uint256 _tranche, uint256 _index) private {
        uint256 claimedWordIndex = _index / 256;
        uint256 claimedBitIndex = _index % 256;
        // solhint-disable-next-line
        claimedBitmaps[_tranche][claimedWordIndex] = claimedBitmaps[_tranche][claimedWordIndex] | (1 << claimedBitIndex);
    }

    function _claimTranche(
        address _address,
        uint256 _tranche,
        uint256 _index,
        uint256 _amount,
        bytes32[] memory _merkleProof
    ) private {
        require(_tranche < trancheCursor, "Tranche cannot be in the future");
        require(merkleRoots[_tranche] != bytes32(0), "Tranche has already been expired");
        require(!isClaimed(_tranche, _index), "Address has already claimed");

        require(_verifyClaim(_address, _tranche, _index, _amount, _merkleProof), "Incorrect merkle proof");
        trancheAmountsClaimed[_tranche] = trancheAmountsClaimed[_tranche].add(_amount);
        _setClaimed(_tranche, _index);

        emit Claimed(_address, _tranche, _amount);
    }

    function _verifyClaim(address _address, uint256 _tranche, uint256 _index, uint256 _amount, bytes32[] memory _proof)
        private
        view
        returns (bool valid)
    {
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(_index, _address, _amount))));
        return MerkleProof.verify(_proof, merkleRoots[_tranche], leaf);
    }

    function _disburse(address _address, uint256 _amount) private {
        if (_amount > 0) {
            token.safeTransfer(_address, _amount);
        } else {
            revert("No balance would be transferred: not going to waste your gas");
        }
    }
}
