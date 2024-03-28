// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "../src/utils/IOracle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestOracle2 is IOracle, Ownable {
    int256 public price;
    uint8 private _decimals_;
    string public name;

    //       roundId   uint80 :  18446744073709551850
    //   answer   int256 :  99995000
    //   startedAt   uint256 :  1710678777
    //   updatedAt   uint256 :  1710678777
    //   answeredInRound   uint80 :  18446744073709551850

    constructor(int256 _price, uint8 _decimals, string memory _name, address _owner) Ownable(_owner) {
        price = _price;
        _decimals_ = _decimals;
        name = _name;
    }

    function description() external view returns (string memory) {
        return name;
    }

    function setPrice(int256 _price) external onlyOwner {
        price = _price;
    }

    function setDecimals(uint8 _decimals) external onlyOwner {
        _decimals_ = _decimals;
    }

    function decimals() external view override returns (uint8) {
        return _decimals_;
    }

    function latestRoundData()
        external
        view
        override
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
    {
        // solhint-disable-next-line not-rely-on-time
        return (73786976294838215802, price, 1680509051, block.timestamp, 73786976294838215802);
    }
}
