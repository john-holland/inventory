// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract EnhancedInventoryContract is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;
    
    // Utility functions for Solidity-like assertions
    function ward(bool test, string memory message) internal pure {
        if (!test) {
            revert(message);
        }
    }
    
    function assertdown(function() internal view returns (bool) test, string memory message) internal view {
        ward(test(), message);
    }
    
    struct Item {
        uint256 id;
        string name;
        string description;
        address owner;
        address currentHolder;
        uint256 shippingCost;
        uint256 buyoutPrice;
        uint256 securityDeposit; // This is 1x shipping cost as base security
        uint256 additionalProtection; // Additional protection from 3x payments
        uint256 shippingFund; // This is 1x shipping cost for next shipping
        bool isAvailable;
        bool isSold;
        bool isLost;
        uint256 createdAt;
        uint256 updatedAt;
        uint256 lendingStartTime;
        uint256 maxLendingDuration; // in seconds
        string metadata; // IPFS hash for additional data
        bool hasDispute; // Track if there's an active dispute
        // New investment-related fields for Plan #3
        uint256 shippingHold2x; // Non-investable 2x shipping hold
        uint256 additionalHold; // Investable 3rd x hold
        uint256 insuranceHold; // Investable insurance hold
        bool riskyModeEnabled; // Risky investment mode flag
        uint256 riskyModePercentage; // % of 2x to invest
        uint256 antiCollateral; // Required collateral amount
        bool insuranceHoldInvested; // Insurance investment flag
        address[] investmentRobots; // Active monitoring robots
    }
    
    struct User {
        uint256 reputation;
        uint256 totalItemsLent;
        uint256 totalItemsBorrowed;
        bool isSuspended;
        uint256 suspensionEndTime;
        uint256 totalDeposits;
        bool autoEarlyReturn; // New: passive early return preference
        uint256 autoReturnThreshold; // New: minimum time before auto-return (in seconds)
    }
    
    struct LendingHistory {
        uint256 itemId;
        address borrower;
        uint256 startTime;
        uint256 endTime;
        bool wasReturned;
        uint256 securityDepositAmount;
        uint256 additionalProtectionAmount;
        uint256 shippingCostPaid;
        bool wasEarlyReturn;
        bool wasDisputed;
    }
    
    struct NextShipperRequest {
        address requester;
        uint256 requestTime;
        uint256 offeredShippingCost;
        bool isActive;
    }
    
    Counters.Counter private _itemIds;
    
    mapping(uint256 => Item) public items;
    mapping(address => User) public users;
    mapping(uint256 => LendingHistory[]) public itemLendingHistory;
    mapping(address => uint256) public userDeposits; // Security deposits only
    mapping(address => uint256) public userAdditionalProtection; // Additional protection deposits
    mapping(uint256 => uint256[]) public userOwnedItems;
    mapping(uint256 => uint256[]) public userBorrowedItems;
    mapping(uint256 => NextShipperRequest[]) public nextShipperRequests;
    
    // Events
    event ItemCreated(uint256 indexed itemId, address indexed owner, string name);
    event ItemLent(uint256 indexed itemId, address indexed borrower, uint256 securityDeposit, uint256 additionalProtection, uint256 shippingCost);
    event ItemReturned(uint256 indexed itemId, address indexed borrower, uint256 securityRefund, uint256 protectionRefund);
    event ItemEarlyReturned(uint256 indexed itemId, address indexed borrower, uint256 shippingCostPaid, uint256 excessRefunded);
    event ItemSold(uint256 indexed itemId, address indexed buyer, uint256 price);
    event ItemLost(uint256 indexed itemId, address indexed holder);
    event UserSuspended(address indexed user, uint256 duration);
    event UserReputationUpdated(address indexed user, uint256 newReputation);
    event DepositMade(address indexed user, uint256 amount);
    event DepositReleased(address indexed user, uint256 amount);
    event ProtectionDepositMade(address indexed user, uint256 amount);
    event ProtectionDepositReleased(address indexed user, uint256 amount);
    event ShippingFundForwarded(uint256 indexed itemId, uint256 amount);
    event NextShipperRequested(uint256 indexed itemId, address indexed requester, uint256 offeredCost);
    event NextShipperAccepted(uint256 indexed itemId, address indexed requester, address indexed currentHolder);
    event NextShipperRejected(uint256 indexed itemId, address indexed requester, bool returnedToOwner);
    event DisputeRaised(uint256 indexed itemId, address indexed raiser, string reason);
    event DisputeResolved(uint256 indexed itemId, address indexed resolver, bool inFavorOfOwner);
    event AutoReturnPreferenceSet(address indexed user, bool enabled, uint256 threshold);
    event AutoReturnTriggered(uint256 indexed itemId, address indexed borrower, string reason);
    // New investment-related events for Plan #3
    event RiskyModeEnabled(uint256 indexed itemId, uint256 riskPercentage, uint256 antiCollateral);
    event InsuranceHoldInvested(uint256 indexed itemId, uint256 amount);
    event FalloutTriggered(uint256 indexed itemId, uint256 totalLoss, uint256 borrowerShare, uint256 ownerShare);
    event InvestmentRobotActivated(uint256 indexed itemId, address robotAddress);
    
    // Constants
    uint256 public constant MIN_REPUTATION_FOR_LENDING = 50;
    uint256 public constant REPUTATION_PENALTY_FOR_LATE_RETURN = 10;
    uint256 public constant REPUTATION_BONUS_FOR_GOOD_BEHAVIOR = 5;
    uint256 public constant MAX_LENDING_DURATION = 30 days;
    uint256 public constant EARLY_RETURN_NOTICE_PERIOD = 3 days; // Minimum notice for early return
    uint256 public constant MIN_SHIPPING_MULTIPLIER = 2; // Minimum 2x shipping cost
    uint256 public constant MAX_SHIPPING_MULTIPLIER = 3; // Maximum 3x shipping cost
    
    modifier onlyItemOwner(uint256 itemId) {
        ward(items[itemId].owner == msg.sender, "Not the item owner");
        _;
    }
    
    modifier onlyCurrentHolder(uint256 itemId) {
        ward(items[itemId].currentHolder == msg.sender, "Not the current holder");
        _;
    }
    
    modifier itemExists(uint256 itemId) {
        ward(items[itemId].id != 0, "Item does not exist");
        _;
    }
    
    modifier userNotSuspended() {
        ward(!users[msg.sender].isSuspended || block.timestamp > users[msg.sender].suspensionEndTime, "User is suspended");
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
        assertdown(() => bytes(name).length > 0, "Name cannot be empty");
        assertdown(() => shippingCost > 0, "Shipping cost must be greater than 0");
        assertdown(() => maxLendingDuration <= MAX_LENDING_DURATION, "Lending duration too long");
        
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
            additionalProtection: 0, // No additional protection initially
            shippingFund: shippingCost, // 1x shipping cost for initial shipping
            isAvailable: true,
            isSold: false,
            isLost: false,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            lendingStartTime: 0,
            maxLendingDuration: maxLendingDuration,
            metadata: metadata,
            hasDispute: false,
            // Initialize new investment fields for Plan #3
            shippingHold2x: 0,
            additionalHold: 0,
            insuranceHold: 0,
            riskyModeEnabled: false,
            riskyModePercentage: 0,
            antiCollateral: 0,
            insuranceHoldInvested: false,
            investmentRobots: new address[](0)
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
        assertdown(() => item.isAvailable && !item.isSold && !item.isLost, "Item is not available");
        assertdown(() => msg.sender != item.owner, "Cannot lend your own item");
        assertdown(() => msg.value >= item.shippingCost * MIN_SHIPPING_MULTIPLIER, "Insufficient payment: need at least 2x shipping cost");
        assertdown(() => msg.value <= item.shippingCost * MAX_SHIPPING_MULTIPLIER, "Excessive payment: maximum 3x shipping cost allowed");
        assertdown(() => users[msg.sender].reputation >= MIN_REPUTATION_FOR_LENDING, "Reputation too low");
        
        item.isAvailable = false;
        item.currentHolder = msg.sender;
        item.lendingStartTime = block.timestamp;
        item.updatedAt = block.timestamp;
        
        // Calculate payment breakdown
        uint256 basePayment = item.shippingCost * 2; // 2x for basic lending
        uint256 additionalPayment = msg.value > basePayment ? msg.value - basePayment : 0;
        
        // Set shipping hold 2x (non-investable)
        item.shippingHold2x = item.shippingCost * 2;
        
        // 1x shipping cost goes to shipping fund for return shipping
        item.shippingFund = item.shippingCost;
        
        // 1x shipping cost held as security deposit
        userDeposits[msg.sender] += item.shippingCost;
        
        // Additional payment (if 3x) goes to additional hold (investable)
        if (additionalPayment > 0) {
            item.additionalHold = additionalPayment;
            item.additionalProtection = additionalPayment;
            userAdditionalProtection[msg.sender] += additionalPayment;
        }
        
        userBorrowedItems[msg.sender].push(itemId);
        
        // Record lending history
        itemLendingHistory[itemId].push(LendingHistory({
            itemId: itemId,
            borrower: msg.sender,
            startTime: block.timestamp,
            endTime: 0,
            wasReturned: false,
            securityDepositAmount: item.shippingCost,
            additionalProtectionAmount: additionalPayment,
            shippingCostPaid: item.shippingCost,
            wasEarlyReturn: false,
            wasDisputed: false
        }));
        
        users[msg.sender].totalItemsBorrowed++;
        users[item.owner].totalItemsLent++;
        
        emit ItemLent(itemId, msg.sender, item.shippingCost, additionalPayment, item.shippingCost);
        if (additionalPayment > 0) {
            emit ProtectionDepositMade(msg.sender, additionalPayment);
        }
    }
    
    function returnItem(uint256 itemId) public nonReentrant onlyCurrentHolder(itemId) itemExists(itemId) {
        Item storage item = items[itemId];
        ward(!item.isSold && !item.isLost, "Item cannot be returned");
        
        item.isAvailable = true;
        item.currentHolder = item.owner;
        item.updatedAt = block.timestamp;
        
        // Refund the security deposit (1x shipping cost)
        uint256 securityDeposit = userDeposits[msg.sender];
        userDeposits[msg.sender] = 0;
        
        // Refund additional protection if any
        uint256 additionalProtection = userAdditionalProtection[msg.sender];
        userAdditionalProtection[msg.sender] = 0;
        item.additionalProtection = 0;
        
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
        
        payable(msg.sender).transfer(securityDeposit + additionalProtection);
        
        emit ItemReturned(itemId, msg.sender, securityDeposit, additionalProtection);
        emit DepositReleased(msg.sender, securityDeposit);
        if (additionalProtection > 0) {
            emit ProtectionDepositReleased(msg.sender, additionalProtection);
        }
        emit ShippingFundForwarded(itemId, item.shippingFund);
    }
    
    // Early return function - borrower pays for shipback, gets excess unless disputed
    function earlyReturnItem(uint256 itemId) public payable nonReentrant onlyCurrentHolder(itemId) itemExists(itemId) {
        Item storage item = items[itemId];
        ward(!item.isSold && !item.isLost, "Item cannot be returned");
        ward(msg.value >= item.shippingCost, "Insufficient payment for shipback");
        
        item.isAvailable = true;
        item.currentHolder = item.owner;
        item.updatedAt = block.timestamp;
        
        // Refund the security deposit (1x shipping cost)
        uint256 securityDeposit = userDeposits[msg.sender];
        userDeposits[msg.sender] = 0;
        
        // Refund additional protection if any
        uint256 additionalProtection = userAdditionalProtection[msg.sender];
        userAdditionalProtection[msg.sender] = 0;
        item.additionalProtection = 0;
        
        // Calculate shipback cost and excess
        uint256 shipbackCost = item.shippingCost;
        uint256 excess = msg.value > shipbackCost ? msg.value - shipbackCost : 0;
        
        // Update shipping fund
        item.shippingFund = 0; // Used for shipback
        
        // Update lending history
        for (uint i = 0; i < itemLendingHistory[itemId].length; i++) {
            if (itemLendingHistory[itemId][i].borrower == msg.sender && 
                !itemLendingHistory[itemId][i].wasReturned) {
                itemLendingHistory[itemId][i].endTime = block.timestamp;
                itemLendingHistory[itemId][i].wasReturned = true;
                itemLendingHistory[itemId][i].wasEarlyReturn = true;
                itemLendingHistory[itemId][i].wasDisputed = item.hasDispute;
                break;
            }
        }
        
        // Transfer payments
        payable(msg.sender).transfer(securityDeposit + additionalProtection); // Refund deposits
        
        // Handle excess payment based on dispute status
        if (excess > 0) {
            if (item.hasDispute) {
                // If there's a dispute, excess goes to item owner
                payable(item.owner).transfer(excess);
            } else {
                // If no dispute, excess goes back to borrower
                payable(msg.sender).transfer(excess);
            }
        }
        
        // Clear dispute flag
        item.hasDispute = false;
        
        emit ItemEarlyReturned(itemId, msg.sender, shipbackCost, excess);
        emit DepositReleased(msg.sender, securityDeposit);
        if (additionalProtection > 0) {
            emit ProtectionDepositReleased(msg.sender, additionalProtection);
        }
    }
    
    // Request to be next shipper
    function requestNextShipper(uint256 itemId) public payable userNotSuspended itemExists(itemId) {
        Item storage item = items[itemId];
        ward(!item.isAvailable && !item.isSold && !item.isLost, "Item is not currently lent");
        ward(msg.sender != item.currentHolder, "Cannot request to be next shipper of item you hold");
        ward(msg.value >= item.shippingCost, "Insufficient payment for next shipper request");
        ward(users[msg.sender].reputation >= MIN_REPUTATION_FOR_LENDING, "Reputation too low");
        
        // Add request
        nextShipperRequests[itemId].push(NextShipperRequest({
            requester: msg.sender,
            requestTime: block.timestamp,
            offeredShippingCost: msg.value,
            isActive: true
        }));
        
        emit NextShipperRequested(itemId, msg.sender, msg.value);
    }
    
    // Current holder can accept next shipper request
    function acceptNextShipper(uint256 itemId, address requester) public nonReentrant onlyCurrentHolder(itemId) itemExists(itemId) {
        Item storage item = items[itemId];
        ward(!item.isSold && !item.isLost, "Item cannot be transferred");
        
        // Find the request
        NextShipperRequest storage request;
        uint256 requestIndex = type(uint256).max;
        for (uint i = 0; i < nextShipperRequests[itemId].length; i++) {
            if (nextShipperRequests[itemId][i].requester == requester && 
                nextShipperRequests[itemId][i].isActive) {
                request = nextShipperRequests[itemId][i];
                requestIndex = i;
                break;
            }
        }
        ward(requestIndex != type(uint256).max, "Request not found or not active");
        
        // Mark request as inactive
        nextShipperRequests[itemId][requestIndex].isActive = false;
        
        // Transfer item to new holder
        address previousHolder = item.currentHolder;
        item.currentHolder = requester;
        item.lendingStartTime = block.timestamp;
        item.updatedAt = block.timestamp;
        
        // Update user lists
        removeFromArray(userBorrowedItems[previousHolder], itemId);
        userBorrowedItems[requester].push(itemId);
        
        // Handle deposits
        uint256 previousSecurityDeposit = userDeposits[previousHolder];
        uint256 previousAdditionalProtection = userAdditionalProtection[previousHolder];
        userDeposits[previousHolder] = 0;
        userAdditionalProtection[previousHolder] = 0;
        
        // New holder pays 2x or 3x shipping cost
        uint256 newSecurityDeposit = item.shippingCost;
        uint256 newShippingFund = item.shippingCost;
        uint256 newAdditionalProtection = 0;
        
        // Calculate additional protection if 3x payment
        uint256 basePayment = item.shippingCost * 2;
        uint256 additionalPayment = request.offeredShippingCost > basePayment ? 
            request.offeredShippingCost - basePayment : 0;
        
        if (additionalPayment > 0) {
            newAdditionalProtection = additionalPayment;
            userAdditionalProtection[requester] += additionalPayment;
            item.additionalProtection = additionalPayment;
        }
        
        // Refund previous holder's deposits
        payable(previousHolder).transfer(previousSecurityDeposit + previousAdditionalProtection);
        
        // Set new holder's security deposit
        userDeposits[requester] = newSecurityDeposit;
        
        // Update shipping fund
        item.shippingFund = newShippingFund;
        
        // Record lending history for new holder
        itemLendingHistory[itemId].push(LendingHistory({
            itemId: itemId,
            borrower: requester,
            startTime: block.timestamp,
            endTime: 0,
            wasReturned: false,
            securityDepositAmount: newSecurityDeposit,
            additionalProtectionAmount: newAdditionalProtection,
            shippingCostPaid: newShippingFund,
            wasEarlyReturn: false,
            wasDisputed: false
        }));
        
        // Update user statistics
        users[requester].totalItemsBorrowed++;
        
        emit NextShipperAccepted(itemId, requester, previousHolder);
        emit DepositReleased(previousHolder, previousSecurityDeposit);
        if (previousAdditionalProtection > 0) {
            emit ProtectionDepositReleased(previousHolder, previousAdditionalProtection);
        }
        if (newAdditionalProtection > 0) {
            emit ProtectionDepositMade(requester, newAdditionalProtection);
        }
    }
    
    // Current holder can reject next shipper request by returning to owner
    function rejectNextShipper(uint256 itemId, address requester) public payable nonReentrant onlyCurrentHolder(itemId) itemExists(itemId) {
        Item storage item = items[itemId];
        ward(!item.isSold && !item.isLost, "Item cannot be returned");
        ward(msg.value >= item.shippingCost, "Insufficient payment for return shipping");
        
        // Find and mark request as inactive
        bool requestFound = false;
        for (uint i = 0; i < nextShipperRequests[itemId].length; i++) {
            if (nextShipperRequests[itemId][i].requester == requester && 
                nextShipperRequests[itemId][i].isActive) {
                nextShipperRequests[itemId][i].isActive = false;
                requestFound = true;
                
                // Refund the requester
                payable(requester).transfer(nextShipperRequests[itemId][i].offeredShippingCost);
                break;
            }
        }
        ward(requestFound, "Request not found or not active");
        
        // Return item to owner (early return)
        item.isAvailable = true;
        item.currentHolder = item.owner;
        item.updatedAt = block.timestamp;
        
        // Refund the security deposit
        uint256 securityDeposit = userDeposits[msg.sender];
        uint256 additionalProtection = userAdditionalProtection[msg.sender];
        userDeposits[msg.sender] = 0;
        userAdditionalProtection[msg.sender] = 0;
        item.additionalProtection = 0;
        
        // Calculate shipback cost and excess
        uint256 shipbackCost = item.shippingCost;
        uint256 excess = msg.value > shipbackCost ? msg.value - shipbackCost : 0;
        
        // Update shipping fund
        item.shippingFund = 0; // Used for shipback
        
        // Update lending history
        for (uint i = 0; i < itemLendingHistory[itemId].length; i++) {
            if (itemLendingHistory[itemId][i].borrower == msg.sender && 
                !itemLendingHistory[itemId][i].wasReturned) {
                itemLendingHistory[itemId][i].endTime = block.timestamp;
                itemLendingHistory[itemId][i].wasReturned = true;
                itemLendingHistory[itemId][i].wasEarlyReturn = true;
                itemLendingHistory[itemId][i].wasDisputed = false;
                break;
            }
        }
        
        // Transfer payments
        payable(msg.sender).transfer(securityDeposit + additionalProtection); // Refund deposits
        
        // Return excess to borrower
        if (excess > 0) {
            payable(msg.sender).transfer(excess);
        }
        
        emit NextShipperRejected(itemId, requester, true);
        emit ItemEarlyReturned(itemId, msg.sender, shipbackCost, excess);
        emit DepositReleased(msg.sender, securityDeposit);
        if (additionalProtection > 0) {
            emit ProtectionDepositReleased(msg.sender, additionalProtection);
        }
    }
    
    // Raise a dispute (only item owner can raise disputes)
    function raiseDispute(uint256 itemId, string memory reason) public onlyItemOwner(itemId) itemExists(itemId) {
        Item storage item = items[itemId];
        ward(!item.isAvailable, "Item must be currently lent to raise dispute");
        ward(!item.hasDispute, "Dispute already active");
        
        item.hasDispute = true;
        item.updatedAt = block.timestamp;
        
        emit DisputeRaised(itemId, msg.sender, reason);
    }
    
    // Resolve dispute (only contract owner can resolve disputes)
    function resolveDispute(uint256 itemId, bool inFavorOfOwner) public onlyOwner itemExists(itemId) {
        Item storage item = items[itemId];
        ward(item.hasDispute, "No active dispute to resolve");
        
        item.hasDispute = false;
        item.updatedAt = block.timestamp;
        
        emit DisputeResolved(itemId, msg.sender, inFavorOfOwner);
    }
    
    function buyItem(uint256 itemId) public payable nonReentrant userNotSuspended itemExists(itemId) {
        Item storage item = items[itemId];
        ward(item.buyoutPrice > 0, "Item is not for sale");
        ward(msg.value >= item.buyoutPrice, "Insufficient payment");
        ward(msg.sender != item.owner, "Cannot buy your own item");
        
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
        
        // If the buyer was the current holder, refund their deposits
        if (userDeposits[msg.sender] > 0 || userAdditionalProtection[msg.sender] > 0) {
            uint256 securityRefund = userDeposits[msg.sender];
            uint256 protectionRefund = userAdditionalProtection[msg.sender];
            userDeposits[msg.sender] = 0;
            userAdditionalProtection[msg.sender] = 0;
            payable(msg.sender).transfer(securityRefund + protectionRefund);
            emit DepositReleased(msg.sender, securityRefund);
            if (protectionRefund > 0) {
                emit ProtectionDepositReleased(msg.sender, protectionRefund);
            }
        }
        
        payable(previousOwner).transfer(msg.value);
        
        emit ItemSold(itemId, msg.sender, msg.value);
    }
    
    function reportItemLost(uint256 itemId) public onlyCurrentHolder(itemId) itemExists(itemId) {
        Item storage item = items[itemId];
        ward(!item.isSold, "Cannot report sold item as lost");
        
        item.isLost = true;
        item.isAvailable = false;
        item.updatedAt = block.timestamp;
        
        // The security deposit is forfeited (goes to the item owner)
        uint256 forfeitedDeposit = userDeposits[msg.sender];
        uint256 forfeitedProtection = userAdditionalProtection[msg.sender];
        userDeposits[msg.sender] = 0;
        userAdditionalProtection[msg.sender] = 0;
        item.additionalProtection = 0;
        
        // Transfer forfeited deposits to item owner
        payable(item.owner).transfer(forfeitedDeposit + forfeitedProtection);
        
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
        ward(item.shippingFund > 0, "No shipping fund available");
        
        uint256 amount = item.shippingFund;
        item.shippingFund = 0;
        
        payable(msg.sender).transfer(amount);
    }
    
    // Get next shipper requests for an item
    function getNextShipperRequests(uint256 itemId) public view itemExists(itemId) returns (NextShipperRequest[] memory) {
        return nextShipperRequests[itemId];
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
        uint256 shippingFund,
        uint256 additionalProtection,
        bool hasDispute
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
            item.shippingFund,
            item.additionalProtection,
            item.hasDispute
        );
    }
    
    function getUserInfo(address user) public view returns (
        uint256 reputation,
        uint256 totalItemsLent,
        uint256 totalItemsBorrowed,
        bool isSuspended,
        uint256 suspensionEndTime,
        uint256 totalDeposits,
        uint256 totalAdditionalProtection
    ) {
        User storage userInfo = users[user];
        return (
            userInfo.reputation,
            userInfo.totalItemsLent,
            userInfo.totalItemsBorrowed,
            userInfo.isSuspended,
            userInfo.suspensionEndTime,
            userDeposits[user],
            userAdditionalProtection[user]
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
    
    // Function to set auto-return preference
    function setAutoReturnPreference(bool enabled, uint256 thresholdSeconds) public userNotSuspended {
        ward(thresholdSeconds >= 1 days, "Auto-return threshold must be at least 1 day");
        ward(thresholdSeconds <= 30 days, "Auto-return threshold cannot exceed 30 days");
        
        users[msg.sender].autoEarlyReturn = enabled;
        users[msg.sender].autoReturnThreshold = thresholdSeconds;
        
        emit AutoReturnPreferenceSet(msg.sender, enabled, thresholdSeconds);
    }
    
    // Function to get user's auto-return preference
    function getAutoReturnPreference(address user) public view returns (bool enabled, uint256 threshold) {
        return (users[user].autoEarlyReturn, users[user].autoReturnThreshold);
    }
    
    // Internal function to check if auto-return should be triggered
    function _shouldAutoReturn(uint256 itemId, address borrower) internal view returns (bool, string memory) {
        Item storage item = items[itemId];
        User storage user = users[borrower];
        
        if (!user.autoEarlyReturn) {
            return (false, "");
        }
        
        // Check if minimum time threshold has passed
        uint256 timeSinceLending = block.timestamp - item.lendingStartTime;
        if (timeSinceLending < user.autoReturnThreshold) {
            return (false, "");
        }
        
        // Check if there are pending next shipper requests
        for (uint i = 0; i < nextShipperRequests[itemId].length; i++) {
            if (nextShipperRequests[itemId][i].isActive) {
                return (true, "Next shipper request pending");
            }
        }
        
        // Check if item is approaching max lending duration
        uint256 timeUntilMaxDuration = item.maxLendingDuration - timeSinceLending;
        if (timeUntilMaxDuration <= 3 days) {
            return (true, "Approaching max lending duration");
        }
        
        return (false, "");
    }
    
    // Function to trigger auto-return (can be called by anyone, but only works if conditions are met)
    function triggerAutoReturn(uint256 itemId) public nonReentrant itemExists(itemId) {
        Item storage item = items[itemId];
        ward(item.currentHolder != item.owner, "Item is not currently lent");
        
        (bool shouldReturn, string memory reason) = _shouldAutoReturn(itemId, item.currentHolder);
        ward(shouldReturn, "Auto-return conditions not met");
        
        address borrower = item.currentHolder;
        
        // Perform early return without requiring payment from borrower
        // The shipping fund covers the return cost
        item.isAvailable = true;
        item.currentHolder = item.owner;
        item.updatedAt = block.timestamp;
        
        // Refund the security deposit
        uint256 securityDeposit = userDeposits[borrower];
        uint256 additionalProtection = userAdditionalProtection[borrower];
        userDeposits[borrower] = 0;
        userAdditionalProtection[borrower] = 0;
        item.additionalProtection = 0;
        
        // Use shipping fund for return shipping
        item.shippingFund = 0;
        
        // Update lending history
        for (uint i = 0; i < itemLendingHistory[itemId].length; i++) {
            if (itemLendingHistory[itemId][i].borrower == borrower && 
                !itemLendingHistory[itemId][i].wasReturned) {
                itemLendingHistory[itemId][i].endTime = block.timestamp;
                itemLendingHistory[itemId][i].wasReturned = true;
                itemLendingHistory[itemId][i].wasEarlyReturn = true;
                itemLendingHistory[itemId][i].wasDisputed = item.hasDispute;
                break;
            }
        }
        
        // Refund deposits to borrower
        payable(borrower).transfer(securityDeposit + additionalProtection);
        
        // Update user lists
        removeFromArray(userBorrowedItems[borrower], itemId);
        
        emit AutoReturnTriggered(itemId, borrower, reason);
        emit ItemReturned(itemId, borrower, securityDeposit, additionalProtection);
        emit DepositReleased(borrower, securityDeposit);
        if (additionalProtection > 0) {
            emit ProtectionDepositReleased(borrower, additionalProtection);
        }
    }

    // Investment-related functions for Plan #3

    /**
     * Enable risky investment mode for an item
     * Allows investment of shipping holds with additional collateral requirement
     */
    function enableRiskyInvestmentMode(
        uint256 itemId,
        uint256 riskPercentage,
        uint256 antiCollateral
    ) public payable nonReentrant itemExists(itemId) onlyCurrentHolder(itemId) {
        Item storage item = items[itemId];
        ward(!item.riskyModeEnabled, "Risky investment already enabled");
        ward(riskPercentage > 0 && riskPercentage <= 100, "Invalid risk percentage");
        ward(msg.value >= antiCollateral, "Insufficient anti-collateral");
        ward(antiCollateral >= item.shippingCost / 5, "Anti-collateral too low"); // At least 20% of shipping cost

        item.riskyModeEnabled = true;
        item.riskyModePercentage = riskPercentage;
        item.antiCollateral = antiCollateral;

        emit RiskyModeEnabled(itemId, riskPercentage, antiCollateral);
    }

    /**
     * Create additional investment hold (3rd x payment)
     * This hold is immediately investable
     */
    function createAdditionalInvestmentHold(uint256 itemId) public payable nonReentrant itemExists(itemId) onlyCurrentHolder(itemId) {
        Item storage item = items[itemId];
        ward(msg.value > 0, "Investment hold amount must be greater than 0");

        item.additionalHold += msg.value;
        userAdditionalProtection[msg.sender] += msg.value;
    }

    /**
     * Create insurance hold
     * This hold becomes investable after item ships
     */
    function createInsuranceHold(uint256 itemId) public payable nonReentrant itemExists(itemId) onlyCurrentHolder(itemId) {
        Item storage item = items[itemId];
        ward(msg.value > 0, "Insurance hold amount must be greater than 0");

        item.insuranceHold += msg.value;
    }

    /**
     * Trigger insurance hold investment eligibility
     * Called when item ships to make insurance holds investable
     */
    function triggerInsuranceHoldInvestment(uint256 itemId) public nonReentrant itemExists(itemId) {
        Item storage item = items[itemId];
        ward(msg.sender == item.owner || msg.sender == item.currentHolder, "Not authorized to trigger insurance investment");

        item.insuranceHoldInvested = true;

        emit InsuranceHoldInvested(itemId, item.insuranceHold);
    }

    /**
     * Handle fallout scenario when risky investment fails
     * Implements 50/50 split between borrower and owner
     */
    function handleFalloutScenario(
        uint256 itemId,
        uint256 totalLoss
    ) public nonReentrant itemExists(itemId) {
        Item storage item = items[itemId];
        ward(item.riskyModeEnabled, "Risky investment not enabled");
        ward(msg.sender == item.owner || msg.sender == item.currentHolder, "Not authorized to handle fallout");

        uint256 shippingCost = item.shippingCost;
        uint256 insuranceCost = item.insuranceHold;
        uint256 totalCosts = shippingCost + insuranceCost;
        uint256 borrowerShare = totalCosts / 2;
        uint256 ownerShare = totalCosts / 2;

        // Deduct from borrower's deposits
        ward(userDeposits[item.currentHolder] >= borrowerShare, "Insufficient borrower funds");
        userDeposits[item.currentHolder] -= borrowerShare;

        emit FalloutTriggered(itemId, totalLoss, borrowerShare, ownerShare);
    }

    /**
     * Activate investment robot for monitoring
     * Sets up automated monitoring for risky investments
     */
    function activateInvestmentRobot(
        uint256 itemId,
        address robotAddress
    ) public nonReentrant itemExists(itemId) onlyCurrentHolder(itemId) {
        Item storage item = items[itemId];
        ward(item.riskyModeEnabled, "Risky investment not enabled");

        item.investmentRobots.push(robotAddress);

        emit InvestmentRobotActivated(itemId, robotAddress);
    }

    /**
     * Get investment status for an item
     */
    function getInvestmentStatus(uint256 itemId) public view itemExists(itemId) returns (
        uint256 shippingHold2x,
        uint256 additionalHold,
        uint256 insuranceHold,
        bool riskyModeEnabled,
        uint256 riskyModePercentage,
        uint256 antiCollateral,
        bool insuranceHoldInvested,
        uint256 robotCount
    ) {
        Item storage item = items[itemId];
        return (
            item.shippingHold2x,
            item.additionalHold,
            item.insuranceHold,
            item.riskyModeEnabled,
            item.riskyModePercentage,
            item.antiCollateral,
            item.insuranceHoldInvested,
            item.investmentRobots.length
        );
    }

    /**
     * Check if shipping holds are investable
     * Returns false unless risky mode is enabled
     */
    function areShippingHoldsInvestable(uint256 itemId) public view itemExists(itemId) returns (bool) {
        return items[itemId].riskyModeEnabled;
    }

    /**
     * Check if additional holds are investable
     * Returns true if additional hold > 0
     */
    function areAdditionalHoldsInvestable(uint256 itemId) public view itemExists(itemId) returns (bool) {
        return items[itemId].additionalHold > 0;
    }

    /**
     * Check if insurance holds are investable
     * Returns true if item has shipped (insuranceHoldInvested = true)
     */
    function areInsuranceHoldsInvestable(uint256 itemId) public view itemExists(itemId) returns (bool) {
        return items[itemId].insuranceHoldInvested;
    }
} 