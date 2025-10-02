// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CharityLendingContract is ReentrancyGuard, Ownable {
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
    
    struct Charity {
        uint256 id;
        string name;
        string charityType; // shelter, food_bank, clothing_bank, medical_clinic, education_center
        string address;
        string contactPerson;
        string email;
        string phone;
        bool verified;
        address socialWorker;
        uint256 maxItemValue;
        string[] preferredCategories;
        string[] specialNeeds;
        uint256 createdAt;
        uint256 lastActivity;
    }
    
    struct SocialWorker {
        uint256 id;
        string name;
        string organization;
        string licenseNumber;
        string email;
        string phone;
        bool verified;
        uint256[] charityIds;
        string[] specialties;
        uint256 maxCuratedItems;
        uint256 createdAt;
    }
    
    struct DropShippingItem {
        uint256 id;
        string title;
        string description;
        string platform; // amazon, ebay, walmart
        string platformItemId;
        string category;
        uint256 price;
        uint256 shippingCost;
        uint256 taxRate;
        uint256 estimatedTax;
        uint256 totalCost;
        uint256 availability;
        string condition; // new, used_like_new, used_good, used_acceptable
        string[] images;
        uint256 sellerRating;
        bool dropShippingExclusive; // Charity items only
        uint256 charityId; // If this item is for a specific charity
        address socialWorker; // Curated by which social worker
        string urgency; // low, medium, high, critical
        string[] specialNotes;
        uint256 createdAt;
        uint256 expiresAt; // For time-sensitive needs
    }
    
    struct CharityLendingRequest {
        uint256 id;
        uint256 charityId;
        uint256 itemId;
        uint256 requestedQuantity;
        string urgency;
        string purpose;
        uint256 expectedReturnDate;
        string[] specialInstructions;
        string status; // pending, approved, shipped, delivered, returned, cancelled
        address approvedBy;
        uint256 approvedAt;
        uint256 shippedAt;
        uint256 deliveredAt;
        uint256 returnedAt;
        uint256 createdAt;
    }
    
    struct Donor {
        uint256 id;
        string name;
        string email;
        string phone;
        bool verified;
        uint256 totalDonations;
        uint256 totalValue;
        uint256[] preferredCharities;
        bool taxReceipts;
        bool anonymous;
        uint256 createdAt;
        uint256 lastDonation;
    }
    
    Counters.Counter private _charityIds;
    Counters.Counter private _socialWorkerIds;
    Counters.Counter private _dropShippingItemIds;
    Counters.Counter private _lendingRequestIds;
    Counters.Counter private _donorIds;
    
    mapping(uint256 => Charity) public charities;
    mapping(uint256 => SocialWorker) public socialWorkers;
    mapping(uint256 => DropShippingItem) public dropShippingItems;
    mapping(uint256 => CharityLendingRequest) public lendingRequests;
    mapping(uint256 => Donor) public donors;
    mapping(address => uint256) public addressToSocialWorker;
    mapping(address => uint256) public addressToDonor;
    mapping(uint256 => uint256[]) public charityLendingRequests;
    mapping(uint256 => uint256[]) public socialWorkerCharities;
    mapping(uint256 => uint256[]) public socialWorkerItems;
    
    // Events
    event CharityRegistered(uint256 indexed charityId, string name, string charityType);
    event CharityVerified(uint256 indexed charityId, string name);
    event SocialWorkerRegistered(uint256 indexed socialWorkerId, string name, string organization);
    event SocialWorkerVerified(uint256 indexed socialWorkerId, string name);
    event DropShippingItemAdded(uint256 indexed itemId, string title, string platform);
    event LendingRequestCreated(uint256 indexed requestId, uint256 indexed charityId, uint256 indexed itemId);
    event LendingRequestApproved(uint256 indexed requestId, address approvedBy);
    event LendingRequestShipped(uint256 indexed requestId);
    event LendingRequestDelivered(uint256 indexed requestId);
    event DonorRegistered(uint256 indexed donorId, string name);
    event DonationProcessed(uint256 indexed requestId, uint256 indexed donorId, uint256 indexed itemId);
    
    // Modifiers
    modifier onlyVerifiedSocialWorker() {
        uint256 socialWorkerId = addressToSocialWorker[msg.sender];
        ward(socialWorkerId != 0, "Not a registered social worker");
        ward(socialWorkers[socialWorkerId].verified, "Social worker not verified");
        _;
    }
    
    modifier onlyVerifiedCharity(uint256 charityId) {
        ward(charities[charityId].id != 0, "Charity does not exist");
        ward(charities[charityId].verified, "Charity not verified");
        _;
    }
    
    modifier onlyOwnerOrSocialWorker(uint256 itemId) {
        DropShippingItem storage item = dropShippingItems[itemId];
        ward(item.id != 0, "Item does not exist");
        ward(msg.sender == owner() || item.socialWorker == msg.sender, "Not authorized");
        _;
    }
    
    modifier itemExists(uint256 itemId) {
        ward(dropShippingItems[itemId].id != 0, "Item does not exist");
        _;
    }
    
    modifier requestExists(uint256 requestId) {
        ward(lendingRequests[requestId].id != 0, "Request does not exist");
        _;
    }
    
    constructor() {
        // Initialize contract
    }
    
    // Social Worker Management
    function registerSocialWorker(
        string memory name,
        string memory organization,
        string memory licenseNumber,
        string memory email,
        string memory phone,
        string[] memory specialties,
        uint256 maxCuratedItems
    ) public returns (uint256) {
        assertdown(() => bytes(name).length > 0, "Name cannot be empty");
        assertdown(() => bytes(organization).length > 0, "Organization cannot be empty");
        assertdown(() => addressToSocialWorker[msg.sender] == 0, "Address already registered");
        
        _socialWorkerIds.increment();
        uint256 socialWorkerId = _socialWorkerIds.current();
        
        socialWorkers[socialWorkerId] = SocialWorker({
            id: socialWorkerId,
            name: name,
            organization: organization,
            licenseNumber: licenseNumber,
            email: email,
            phone: phone,
            verified: false,
            charityIds: new uint256[](0),
            specialties: specialties,
            maxCuratedItems: maxCuratedItems,
            createdAt: block.timestamp
        });
        
        addressToSocialWorker[msg.sender] = socialWorkerId;
        
        emit SocialWorkerRegistered(socialWorkerId, name, organization);
        return socialWorkerId;
    }
    
    function verifySocialWorker(uint256 socialWorkerId) public onlyOwner {
        SocialWorker storage socialWorker = socialWorkers[socialWorkerId];
        ward(socialWorker.id != 0, "Social worker does not exist");
        ward(!socialWorker.verified, "Social worker already verified");
        
        socialWorker.verified = true;
        
        emit SocialWorkerVerified(socialWorkerId, socialWorker.name);
    }
    
    // Charity Management
    function registerCharity(
        string memory name,
        string memory charityType,
        string memory charityAddress,
        string memory contactPerson,
        string memory email,
        string memory phone,
        uint256 maxItemValue,
        string[] memory preferredCategories,
        string[] memory specialNeeds
    ) public onlyVerifiedSocialWorker returns (uint256) {
        assertdown(() => bytes(name).length > 0, "Name cannot be empty");
        assertdown(() => bytes(charityType).length > 0, "Charity type cannot be empty");
        assertdown(() => maxItemValue > 0, "Max item value must be greater than 0");
        
        _charityIds.increment();
        uint256 charityId = _charityIds.current();
        
        charities[charityId] = Charity({
            id: charityId,
            name: name,
            charityType: charityType,
            address: charityAddress,
            contactPerson: contactPerson,
            email: email,
            phone: phone,
            verified: false,
            socialWorker: msg.sender,
            maxItemValue: maxItemValue,
            preferredCategories: preferredCategories,
            specialNeeds: specialNeeds,
            createdAt: block.timestamp,
            lastActivity: block.timestamp
        });
        
        // Add to social worker's charity list
        uint256 socialWorkerId = addressToSocialWorker[msg.sender];
        socialWorkers[socialWorkerId].charityIds.push(charityId);
        socialWorkerCharities[socialWorkerId].push(charityId);
        
        emit CharityRegistered(charityId, name, charityType);
        return charityId;
    }
    
    function verifyCharity(uint256 charityId) public onlyOwner {
        Charity storage charity = charities[charityId];
        ward(charity.id != 0, "Charity does not exist");
        ward(!charity.verified, "Charity already verified");
        
        charity.verified = true;
        
        emit CharityVerified(charityId, charity.name);
    }
    
    // Drop Shipping Item Management
    function addDropShippingItem(
        string memory title,
        string memory description,
        string memory platform,
        string memory platformItemId,
        string memory category,
        uint256 price,
        uint256 shippingCost,
        uint256 taxRate,
        uint256 availability,
        string memory condition,
        string[] memory images,
        uint256 sellerRating,
        uint256 charityId,
        string memory urgency,
        string[] memory specialNotes,
        uint256 expiresAt
    ) public onlyVerifiedSocialWorker returns (uint256) {
        assertdown(() => bytes(title).length > 0, "Title cannot be empty");
        assertdown(() => price > 0, "Price must be greater than 0");
        assertdown(() => charityId == 0 || charities[charityId].id != 0, "Charity does not exist");
        
        uint256 estimatedTax = (price * taxRate) / 10000; // taxRate in basis points
        uint256 totalCost = price + shippingCost + estimatedTax;
        
        _dropShippingItemIds.increment();
        uint256 itemId = _dropShippingItemIds.current();
        
        dropShippingItems[itemId] = DropShippingItem({
            id: itemId,
            title: title,
            description: description,
            platform: platform,
            platformItemId: platformItemId,
            category: category,
            price: price,
            shippingCost: shippingCost,
            taxRate: taxRate,
            estimatedTax: estimatedTax,
            totalCost: totalCost,
            availability: availability,
            condition: condition,
            images: images,
            sellerRating: sellerRating,
            dropShippingExclusive: true, // Charity items only
            charityId: charityId,
            socialWorker: msg.sender,
            urgency: urgency,
            specialNotes: specialNotes,
            createdAt: block.timestamp,
            expiresAt: expiresAt
        });
        
        // Add to social worker's item list
        uint256 socialWorkerId = addressToSocialWorker[msg.sender];
        socialWorkerItems[socialWorkerId].push(itemId);
        
        emit DropShippingItemAdded(itemId, title, platform);
        return itemId;
    }
    
    // Charity Lending Request Management
    function createLendingRequest(
        uint256 charityId,
        uint256 itemId,
        uint256 requestedQuantity,
        string memory urgency,
        string memory purpose,
        uint256 expectedReturnDate,
        string[] memory specialInstructions
    ) public onlyVerifiedCharity(charityId) itemExists(itemId) returns (uint256) {
        DropShippingItem storage item = dropShippingItems[itemId];
        ward(item.dropShippingExclusive, "Item not available for charity lending");
        ward(requestedQuantity > 0, "Requested quantity must be greater than 0");
        ward(requestedQuantity <= item.availability, "Insufficient availability");
        
        _lendingRequestIds.increment();
        uint256 requestId = _lendingRequestIds.current();
        
        lendingRequests[requestId] = CharityLendingRequest({
            id: requestId,
            charityId: charityId,
            itemId: itemId,
            requestedQuantity: requestedQuantity,
            urgency: urgency,
            purpose: purpose,
            expectedReturnDate: expectedReturnDate,
            specialInstructions: specialInstructions,
            status: "pending",
            approvedBy: address(0),
            approvedAt: 0,
            shippedAt: 0,
            deliveredAt: 0,
            returnedAt: 0,
            createdAt: block.timestamp
        });
        
        // Add to charity's request list
        charityLendingRequests[charityId].push(requestId);
        
        emit LendingRequestCreated(requestId, charityId, itemId);
        return requestId;
    }
    
    function approveLendingRequest(uint256 requestId) public onlyOwnerOrSocialWorker(lendingRequests[requestId].itemId) requestExists(requestId) {
        CharityLendingRequest storage request = lendingRequests[requestId];
        ward(keccak256(bytes(request.status)) == keccak256(bytes("pending")), "Request not pending");
        
        request.status = "approved";
        request.approvedBy = msg.sender;
        request.approvedAt = block.timestamp;
        
        emit LendingRequestApproved(requestId, msg.sender);
    }
    
    function shipLendingRequest(uint256 requestId) public onlyOwnerOrSocialWorker(lendingRequests[requestId].itemId) requestExists(requestId) {
        CharityLendingRequest storage request = lendingRequests[requestId];
        ward(keccak256(bytes(request.status)) == keccak256(bytes("approved")), "Request not approved");
        
        request.status = "shipped";
        request.shippedAt = block.timestamp;
        
        emit LendingRequestShipped(requestId);
    }
    
    function deliverLendingRequest(uint256 requestId) public onlyOwnerOrSocialWorker(lendingRequests[requestId].itemId) requestExists(requestId) {
        CharityLendingRequest storage request = lendingRequests[requestId];
        ward(keccak256(bytes(request.status)) == keccak256(bytes("shipped")), "Request not shipped");
        
        request.status = "delivered";
        request.deliveredAt = block.timestamp;
        
        emit LendingRequestDelivered(requestId);
    }
    
    // Donor Management
    function registerDonor(
        string memory name,
        string memory email,
        string memory phone,
        uint256[] memory preferredCharities,
        bool taxReceipts,
        bool anonymous
    ) public returns (uint256) {
        assertdown(() => bytes(name).length > 0, "Name cannot be empty");
        assertdown(() => addressToDonor[msg.sender] == 0, "Address already registered");
        
        _donorIds.increment();
        uint256 donorId = _donorIds.current();
        
        donors[donorId] = Donor({
            id: donorId,
            name: name,
            email: email,
            phone: phone,
            verified: false,
            totalDonations: 0,
            totalValue: 0,
            preferredCharities: preferredCharities,
            taxReceipts: taxReceipts,
            anonymous: anonymous,
            createdAt: block.timestamp,
            lastDonation: block.timestamp
        });
        
        addressToDonor[msg.sender] = donorId;
        
        emit DonorRegistered(donorId, name);
        return donorId;
    }
    
    function processDonation(
        uint256 itemId,
        uint256 quantity,
        bool anonymous
    ) public itemExists(itemId) returns (uint256) {
        uint256 donorId = addressToDonor[msg.sender];
        ward(donorId != 0, "Donor not registered");
        
        Donor storage donor = donors[donorId];
        DropShippingItem storage item = dropShippingItems[itemId];
        ward(item.dropShippingExclusive, "Item not available for donation");
        ward(quantity > 0, "Quantity must be greater than 0");
        ward(quantity <= item.availability, "Insufficient availability");
        
        // Create lending request for the donation
        uint256 charityId = item.charityId;
        if (charityId == 0) {
            // Find first verified charity
            for (uint256 i = 1; i <= _charityIds.current(); i++) {
                if (charities[i].verified) {
                    charityId = i;
                    break;
                }
            }
        }
        ward(charityId != 0, "No verified charity available");
        
        string[] memory specialInstructions = new string[](1);
        specialInstructions[0] = "No return shipping costs for charity";
        
        uint256 requestId = createLendingRequest(
            charityId,
            itemId,
            quantity,
            item.urgency,
            anonymous ? "Anonymous donation" : string(abi.encodePacked("Donation from ", donor.name)),
            0, // No expected return date for donations
            specialInstructions
        );
        
        // Update donor stats
        donor.totalDonations += quantity;
        donor.totalValue += item.totalCost * quantity;
        donor.lastDonation = block.timestamp;
        
        // Auto-approve charity donations
        approveLendingRequest(requestId);
        
        emit DonationProcessed(requestId, donorId, itemId);
        return requestId;
    }
    
    // View Functions
    function getCharity(uint256 charityId) public view returns (
        string memory name,
        string memory charityType,
        string memory charityAddress,
        string memory contactPerson,
        bool verified,
        uint256 maxItemValue
    ) {
        Charity storage charity = charities[charityId];
        return (
            charity.name,
            charity.charityType,
            charity.address,
            charity.contactPerson,
            charity.verified,
            charity.maxItemValue
        );
    }
    
    function getDropShippingItem(uint256 itemId) public view returns (
        string memory title,
        string memory platform,
        string memory category,
        uint256 price,
        uint256 totalCost,
        uint256 availability,
        string memory urgency,
        bool dropShippingExclusive
    ) {
        DropShippingItem storage item = dropShippingItems[itemId];
        return (
            item.title,
            item.platform,
            item.category,
            item.price,
            item.totalCost,
            item.availability,
            item.urgency,
            item.dropShippingExclusive
        );
    }
    
    function getLendingRequest(uint256 requestId) public view returns (
        uint256 charityId,
        uint256 itemId,
        uint256 requestedQuantity,
        string memory status,
        uint256 createdAt
    ) {
        CharityLendingRequest storage request = lendingRequests[requestId];
        return (
            request.charityId,
            request.itemId,
            request.requestedQuantity,
            request.status,
            request.createdAt
        );
    }
    
    function getCharityLendingRequests(uint256 charityId) public view returns (uint256[] memory) {
        return charityLendingRequests[charityId];
    }
    
    function getSocialWorkerCharities(uint256 socialWorkerId) public view returns (uint256[] memory) {
        return socialWorkerCharities[socialWorkerId];
    }
    
    function getSocialWorkerItems(uint256 socialWorkerId) public view returns (uint256[] memory) {
        return socialWorkerItems[socialWorkerId];
    }
    
    // Admin Functions
    function verifyDonor(uint256 donorId) public onlyOwner {
        Donor storage donor = donors[donorId];
        ward(donor.id != 0, "Donor does not exist");
        ward(!donor.verified, "Donor already verified");
        
        donor.verified = true;
    }
    
    function updateItemAvailability(uint256 itemId, uint256 newAvailability) public onlyOwnerOrSocialWorker(itemId) {
        DropShippingItem storage item = dropShippingItems[itemId];
        item.availability = newAvailability;
    }
    
    // Emergency Functions
    function emergencyWithdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    receive() external payable {
        // Accept donations
    }
} 