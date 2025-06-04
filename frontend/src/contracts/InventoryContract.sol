// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract InventoryContract {
    struct Item {
        string name;
        string description;
        address owner;
        address currentHolder;
        uint256 shippingCost;
        uint256 buyoutPrice;
        bool isAvailable;
        bool isSold;
        uint256 createdAt;
        uint256 updatedAt;
    }

    mapping(bytes32 => Item) public items;
    mapping(address => uint256) public userDeposits;
    
    event ItemCreated(bytes32 indexed itemId, address indexed owner);
    event ItemLent(bytes32 indexed itemId, address indexed borrower);
    event ItemReturned(bytes32 indexed itemId);
    event ItemSold(bytes32 indexed itemId, address indexed buyer);
    event DepositMade(address indexed user, uint256 amount);
    event DepositReleased(address indexed user, uint256 amount);

    function createItem(
        string memory name,
        string memory description,
        uint256 shippingCost,
        uint256 buyoutPrice
    ) public returns (bytes32) {
        bytes32 itemId = keccak256(abi.encodePacked(name, msg.sender, block.timestamp));
        
        items[itemId] = Item({
            name: name,
            description: description,
            owner: msg.sender,
            currentHolder: msg.sender,
            shippingCost: shippingCost,
            buyoutPrice: buyoutPrice,
            isAvailable: true,
            isSold: false,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        emit ItemCreated(itemId, msg.sender);
        return itemId;
    }

    function lendItem(bytes32 itemId) public payable {
        Item storage item = items[itemId];
        require(item.isAvailable, "Item is not available");
        require(msg.value >= item.shippingCost * 2, "Insufficient deposit");
        
        item.isAvailable = false;
        item.currentHolder = msg.sender;
        item.updatedAt = block.timestamp;
        
        userDeposits[msg.sender] += msg.value;
        
        emit ItemLent(itemId, msg.sender);
    }

    function returnItem(bytes32 itemId) public {
        Item storage item = items[itemId];
        require(msg.sender == item.currentHolder, "Not the current holder");
        
        item.isAvailable = true;
        item.currentHolder = item.owner;
        item.updatedAt = block.timestamp;
        
        uint256 deposit = userDeposits[msg.sender];
        userDeposits[msg.sender] = 0;
        payable(msg.sender).transfer(deposit);
        
        emit ItemReturned(itemId);
        emit DepositReleased(msg.sender, deposit);
    }

    function buyItem(bytes32 itemId) public payable {
        Item storage item = items[itemId];
        require(item.buyoutPrice > 0, "Item is not for sale");
        require(msg.value >= item.buyoutPrice, "Insufficient payment");
        
        item.isSold = true;
        item.isAvailable = false;
        item.currentHolder = msg.sender;
        item.updatedAt = block.timestamp;
        
        payable(item.owner).transfer(msg.value);
        
        emit ItemSold(itemId, msg.sender);
    }

    function getItem(bytes32 itemId) public view returns (
        string memory name,
        string memory description,
        address owner,
        address currentHolder,
        uint256 shippingCost,
        uint256 buyoutPrice,
        bool isAvailable,
        bool isSold
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
            item.isSold
        );
    }
} 