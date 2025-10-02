// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract EnhancedInventoryContract is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;
    
    struct Item {
        uint256 id;
        string name;
        string description;
        address owner;
        address currentHolder;
        uint256 shippingCost;
        uint256 buyoutPrice;
        uint256 securityDeposit; // This is 1x shipping cost
        uint256 shippingFund; // This is 1x shipping cost for next shipping
        bool isAvailable;
        bool isSold;
        bool isLost;
        uint256 createdAt;
        uint256 updatedAt;
        uint256 lendingStartTime;
        uint256 maxLendingDuration; // in seconds
        string metadata; // IPFS hash for additional data
    }
    
    struct User {
        uint256 reputation;
        uint256 totalItemsLent;
        uint256 totalItemsBorrowed;
        bool isSuspended;
        uint256 suspensionEndTime;
        uint256 totalDeposits;
    }
    
    struct LendingHistory {
        uint256 itemId;
        address borrower;
        uint256 startTime;
        uint256 endTime;
        bool wasReturned;
        uint256 securityDepositAmount;
        uint256 shippingCostPaid;
    }
    
    Counters.Counter private _itemIds;
    
    mapping(uint256 => Item) public items;
    mapping(address => User) public users;
    mapping(uint256 => LendingHistory[]) public itemLendingHistory;
    mapping(address => uint256) public userDeposits; // Security deposits only
    mapping(uint256 => uint256[]) public userOwnedItems;
    mapping(uint256 => uint256[]) public userBorrowedItems;
    
    // Events
    event ItemCreated(uint256 indexed itemId, address indexed owner, string name);
    event ItemLent(uint256 indexed itemId, address indexed borrower, uint256 securityDeposit, uint256 shippingCost);
    event ItemReturned(uint256 indexed itemId, address indexed borrower, uint256 securityRefund);
    event ItemSold(uint256 indexed itemId, address indexed buyer, uint256 price);
    event ItemLost(uint256 indexed itemId, address indexed holder);
    event UserSuspended(address indexed user, uint256 duration);
    event UserReputationUpdated(address indexed user, uint256 newReputation);
    event DepositMade(address indexed user, uint256 amount);
    event DepositReleased(address indexed user, uint256 amount);
    event ShippingFundForwarded(uint256 indexed itemId, uint256 amount);
    
    // Constants
    uint256 public constant MIN_REPUTATION_FOR_LENDING = 50;
    uint256 public constant REPUTATION_PENALTY_FOR_LATE_RETURN = 10;
    uint256 public constant REPUTATION_BONUS_FOR_GOOD_BEHAVIOR = 5;
    uint256 public constant MAX_LENDING_DURATION = 30 days;
    
    modifier onlyItemOwner(uint256 itemId) {
        require(items[itemId].owner == msg.sender, "Not the item owner");
        _;
    }
    
    modifier onlyCurrentHolder(uint256 itemId) {
        require(items[itemId].currentHolder == msg.sender, "Not the current holder");
        _;
    }
    
    modifier itemExists(uint256 itemId) {
        require(items[itemId].id != 0, "Item does not exist");
        _;
    }
    
    modifier userNotSuspended() {
        require(!users[msg.sender].isSuspended || block.timestamp > users[msg.sender].suspensionEndTime, "User is suspended");
        _;
    }
    
    constructor() {
        // Initialize contract
    }
    
    function createItem(
        string memory name,
        string memory description,
        uint256 shippingCost,
        uint256 buyoutPrice,
        uint256 maxLendingDuration,
        string memory metadata
    ) public userNotSuspended returns (uint256) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(shippingCost > 0, "Shipping cost must be greater than 0");
        require(maxLendingDuration <= MAX_LENDING_DURATION, "Lending duration too long");
        
        _itemIds.increment();
        uint256 itemId = _itemIds.current();
        
        items[itemId] = Item({
            id: itemId,
            name: name,
            description: description,
            owner: msg.sender,
            currentHolder: msg.sender,
            shippingCost: shippingCost,
            buyoutPrice: buyoutPrice,
            securityDeposit: shippingCost, // 1x shipping cost as security
            shippingFund: shippingCost, // 1x shipping cost for initial shipping
            isAvailable: true,
            isSold: false,
            isLost: false,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            lendingStartTime: 0,
            maxLendingDuration: maxLendingDuration,
            metadata: metadata
        });
        
        userOwnedItems[msg.sender].push(itemId);
        
        // Initialize user if not exists
        if (users[msg.sender].reputation == 0) {
            users[msg.sender].reputation = 100; // Start with good reputation
        }
        
        emit ItemCreated(itemId, msg.sender, name);
        return itemId;
    }
    
    function lendItem(uint256 itemId) public payable nonReentrant userNotSuspended itemExists(itemId) {
        Item storage item = items[itemId];
        require(item.isAvailable && !item.isSold && !item.isLost, "Item is not available");
        require(msg.sender != item.owner, "Cannot lend your own item");
        require(msg.value >= item.shippingCost * 2, "Insufficient payment: need 2x shipping cost");
        require(users[msg.sender].reputation >= MIN_REPUTATION_FOR_LENDING, "Reputation too low");
        
        item.isAvailable = false;
        item.currentHolder = msg.sender;
        item.lendingStartTime = block.timestamp;
        item.updatedAt = block.timestamp;
        
        // 1x shipping cost goes to shipping fund for return shipping
        item.shippingFund = item.shippingCost;
        
        // 1x shipping cost held as security deposit
        userDeposits[msg.sender] += item.shippingCost;
        
        userBorrowedItems[msg.sender].push(itemId);
        
        // Record lending history
        itemLendingHistory[itemId].push(LendingHistory({
            itemId: itemId,
            borrower: msg.sender,
            startTime: block.timestamp,
            endTime: 0,
            wasReturned: false,
            securityDepositAmount: item.shippingCost,
            shippingCostPaid: item.shippingCost
        }));
        
        users[msg.sender].totalItemsBorrowed++;
        users[item.owner].totalItemsLent++;
        
        emit ItemLent(itemId, msg.sender, item.shippingCost, item.shippingCost);
    }
    
    function returnItem(uint256 itemId) public nonReentrant onlyCurrentHolder(itemId) itemExists(itemId) {
        Item storage item = items[itemId];
        require(!item.isSold && !item.isLost, "Item cannot be returned");
        
        item.isAvailable = true;
        item.currentHolder = item.owner;
        item.updatedAt = block.timestamp;
        
        // Refund the security deposit (1x shipping cost)
        uint256 securityDeposit = userDeposits[msg.sender];
        userDeposits[msg.sender] = 0;
        
        // The shipping fund (1x shipping cost) remains in the contract for next shipping
        // This implements the "pay it forward" model
        
        // Update lending history
        for (uint i = 0; i < itemLendingHistory[itemId].length; i++) {
            if (itemLendingHistory[itemId][i].borrower == msg.sender && 
                !itemLendingHistory[itemId][i].wasReturned) {
                itemLendingHistory[itemId][i].endTime = block.timestamp;
                itemLendingHistory[itemId][i].wasReturned = true;
                break;
            }
        }
        
        // Check if return is on time and update reputation
        uint256 lendingDuration = block.timestamp - item.lendingStartTime;
        if (lendingDuration <= item.maxLendingDuration) {
            users[msg.sender].reputation += REPUTATION_BONUS_FOR_GOOD_BEHAVIOR;
            emit UserReputationUpdated(msg.sender, users[msg.sender].reputation);
        }
        
        payable(msg.sender).transfer(securityDeposit);
        
        emit ItemReturned(itemId, msg.sender, securityDeposit);
        emit DepositReleased(msg.sender, securityDeposit);
        emit ShippingFundForwarded(itemId, item.shippingFund);
    }
    
    function buyItem(uint256 itemId) public payable nonReentrant userNotSuspended itemExists(itemId) {
        Item storage item = items[itemId];
        require(item.buyoutPrice > 0, "Item is not for sale");
        require(msg.value >= item.buyoutPrice, "Insufficient payment");
        require(msg.sender != item.owner, "Cannot buy your own item");
        
        item.isSold = true;
        item.isAvailable = false;
        item.currentHolder = msg.sender;
        item.updatedAt = block.timestamp;
        
        // Transfer ownership
        address previousOwner = item.owner;
        item.owner = msg.sender;
        
        // Update user item lists
        removeFromArray(userOwnedItems[previousOwner], itemId);
        userOwnedItems[msg.sender].push(itemId);
        
        // If the buyer was the current holder, refund their security deposit
        if (userDeposits[msg.sender] > 0) {
            uint256 refund = userDeposits[msg.sender];
            userDeposits[msg.sender] = 0;
            payable(msg.sender).transfer(refund);
            emit DepositReleased(msg.sender, refund);
        }
        
        payable(previousOwner).transfer(msg.value);
        
        emit ItemSold(itemId, msg.sender, msg.value);
    }
    
    function reportItemLost(uint256 itemId) public onlyCurrentHolder(itemId) itemExists(itemId) {
        Item storage item = items[itemId];
        require(!item.isSold, "Cannot report sold item as lost");
        
        item.isLost = true;
        item.isAvailable = false;
        item.updatedAt = block.timestamp;
        
        // The security deposit is forfeited (goes to the item owner)
        uint256 forfeitedDeposit = userDeposits[msg.sender];
        userDeposits[msg.sender] = 0;
        
        // Transfer forfeited deposit to item owner
        payable(item.owner).transfer(forfeitedDeposit);
        
        // Penalize user reputation
        users[msg.sender].reputation = users[msg.sender].reputation > REPUTATION_PENALTY_FOR_LATE_RETURN ? 
            users[msg.sender].reputation - REPUTATION_PENALTY_FOR_LATE_RETURN : 0;
        
        // Suspend user temporarily
        users[msg.sender].isSuspended = true;
        users[msg.sender].suspensionEndTime = block.timestamp + 7 days;
        
        emit ItemLost(itemId, msg.sender);
        emit UserSuspended(msg.sender, 7 days);
        emit UserReputationUpdated(msg.sender, users[msg.sender].reputation);
    }
    
    // Function to get shipping fund balance for an item
    function getItemShippingFund(uint256 itemId) public view itemExists(itemId) returns (uint256) {
        return items[itemId].shippingFund;
    }
    
    // Function for item owner to withdraw shipping fund (for actual shipping costs)
    function withdrawShippingFund(uint256 itemId) public onlyItemOwner(itemId) nonReentrant {
        Item storage item = items[itemId];
        require(item.shippingFund > 0, "No shipping fund available");
        
        uint256 amount = item.shippingFund;
        item.shippingFund = 0;
        
        payable(msg.sender).transfer(amount);
    }
    
    function getItem(uint256 itemId) public view itemExists(itemId) returns (
        string memory name,
        string memory description,
        address owner,
        address currentHolder,
        uint256 shippingCost,
        uint256 buyoutPrice,
        bool isAvailable,
        bool isSold,
        bool isLost,
        uint256 createdAt,
        string memory metadata,
        uint256 shippingFund
    ) {
        Item storage item = items[itemId];
        return (
            item.name,
            item.description,
            item.owner,
            item.currentHolder,
            item.shippingCost,
            item.buyoutPrice,
            item.isAvailable,
            item.isSold,
            item.isLost,
            item.createdAt,
            item.metadata,
            item.shippingFund
        );
    }
    
    function getUserInfo(address user) public view returns (
        uint256 reputation,
        uint256 totalItemsLent,
        uint256 totalItemsBorrowed,
        bool isSuspended,
        uint256 suspensionEndTime,
        uint256 totalDeposits
    ) {
        User storage userInfo = users[user];
        return (
            userInfo.reputation,
            userInfo.totalItemsLent,
            userInfo.totalItemsBorrowed,
            userInfo.isSuspended,
            userInfo.suspensionEndTime,
            userDeposits[user]
        );
    }
    
    function getItemLendingHistory(uint256 itemId) public view itemExists(itemId) returns (LendingHistory[] memory) {
        return itemLendingHistory[itemId];
    }
    
    function getUserOwnedItems(address user) public view returns (uint256[] memory) {
        return userOwnedItems[user];
    }
    
    function getUserBorrowedItems(address user) public view returns (uint256[] memory) {
        return userBorrowedItems[user];
    }
    
    // Admin functions
    function suspendUser(address user, uint256 duration) public onlyOwner {
        users[user].isSuspended = true;
        users[user].suspensionEndTime = block.timestamp + duration;
        emit UserSuspended(user, duration);
    }
    
    function updateUserReputation(address user, uint256 newReputation) public onlyOwner {
        users[user].reputation = newReputation;
        emit UserReputationUpdated(user, newReputation);
    }
    
    // Helper function to remove item from array
    function removeFromArray(uint256[] storage arr, uint256 item) internal {
        for (uint i = 0; i < arr.length; i++) {
            if (arr[i] == item) {
                arr[i] = arr[arr.length - 1];
                arr.pop();
                break;
            }
        }
    }
    
    // Emergency functions
    function emergencyWithdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    receive() external payable {
        emit DepositMade(msg.sender, msg.value);
    }
} 