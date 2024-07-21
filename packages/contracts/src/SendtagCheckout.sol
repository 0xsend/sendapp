// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title SendtagCheckout: A contract for handling Sendtag checkouts.
/// @author Big Boss
/// @notice This contract handles the checkout process for Sendtags. It handles the ERC20 token payments to the Send Multisig and remits of funds to a referrer.
/// @dev /FYSI
contract SendtagCheckout is Ownable {
    /// @notice The token used for payments.
    IERC20 public immutable token;

    /// @notice The address of the Multisig to receive the payments.
    address public immutable multisig;

    /// @notice When false, the contract is paused and checkouts are not allowed.
    bool public open;

    /// @notice The event emitted when a referrer is paid a reward.
    event ReferralReward(address indexed referrer, address referred, uint256 amount);

    /// @notice The event emitted when the contract is toggled.
    event Toggled(bool open);

    constructor(address _sendRevenuesMultisig, IERC20 _token) Ownable(msg.sender) {
        require(_sendRevenuesMultisig != address(0), "Invalid Send Multisig address");
        require(address(_token) != address(0), "Invalid token address");
        token = _token;
        multisig = _sendRevenuesMultisig;
        open = true;
        emit Toggled(open);
    }

    /// @notice Sends the funds to the Send Multisig and remits funds to a referrer.
    /// @param amount The amount of tokens to pay.
    /// @param referrer The address of the referrer.
    /// @param reward The amount to pay to the referrer.
    /// @dev Does not check if amount is valid or not. That is done offchain.
    function checkout(uint256 amount, address referrer, uint256 reward) external {
        require(open, "Closed");
        require(amount > 0, "Invalid amount");

        // First, collect the amount to this contract
        SafeERC20.safeTransferFrom(token, msg.sender, address(this), amount);

        // Then, pay the referrer...
        if (reward > 0) {
            require(referrer != address(0), "Invalid referrer address");
            require(reward <= amount, "Invalid referrer reward");
            SafeERC20.safeTransfer(token, referrer, reward);
            emit ReferralReward(referrer, msg.sender, reward);
        }

        // Finally, send the funds to the Send Multisig
        SafeERC20.safeTransfer(token, multisig, amount - reward);
    }

    /// @notice Toggle the contract.
    function toggle() external onlyOwner {
        open = !open;
        emit Toggled(open);
    }

    /// @notice Withdraws fund from the contract.
    /// @param _token The token to withdraw.
    /// @param amount The amount to withdraw.
    function withdrawToken(IERC20 _token, uint256 amount) external onlyOwner {
        SafeERC20.safeTransfer(_token, msg.sender, amount);
    }

    /// @notice Withdraws ETH from the contract.
    function withdrawETH() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }
}
