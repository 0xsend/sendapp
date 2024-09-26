/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISendSwapCallee} from './ISendSwapCallee.sol';
import {ISendSwapPair} from './ISendSwapPair.sol';
// import {ReentrancyGuard} from 'contracts/src/ReentrancyGuard.sol';
// import {ERC20} from 'contracts/src/ERC20.sol';
// import {Owned} from 'contracts/src/Owned.sol';

import {Math} from './Math.sol';
import {UQ112x112} from './UQ112x112.sol';

// import {IERC20} from 'contracts/src/IERC20.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol';

/// @title SendSwap
/// @author CopyPaste
/// @notice A UniswapV2 Core adaptation for Points Trading

contract SendSwap is
    Initializable,
    ERC20Upgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using UQ112x112 for uint224;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/
    event Mint(address indexed sender, uint256 amount0, uint256 amount1);

    event Burn(
        address indexed sender,
        uint256 amount0,
        uint256 amount1,
        address indexed to
    );

    event Swap(
        address indexed sender,
        uint256 amount0In,
        uint256 amount1In,
        uint256 amount0Out,
        uint256 amount1Out,
        address indexed to
    );

    event Sync(uint112 reserve0, uint112 reserve1);

    event LogData(
        uint256 amount0In,
        uint256 amount1In,
        uint256 amount0Out,
        uint256 amount1Out,
        uint256 balance0,
        uint256 balance1,
        uint256 balance0Adjusted,
        uint256 balance1Adjusted,
        uint64 feeTier,
        uint112 _reserve0,
        uint112 _reserve1
    );

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    uint256 public constant MINIMUM_LIQUIDITY = 10 ** 3;
    bytes4 private constant SELECTOR =
        bytes4(keccak256(bytes('transfer(address,uint256)')));

    /// @notice token0 is SEND
    address public token0;
    /// @notice token1 is USDC
    address public token1;

    uint112 private reserve0; // uses single storage slot, accessible via getReserves
    uint112 private reserve1; // uses single storage slot, accessible via getReserves
    uint32 private blockTimestampLast; // uses single storage slot, accessible via getReserves

    uint256 public price0CumulativeLast;
    uint256 public price1CumulativeLast;
    uint256 public kLast; // reserve0 * reserve1, as of immediately after the most recent liquidity event

    uint64 public feeTier;

    // constructor(address _token0, address _token1) {
    //     token0 = _token0;
    //     token1 = _token1;

    //     feeTier = 0;
    // }

    function initialize(
        string memory _name,
        address _token0,
        address _token1
    ) external initializer {
        __ERC20_init('SendSwap', _name);
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        token0 = _token0;
        token1 = _token1;
    }

    receive() external payable {}

    function getReserves()
        public
        view
        returns (
            uint112 _reserve0,
            uint112 _reserve1,
            uint32 _blockTimestampLast
        )
    {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        _blockTimestampLast = blockTimestampLast;
    }

    /// @notice "Safe" transfer (ignores bool return)
    function _safeTransfer(address token, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(SELECTOR, to, value)
        );
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            'SendSwap: TRANSFER_FAILED'
        );
    }

    /// @notice Adjust the LP Fee of the pool, 3 being 0.3%
    function modifyFeeTier(uint64 _feeTier) external onlyOwner {
        feeTier = _feeTier;
    }

    mapping(address => bool) public isAllowedRouter;

    function toggleRouterAuthorization(
        address router,
        bool status
    ) external onlyOwner {
        isAllowedRouter[router] = status;
    }

    modifier onlyAuthorizedRouters() {
        require(isAllowedRouter[msg.sender], 'SendSwap: UNAUTHORIZED');
        _;
    }

    /*//////////////////////////////////////////////////////////////
                             CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    // update reserves and, on the first call per block, price accumulators
    function _update(
        uint256 balance0,
        uint256 balance1,
        uint112 _reserve0,
        uint112 _reserve1
    ) internal {
        require(
            balance0 <= type(uint112).max && balance1 <= type(uint112).max,
            'SendSwap: OVERFLOW'
        );
        uint32 blockTimestamp = uint32(block.timestamp % 2 ** 32);
        uint32 timeElapsed = blockTimestamp - blockTimestampLast; // overflow is desired
        if (timeElapsed > 0 && _reserve0 != 0 && _reserve1 != 0) {
            // * never overflows, and + overflow is desired
            price0CumulativeLast +=
                uint256(UQ112x112.encode(_reserve1).uqdiv(_reserve0)) *
                timeElapsed;
            price1CumulativeLast +=
                uint256(UQ112x112.encode(_reserve0).uqdiv(_reserve1)) *
                timeElapsed;
        }
        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        blockTimestampLast = blockTimestamp;
        emit Sync(reserve0, reserve1);
    }

    // this low-level function should be called from a contract which performs important safety checks
    function mint(
        address to
    ) external nonReentrant returns (uint256 liquidity) {
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves(); // gas savings
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        uint256 amount0 = balance0 - (_reserve0);
        uint256 amount1 = balance1 - (_reserve1);
        // uint256 _totalSupply = totalSupply;
        uint256 _totalSupply = totalSupply(); // gas savings, must be defined here since totalSupply can update in _mintFee
        if (_totalSupply == 0) {
            liquidity = Math.sqrt(amount0 * (amount1));
            // liquidity = Math.sqrt(amount0 * (amount1)) - (MINIMUM_LIQUIDITY);
            //_mint(address(0), MINIMUM_LIQUIDITY); // permanently lock the first MINIMUM_LIQUIDITY tokens
            // _mint(to, MINIMUM_LIQUIDITY); // permanently lock the first MINIMUM_LIQUIDITY tokens
            // _mint(to, MINIMUM_LIQUIDITY);
        } else {
            liquidity = Math.min(
                (amount0 * (_totalSupply)) / _reserve0,
                (amount1 * (_totalSupply)) / _reserve1
            );
        }
        require(liquidity > 0, 'SendSwap: INSUFFICIENT_LIQUIDITY_MINTED');
        _mint(to, liquidity);

        _update(balance0, balance1, _reserve0, _reserve1);

        emit Mint(msg.sender, amount0, amount1);
    }

    // this low-level function should be called from a contract which performs important safety checks
    function burn(
        address to
    ) external nonReentrant returns (uint256 amount0, uint256 amount1) {
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves(); // gas savings
        address _token0 = token0; // gas savings
        address _token1 = token1; // gas savings
        uint256 balance0 = IERC20(_token0).balanceOf(address(this));
        uint256 balance1 = IERC20(_token1).balanceOf(address(this));
        uint256 liquidity = balanceOf(address(this));
        //  uint256 liquidity = balanceOf[address(this)];
        // uint256 _totalSupply = totalSupply;
        uint256 _totalSupply = totalSupply();
        amount0 = (liquidity * balance0) / _totalSupply; // using balances ensures pro-rata distribution
        amount1 = (liquidity * balance1) / _totalSupply; // using balances ensures pro-rata distribution
        require(
            amount0 > 0 && amount1 > 0,
            'SendSwap: INSUFFICIENT_LIQUIDITY_BURNED'
        );
        _burn(address(this), liquidity);
        _safeTransfer(_token0, to, amount0);
        _safeTransfer(_token1, to, amount1);
        balance0 = IERC20(_token0).balanceOf(address(this));
        balance1 = IERC20(_token1).balanceOf(address(this));

        _update(balance0, balance1, _reserve0, _reserve1);
        emit Burn(msg.sender, amount0, amount1, to);
    }

    // this low-level function should be called from a contract which performs important safety checks
    function swap(
        uint256 amount0Out,
        uint256 amount1Out,
        address to,
        bytes calldata data
    ) external onlyAuthorizedRouters nonReentrant {
        require(
            amount0Out > 0 || amount1Out > 0,
            'SendSwap: INSUFFICIENT_OUTPUT_AMOUNT'
        );
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves(); // gas savings
        require(
            amount0Out < _reserve0 && amount1Out < _reserve1,
            'SendSwap: INSUFFICIENT_LIQUIDITY'
        );
        uint256 balance0;
        uint256 balance1;
        {
            // scope for _token{0,1}, avoids stack too deep errors
            address _token0 = token0;
            address _token1 = token1;
            require(to != _token0 && to != _token1, 'SendSwap: INVALID_TO');
            if (amount0Out > 0) _safeTransfer(_token0, to, amount0Out); // optimistically transfer tokens
            if (amount1Out > 0) _safeTransfer(_token1, to, amount1Out); // optimistically transfer tokens
            if (data.length > 0)
                ISendSwapCallee(to).sendSwapCall(
                    msg.sender,
                    amount0Out,
                    amount1Out,
                    data
                );
            balance0 = IERC20(_token0).balanceOf(address(this));
            balance1 = IERC20(_token1).balanceOf(address(this));
        }
        uint256 amount0In = balance0 > _reserve0 - amount0Out
            ? balance0 - (_reserve0 - amount0Out)
            : 0;
        uint256 amount1In = balance1 > _reserve1 - amount1Out
            ? balance1 - (_reserve1 - amount1Out)
            : 0;
        require(
            amount0In > 0 || amount1In > 0,
            'SendSwap: INSUFFICIENT_INPUT_AMOUNT'
        );
        {
            // scope for reserve{0,1}Adjusted, avoids stack too deep errors
            uint256 balance0Adjusted = balance0 *
                (1000) -
                (amount0In * (feeTier));
            uint256 balance1Adjusted = balance1 *
                (1000) -
                (amount1In * (feeTier));

            uint112 reserve0Log = _reserve0;
            uint112 reserve1Log = _reserve1;
            uint256 amount0OutLog = amount0Out;
            uint256 amount1OutLog = amount1Out;

            emit LogData(
                amount0In,
                amount1In,
                amount0OutLog,
                amount1OutLog,
                balance0,
                balance1,
                balance0Adjusted,
                balance1Adjusted,
                feeTier,
                reserve0Log,
                reserve1Log
            );

            require(
                balance0Adjusted * (balance1Adjusted) >=
                    uint256(_reserve0) * (_reserve1) * (1000 ** 2),
                'SendSwap: K'
            );
        }

        _update(balance0, balance1, _reserve0, _reserve1);
        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    }

    // force balances to match reserves
    function skim(address to) external nonReentrant {
        address _token0 = token0; // gas savings
        address _token1 = token1; // gas savings
        _safeTransfer(
            _token0,
            to,
            IERC20(_token0).balanceOf(address(this)) - (reserve0)
        );
        _safeTransfer(
            _token1,
            to,
            IERC20(_token1).balanceOf(address(this)) - (reserve1)
        );
    }

    // force reserves to match balances
    function sync() external nonReentrant {
        _update(
            IERC20(token0).balanceOf(address(this)),
            IERC20(token1).balanceOf(address(this)),
            reserve0,
            reserve1
        );
    }
}
