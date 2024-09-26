// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.20;

import {TransferHelper} from './TransferHelper.sol';
import {SendSwapLibrary} from './SendSwapLibrary.sol';
import {ISendSwapPair} from './ISendSwapPair.sol';
import {IWETH} from './IWETH.sol';
import {SendRewards} from './SendRewards.sol';

import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol';

/// @title Send Router
/// @author Nathan & Zigg
/// @notice A modified UniswapV2Router02 for SendSwap, this is copied from FriendTech

contract SendRouter is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    event AddLiquidity(
        uint256 liquidity,
        uint256 indexed amountA,
        uint256 indexed amountB
    );

    event AddLiquidityAndStake(
        uint256 liquidity,
        uint256 indexed amountA,
        uint256 indexed amountB
    );

    event RemoveLiquidity(
        uint256 liquidity,
        uint256 indexed amountToken0,
        uint256 indexed amountToken1
    );

    address public pair; // SendSwap Pair Address
    address public token0;
    address public token1;
    address public WETH;
    uint64 public protocolFee; // Out of 1000
    address public feeTo;
    SendRewards public sendRewards; // SendRewards Contract

    bool public tradingEnabled;

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, 'SendSwapRouter: EXPIRED');
        _;
    }

    modifier whenTradingEnabled() {
        require(tradingEnabled, 'SendSwapRouter: TRADING DISABLED');
        _;
    }

    function initialize(
        address _pair,
        address _feeTo,
        uint64 _protocolFee,
        address _WETH
    ) external initializer {
        __Ownable_init(msg.sender);
        pair = _pair;
        token0 = ISendSwapPair(_pair).token0();
        token1 = ISendSwapPair(_pair).token1();
        WETH = _WETH;
        protocolFee = _protocolFee;
        feeTo = _feeTo;
    }

    function initRewards(SendRewards rewardsAddress) external onlyOwner {
        sendRewards = rewardsAddress;
        ISendSwapPair(pair).approve(address(rewardsAddress), type(uint256).max);
    }

    function toggleTradingEnabled() external onlyOwner {
        tradingEnabled = !tradingEnabled;
    }

    /*//////////////////////////////////////////////////////////////
                             FEE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /*
     * @param _feeTo The address to send the protocol fees to
     */
    function changeFeeTo(address _feeTo) external {
        // external onlyOwner { TO DO
        feeTo = _feeTo;
    }

    /*
     * @param _protocolFee The new protocol fee
     */
    function changeProtocolFee(uint64 _protocolFee) external onlyOwner {
        // external onlyOwner { TO DO
        protocolFee = _protocolFee;
    }

    receive() external payable {
        assert(msg.sender == address(token1)); // only accept ETH via fallback from the WETH contract
    }

    /*//////////////////////////////////////////////////////////////
                       REWARDS
    //////////////////////////////////////////////////////////////*/

    // function depositRewardTokens(uint256 _amount) external onlyOwner {
    //     rewardToken.transferFrom(msg.sender, address(this), _amount);
    // }

    /*//////////////////////////////////////////////////////////////
                       LIQUIDITY ADDITION/REMOVAL
    //////////////////////////////////////////////////////////////*/

    function _addLiquidity(
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) internal returns (uint256 amountA, uint256 amountB) {
        // view
        (uint256 reserveA, uint256 reserveB, ) = ISendSwapPair(pair)
            .getReserves();
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint256 amountBOptimal = SendSwapLibrary.quote(
                amountADesired,
                reserveA,
                reserveB
            );
            if (amountBOptimal <= amountBDesired) {
                require(
                    amountBOptimal >= amountBMin,
                    'SendSwapRouter: INSUFFICIENT_B_AMOUNT'
                );
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint256 amountAOptimal = SendSwapLibrary.quote(
                    amountBDesired,
                    reserveB,
                    reserveA
                );
                assert(amountAOptimal <= amountADesired);
                require(
                    amountAOptimal >= amountAMin,
                    'SendSwapRouter: INSUFFICIENT_A_AMOUNT'
                );
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

    function addLiquidity(
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    )
        external
        ensure(deadline)
        returns (uint256 amountA, uint256 amountB, uint256 liquidity)
    {
        address _pair = pair;
        (uint256 amountA, uint256 amountB) = _addLiquidity(
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin
        );
        TransferHelper.safeTransferFrom(token0, msg.sender, _pair, amountA);
        TransferHelper.safeTransferFrom(
            address(token1),
            msg.sender,
            _pair,
            amountB
        );
        liquidity = ISendSwapPair(_pair).mint(to);
        emit AddLiquidity(liquidity, amountA, amountB);
    }

    function addLiquidityAndStake(
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    )
        external
        ensure(deadline)
        returns (uint256 amountA, uint256 amountB, uint256 liquidity)
    {
        address _pair = pair;
        (uint256 amountA, uint256 amountB) = _addLiquidity(
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin
        );
        TransferHelper.safeTransferFrom(token0, msg.sender, _pair, amountA);
        TransferHelper.safeTransferFrom(
            address(token1),
            msg.sender,
            _pair,
            amountB
        );
        liquidity = ISendSwapPair(_pair).mint(to);
        sendRewards.deposit(liquidity, to);
        emit AddLiquidityAndStake(liquidity, amountA, amountB);
    }

    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    )
        external
        payable
        ensure(deadline)
        returns (uint amountToken, uint amountETH, uint liquidity)
    {
        address _pair = pair;
        (amountToken, amountETH) = _addLiquidity(
            amountTokenDesired,
            msg.value,
            amountTokenMin,
            amountETHMin
        );
        TransferHelper.safeTransferFrom(token, msg.sender, _pair, amountToken);
        IWETH(WETH).deposit{value: amountETH}(); // Convert ETH to WETH
        assert(IWETH(WETH).transfer(pair, amountETH));
        liquidity = ISendSwapPair(_pair).mint(to);
        if (msg.value > amountETH)
            TransferHelper.safeTransferETH(msg.sender, msg.value - amountETH);
    }

    function addLiquidityETHAndStake(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    )
        external
        payable
        ensure(deadline)
        returns (uint amountToken, uint amountETH, uint liquidity)
    {
        address _pair = pair;
        (amountToken, amountETH) = _addLiquidity(
            amountTokenDesired,
            msg.value,
            amountTokenMin,
            amountETHMin
        );
        TransferHelper.safeTransferFrom(token, msg.sender, _pair, amountToken);
        IWETH(WETH).deposit{value: amountETH}(); // Convert ETH to WETH
        assert(IWETH(WETH).transfer(pair, amountETH));
        liquidity = ISendSwapPair(_pair).mint(to);
        sendRewards.deposit(liquidity, to);
        if (msg.value > amountETH)
            TransferHelper.safeTransferETH(msg.sender, msg.value - amountETH);
    }

    function removeLiquidity(
        uint256 liquidity,
        uint256 amount0Min,
        uint256 amount1Min,
        address to,
        uint256 deadline
    ) public ensure(deadline) returns (uint256 amount0, uint256 amount1) {
        address _pair = pair;
        ISendSwapPair(_pair).transferFrom(msg.sender, _pair, liquidity);
        (amount0, amount1) = ISendSwapPair(_pair).burn(to);
        require(
            amount0 >= amount0Min,
            'UniswapV2Router: INSUFFICIENT_A_AMOUNT'
        );
        require(
            amount1 >= amount1Min,
            'UniswapV2Router: INSUFFICIENT_B_AMOUNT'
        );
    }

    function removeLiquidityETH(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    )
        public
        virtual
        ensure(deadline)
        returns (uint amountToken, uint amountETH)
    {
        (amountToken, amountETH) = removeLiquidity(
            liquidity,
            amountTokenMin,
            amountETHMin,
            address(this),
            deadline
        );
        TransferHelper.safeTransfer(token, to, amountToken);
        IWETH(WETH).withdraw(amountETH);
        TransferHelper.safeTransferETH(to, amountETH);
    }

    function removeLiquidityAndWithdraw(
        uint256 liquidity,
        uint256 amountToken0Min,
        uint256 amountToken1Min,
        address to,
        uint256 deadline
    )
        external
        ensure(deadline)
        returns (uint256 amountToken0, uint256 amountToken1)
    {
        address _pair = pair;
        sendRewards.withdraw(liquidity, to);
        ISendSwapPair(_pair).transfer(_pair, liquidity);
        (amountToken0, amountToken1) = ISendSwapPair(_pair).burn(address(this));
        require(
            amountToken0 >= amountToken0Min,
            'UniswapV2Router: INSUFFICIENT_A_AMOUNT'
        );
        require(
            amountToken1 >= amountToken1Min,
            'UniswapV2Router: INSUFFICIENT_B_AMOUNT'
        );
        TransferHelper.safeTransfer(token0, to, amountToken0);
        TransferHelper.safeTransfer(token1, to, amountToken1);
        emit RemoveLiquidity(liquidity, amountToken0, amountToken1);
    }

    /*//////////////////////////////////////////////////////////////
                          CORE SWAP FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        address pairParam,
        uint deadline
    )
        external
        virtual
        ensure(deadline)
        whenTradingEnabled
        returns (uint[] memory amounts)
    {
        uint64 fee = ISendSwapPair(pair).feeTier();
        amounts = SendSwapLibrary.getAmountsOut(pairParam, amountIn, path, fee);
        require(
            amounts[amounts.length - 1] >= amountOutMin,
            'SendSwap swapExactTokensForTokens: INSUFFICIENT_OUTPUT_AMOUNT'
        );
        TransferHelper.safeTransferFrom(
            path[0],
            msg.sender,
            pairParam,
            amounts[0]
        );
        _swap(amounts, path, to);
    }

    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        address pairParam,
        uint deadline
    ) external virtual ensure(deadline) returns (uint[] memory amounts) {
        uint64 fee = ISendSwapPair(pair).feeTier();
        amounts = SendSwapLibrary.getAmountsIn(pairParam, amountOut, path, fee);
        require(
            amounts[0] <= amountInMax,
            'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT'
        );
        TransferHelper.safeTransferFrom(
            path[0],
            msg.sender,
            SendSwapLibrary.pairFor(pairParam, path[0], path[1]),
            amounts[0]
        );
        _swap(amounts, path, to);
    }

    function swapTokensForExactETH(
        uint256 amountOut,
        uint256 amountInMax,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256 amountIn) {
        uint64 fee = ISendSwapPair(pair).feeTier();
        (uint256 reserveIn, uint256 reserveOut, ) = ISendSwapPair(pair)
            .getReserves();

        uint256 feeTaken = (amountOut * protocolFee) / 1000;
        uint256 amountOwed = amountOut + feeTaken;

        amountIn = SendSwapLibrary.getAmountIn(
            amountOwed,
            reserveIn,
            reserveOut,
            fee
        );
        require(
            amountIn <= amountInMax,
            'BunnySwapRouter: EXCESSIVE_INPUT_AMOUNT'
        );
        TransferHelper.safeTransferFrom(token0, msg.sender, pair, amountIn);
        ISendSwapPair(pair).swap(0, amountOwed, address(this), new bytes(0));
        IWETH(WETH).withdraw(amountOut);
        IWETH(WETH).transfer(feeTo, feeTaken);
        TransferHelper.safeTransferETH(to, amountOut);
    }

    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256) {
        uint64 fee = ISendSwapPair(pair).feeTier();
        (uint256 reserveIn, uint256 reserveOut, ) = ISendSwapPair(pair)
            .getReserves();
        uint256 amountOut = SendSwapLibrary.getAmountOut(
            amountIn,
            reserveIn,
            reserveOut,
            fee
        );

        uint256 feeTaken = (amountOut * protocolFee) / 1000;
        uint256 amountOwed = amountOut - feeTaken;

        require(
            amountOwed >= amountOutMin,
            'BunnySwapRouter: INSUFFICIENT_OUTPUT_AMOUNT'
        );
        TransferHelper.safeTransferFrom(token0, msg.sender, pair, amountIn);
        ISendSwapPair(pair).swap(0, amountOut, address(this), new bytes(0));
        IWETH(WETH).transfer(feeTo, feeTaken);
        IWETH(WETH).withdraw(amountOwed);
        TransferHelper.safeTransferETH(to, amountOwed);

        return amountOwed;
    }

    // **** LIBRARY FUNCTIONS ****
    /// @dev Important note: This does not take into account the router protocol fee
    ///     which will be taken from the ETH side of the trade
    function quote(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) public pure returns (uint256 amountB) {
        return SendSwapLibrary.quote(amountA, reserveA, reserveB);
    }

    /// @dev Important note: This does not take into account the router protocol fee
    ///     which will be taken from the ETH side of the trade
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut,
        uint64 fee
    ) public pure returns (uint256 amountOut) {
        return
            SendSwapLibrary.getAmountOut(amountIn, reserveIn, reserveOut, fee);
    }

    /// @dev Important note: This does not take into account the router protocol fee
    ///     which will be taken from the ETH side of the trade
    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut,
        uint64 fee
    ) public pure returns (uint256 amountIn) {
        return
            SendSwapLibrary.getAmountIn(amountOut, reserveIn, reserveOut, fee);
    }

    // **** SWAP ****
    // requires the initial amount to have already been sent to the first pair
    function _swap(
        uint[] memory amounts,
        address[] memory path,
        address _to
    ) internal virtual {
        for (uint i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0, ) = SendSwapLibrary.sortTokens(input, output);
            uint amountOut = amounts[i + 1];
            (uint amount0Out, uint amount1Out) = input == token0
                ? (uint(0), amountOut)
                : (amountOut, uint(0));
            address to = i < path.length - 2
                ? SendSwapLibrary.pairFor(pair, output, path[i + 2])
                : _to;
            ISendSwapPair(pair).swap(amount0Out, amount1Out, to, new bytes(0));
        }
    }
}
