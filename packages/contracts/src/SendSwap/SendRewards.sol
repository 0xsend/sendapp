/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISendRewards} from './ISendRewards.sol';

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';

interface IMigratorSend {
    function migrate(IERC20 token) external returns (IERC20);
}

contract SendRewards is Initializable, OwnableUpgradeable, ISendRewards {
    // Info of each user.
    struct UserInfo {
        uint256 lastDepositBlock; // The last block the user deposited/withdrew LP tokens
        uint256 amount; // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
        //
        // We do some fancy math here. Basically, any point in time, the amount of pointss
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accpointsPerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accpointsPerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }

    // Info of each pool.
    struct PoolInfo {
        IERC20 lpToken; // Address of LP token contract. @notice Kept in the struct so that we can migrate, rather than have it as a global variable.
        uint256 lastRewardBlock; // Last block number that pointss distribution occurs.
        uint256 bonusPointsAccrued; // Total number of bonus points that have been received.
        uint256 bonusPointsDistributed; // Bonus points that have been distributed so far.
        uint256 accpointsPerShare; // Accumulated points per share, times wag. See below.
    }

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice POINTS!!
    // Points public immutable points;
    /// @notice Block number when the reward period ends, unless extended
    uint256 public endBlock;
    /// @notice The number of points distributed per block
    uint256 public pointsPerBlock;
    /// @notice The address which is allowed to migrate to a new version of SendSwap
    IMigratorSend public migrator;
    /// @notice Information stored relating to the SendSwap Pool
    PoolInfo public pool;
    /// @notice Mapping to keep track of stakers
    mapping(address => UserInfo) public userInfo;
    /// @notice Scale factor for fixed point math, with a meme makerdao name
    // uint256 public wag = 1e12;
    uint256 public wag;
    /// @notice The address of Router Contract
    address public router;
    // @notice The address of the reward token
    IERC20 public rewardToken;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event Deposit(address indexed user, uint256 amount);

    event Withdraw(address indexed user, uint256 amount);

    event EmergencyWithdraw(address indexed user, uint256 amount);

    event RewardWithdraw(address indexed user, uint256 amount);

    event EmergencyRewardWithdraw(address indexed user, uint256 amount);

    /*
     * @param Points the points contract for onchain points
     * @param _pool Starting data for the pool, note if this is misconfigured the contract *will* malfunction
     * @param _migrator The address of the migrator contract
     * @param _pointsPerBlock The number of points to distribute per block
     * @param _endBlock The block number at which the reward period ends
     * @param _router The address of the router contract
     */
    // constructor(
    //     // Points _points,
    //     PoolInfo memory _pool,
    //     address _migrator,
    //     uint256 _pointsPerBlock,
    //     uint256 _endBlock,
    //     address _router,
    //     IERC20 _rewardToken
    // ) {
    //     // points = _points;
    //     pointsPerBlock = _pointsPerBlock;
    //     endBlock = _endBlock;
    //     pool = _pool;
    //     router = _router;
    //     migrator = IMigratorSend(_migrator);
    //     rewardToken = IERC20(_rewardToken);
    // }

    function initialize(
        // Points _points,
        PoolInfo memory _pool,
        address _migrator,
        uint256 _pointsPerBlock,
        uint256 _endBlock,
        address _router,
        IERC20 _rewardToken
    ) external initializer {
        __Ownable_init(msg.sender);
        pointsPerBlock = _pointsPerBlock;
        endBlock = _endBlock;
        pool = _pool;
        router = _router;
        migrator = IMigratorSend(_migrator);
        rewardToken = IERC20(_rewardToken);
        wag = 1e12;
    }

    /*
     * @param newEndBlock The new end block for the new reward period
     * @safety Points must be sent to SendRewards in order to fund the extended operation
     */
    function extendEndBlock(uint256 newEndBlock) external onlyOwner {
        endBlock = newEndBlock;
    }

    /*//////////////////////////////////////////////////////////////
                                  VIEW
    //////////////////////////////////////////////////////////////*/

    function getUserInfo(address _user) public view returns (UserInfo memory) {
        return userInfo[_user];
    }

    /*
     * @notice View function to see pending points on frontend.
     * @param _user Address of user.
     *
     * @return Pending points reward for a given user.
     */
    function pendingRewards(address _user) external view returns (uint256) {
        UserInfo storage user = userInfo[_user];
        uint256 accpointsPerShare = pool.accpointsPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        uint256 lastEligibleBlock = block.number < endBlock
            ? block.number
            : endBlock;
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier;
            if (lastEligibleBlock <= pool.lastRewardBlock) {
                multiplier = 0;
            } else {
                multiplier = lastEligibleBlock - pool.lastRewardBlock;
            }

            uint256 pointsReward = multiplier *
                pointsPerBlock +
                pool.bonusPointsAccrued -
                pool.bonusPointsDistributed;
            accpointsPerShare =
                accpointsPerShare +
                (pointsReward * wag) /
                lpSupply;
        }
        return (user.amount * accpointsPerShare) / wag - user.rewardDebt;
    }

    /*
     * @notice Update reward variables of the given pool to be up-to-date.
     */
    function updatePool() public {
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 lastEligibleBlock = block.number < endBlock
            ? block.number
            : endBlock;

        uint256 multiplier;
        if (lastEligibleBlock <= pool.lastRewardBlock) {
            multiplier = 0;
        } else {
            multiplier = lastEligibleBlock - pool.lastRewardBlock;
        }

        uint256 pointsReward = multiplier *
            pointsPerBlock +
            pool.bonusPointsAccrued -
            pool.bonusPointsDistributed;
        pool.accpointsPerShare =
            pool.accpointsPerShare +
            (pointsReward * wag) /
            lpSupply;
        pool.lastRewardBlock = block.number;
        pool.bonusPointsDistributed = pool.bonusPointsAccrued;
    }

    /*
     * @notice Let SendRewards hold onto your LP tokens for rewards
     * @param _amount The amount of LP tokens to deposit
     * @param onBehalfOf The address to deposit the LP tokens for, should be msg.sender unless you're the router
     */
    function deposit(uint256 _amount, address onBehalfOf) external {
        if (onBehalfOf != msg.sender) {
            require(router == msg.sender, 'deposit: not authorized');
        }
        UserInfo storage user = userInfo[onBehalfOf];
        updatePool();
        if (user.amount > 0) {
            uint256 pending = ((user.amount * pool.accpointsPerShare) / wag) -
                user.rewardDebt;
            // points.transfer(onBehalfOf, pending);
            //rewardToken.transfer(msg.sender, pending); // Transfer ERC20 rewards
            // rewardToken.transferFrom(address(this), msg.sender, pending);
            rewardToken.transfer(msg.sender, pending);
        }
        pool.lpToken.transferFrom(onBehalfOf, address(this), _amount);
        user.amount = user.amount + _amount;
        user.rewardDebt = (user.amount * pool.accpointsPerShare) / wag;
        user.lastDepositBlock = block.number;
        emit Deposit(onBehalfOf, _amount);
    }

    /*
     * @notice Let SendRewards hold onto your LP tokens for rewards
     * @param _amount The amount of LP tokens to deposit
     * @param onBehalfOf The address to deposit the LP tokens for, should be msg.sender unless you're the router
     */
    function depositLP(uint256 _amount, address onBehalfOf) external {
        if (onBehalfOf != msg.sender) {
            require(router == msg.sender, 'deposit: not authorized');
        }
        UserInfo storage user = userInfo[onBehalfOf];
        updatePool();
        // if (user.amount > 0) {
        //     uint256 pending = ((user.amount * pool.accpointsPerShare) / wag) -
        //         user.rewardDebt;
        //     points.transfer(onBehalfOf, pending);
        // }
        pool.lpToken.transferFrom(msg.sender, address(this), _amount);
        user.amount = user.amount + _amount;
        user.rewardDebt = (user.amount * pool.accpointsPerShare) / wag;
        user.lastDepositBlock = block.number;
        emit Deposit(onBehalfOf, _amount);
    }

    /*
     * TO DO - not sure there is aneed to have the onBehalfOf param, we can just have it work with msg.sender
     */
    /*
     * @notice Withdraw LP tokens from SendRewards
     * @param _amount The amount of LP tokens to withdraw
     * @param onBehalfOf The address to withdraw the LP tokens for, should be msg.sender unless you're the router
     */
    function withdraw(uint256 _amount, address onBehalfOf) external {
        if (onBehalfOf != msg.sender) {
            require(router == msg.sender, 'withdraw: not authorized');
        }
        UserInfo storage user = userInfo[onBehalfOf];

        require(user.amount >= _amount, 'withdraw: not good');
        require(user.lastDepositBlock + 5 < block.number, 'withdraw: wait');

        updatePool();
        uint256 pending = ((user.amount * pool.accpointsPerShare) / wag) -
            user.rewardDebt;

        rewardToken.transfer(msg.sender, pending);
        // points.transfer(onBehalfOf, pending);
        user.amount = user.amount - _amount;
        user.rewardDebt = (user.amount * pool.accpointsPerShare) / wag;
        pool.lpToken.transfer(msg.sender, _amount);
        emit Withdraw(onBehalfOf, _amount);
    }

    /*
     * @notice Withdraw only the pending rewards without withdrawing LP tokens
     */
    function withdrawRewards() external {
        UserInfo storage user = userInfo[msg.sender];
        updatePool();
        uint256 pending = (user.amount * pool.accpointsPerShare) /
            wag -
            user.rewardDebt;
        require(pending > 0, 'withdrawRewards: no rewards');

        rewardToken.transfer(msg.sender, pending); // Transfer ERC20 rewards
        user.rewardDebt = (user.amount * pool.accpointsPerShare) / wag;
        emit RewardWithdraw(msg.sender, pending);
    }

    /* TO DO
     * @notice Lets a contract (Sprinboard) add to the rewards pool as a bonus
     * @param _amount The amount of points to add to the bonus pool
     */
    function addBonusPoints(uint256 _amount) external {
        // pool.bonusPointsAccrued = pool.bonusPointsAccrued + _amount;
        // points.transferFrom(msg.sender, address(this), _amount);
    }

    /*
     * @notice Migrate lp token to another lp contract. We trust that migrator contract is good.
     */
    function migrate() external onlyOwner {
        require(address(migrator) != address(0), 'migrate: no migrator');
        IERC20 lpToken = pool.lpToken;
        uint256 bal = lpToken.balanceOf(address(this));
        lpToken.approve(address(migrator), bal);
        IERC20 newLpToken = migrator.migrate(lpToken);
        require(bal == newLpToken.balanceOf(address(this)), 'migrate: bad');
        pool.lpToken = newLpToken;
    }

    /*
     * @notice Withdraw without collecting rewards, for emergency situations
     * @note I don't think any MasterChef fork has ever needed to use this, but kept it
     *     as it doesn't hurt.
     */
    function emergency() external {
        UserInfo storage user = userInfo[msg.sender];
        pool.lpToken.transfer(address(msg.sender), user.amount);

        emit EmergencyWithdraw(msg.sender, user.amount);

        user.amount = 0;
        user.rewardDebt = 0;
    }

    function depositRewardTokens(uint256 _amount) external onlyOwner {
        rewardToken.transferFrom(msg.sender, address(this), _amount);
    }

    function emergencyWithdrawRewardTokens() external onlyOwner {
        uint256 balance = rewardToken.balanceOf(address(this));
        require(balance > 0, 'No rewards to withdraw');
        rewardToken.transfer(owner(), balance);
        emit EmergencyRewardWithdraw(owner(), balance);
    }
}
