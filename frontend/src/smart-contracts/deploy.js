const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying Enhanced Inventory Contract...");

    // Get the contract factory
    const EnhancedInventoryContract = await ethers.getContractFactory("EnhancedInventoryContract");
    
    // Deploy the contract
    const inventoryContract = await EnhancedInventoryContract.deploy();
    
    // Wait for deployment to finish
    await inventoryContract.deployed();
    
    console.log("Enhanced Inventory Contract deployed to:", inventoryContract.address);
    
    // Verify deployment
    console.log("Contract owner:", await inventoryContract.owner());
    console.log("Min reputation for lending:", await inventoryContract.MIN_REPUTATION_FOR_LENDING());
    console.log("Max lending duration:", await inventoryContract.MAX_LENDING_DURATION());
    
    return inventoryContract.address;
}

// Execute deployment
main()
    .then((address) => {
        console.log("Deployment successful! Contract address:", address);
        process.exit(0);
    })
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    }); 