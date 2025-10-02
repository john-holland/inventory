import { ethers } from 'ethers';
import { ward, wardString, wardNumber, wardAddress, assertdown } from '../utils/assertions';

// Simple contract ABI interface - in a real app, this would come from the compiled contract
const CONTRACT_ABI = [
    "function createItem(string name, string description, uint256 shippingCost, uint256 buyoutPrice, uint256 maxLendingDuration, string metadata) external returns (uint256)",
    "function getItem(uint256 itemId) external view returns (string name, string description, address owner, address currentHolder, uint256 shippingCost, uint256 buyoutPrice, bool isAvailable, bool isSold, bool isLost, uint256 createdAt, string metadata, uint256 shippingFund, uint256 additionalProtection, bool hasDispute)",
    "function lendItem(uint256 itemId) external payable",
    "function returnItem(uint256 itemId) external",
    "function earlyReturnItem(uint256 itemId) external payable",
    "function requestNextShipper(uint256 itemId) external payable",
    "function acceptNextShipper(uint256 itemId, address requester) external",
    "function rejectNextShipper(uint256 itemId, address requester) external payable",
    "function raiseDispute(uint256 itemId, string reason) external",
    "function getNextShipperRequests(uint256 itemId) external view returns (tuple(address requester, uint256 requestTime, uint256 offeredShippingCost, bool isActive)[])",
    "function getItemLendingHistory(uint256 itemId) external view returns (tuple(uint256 itemId, address borrower, uint256 startTime, uint256 endTime, bool wasReturned, uint256 securityDepositAmount, uint256 additionalProtectionAmount, uint256 shippingCostPaid, bool wasEarlyReturn, bool wasDisputed)[])",
    "function buyItem(uint256 itemId) external payable",
    "function reportItemLost(uint256 itemId) external",
    "function withdrawShippingFund(uint256 itemId) external",
    "function setAutoReturnPreference(bool enabled, uint256 thresholdSeconds) external",
    "function getAutoReturnPreference(address user) external view returns (bool enabled, uint256 threshold)",
    "function triggerAutoReturn(uint256 itemId) external",
    "function getUserInfo(address user) external view returns (uint256 reputation, uint256 totalItemsLent, uint256 totalItemsBorrowed, bool isSuspended, uint256 suspensionEndTime, uint256 totalDeposits, uint256 totalAdditionalProtection)",
    "function getUserOwnedItems(address user) external view returns (uint256[])",
    "function getUserBorrowedItems(address user) external view returns (uint256[])",
    "event ItemCreated(uint256 indexed itemId, address indexed owner, string name)",
    "event ItemLent(uint256 indexed itemId, address indexed borrower, uint256 securityDeposit, uint256 additionalProtection, uint256 shippingCost)",
    "event ItemReturned(uint256 indexed itemId, address indexed borrower, uint256 securityRefund, uint256 protectionRefund)",
    "event ItemEarlyReturned(uint256 indexed itemId, address indexed borrower, uint256 shippingCostPaid, uint256 excessRefunded)",
    "event NextShipperRequested(uint256 indexed itemId, address indexed requester, uint256 offeredCost)",
    "event NextShipperAccepted(uint256 indexed itemId, address indexed requester, address indexed currentHolder)",
    "event NextShipperRejected(uint256 indexed itemId, address indexed requester, bool returnedToOwner)",
    "event DisputeRaised(uint256 indexed itemId, address indexed raiser, string reason)",
    "event DisputeResolved(uint256 indexed itemId, address indexed resolver, bool inFavorOfOwner)",
    "event ProtectionDepositMade(address indexed user, uint256 amount)",
    "event ProtectionDepositReleased(address indexed user, uint256 amount)"
];

export interface InventoryItem {
    id: number;
    name: string;
    description: string;
    ownerId: string;
    currentHolderId: string;
    shippingCost: number;
    buyoutPrice?: number;
    status: 'AVAILABLE' | 'LENT' | 'SOLD' | 'LOST';
    hasDispute: boolean;
    shippingFund: number;
    additionalProtection: number;
    metadata?: string;
    createdAt: number;
    updatedAt: number;
}

export interface NextShipperRequest {
    requester: string;
    requestTime: number;
    offeredShippingCost: string;
    isActive: boolean;
}

export interface LendingHistory {
    itemId: number;
    borrower: string;
    startTime: number;
    endTime: number;
    wasReturned: boolean;
    securityDepositAmount: number;
    additionalProtectionAmount: number;
    shippingCostPaid: number;
    wasEarlyReturn: boolean;
    wasDisputed: boolean;
}

export interface UserInfo {
    reputation: number;
    totalItemsLent: number;
    totalItemsBorrowed: number;
    isSuspended: boolean;
    suspensionEndTime: number;
    totalDeposits: number;
    totalAdditionalProtection: number;
}

export interface AutoReturnPreference {
    enabled: boolean;
    threshold: number; // in seconds
}

export class InventoryService {
    private contract: ethers.Contract;
    private provider: ethers.providers.Web3Provider;
    private signer: ethers.Signer;

    constructor(contractAddress: string) {
        // Use assertdown for batch validation - collects all errors before failing
        assertdown((tri) => {
            tri(() => wardString(contractAddress, 'Contract address is required'));
            tri(() => wardAddress(contractAddress, 'Invalid contract address'));
        }, { contractAddress });

        if (typeof window !== 'undefined' && (window as any).ethereum) {
            this.provider = new ethers.providers.Web3Provider((window as any).ethereum);
            this.signer = this.provider.getSigner();
            this.contract = new ethers.Contract(contractAddress, CONTRACT_ABI, this.signer);
        } else {
            throw new Error('Ethereum provider not found. Please install MetaMask.');
        }
    }

    async createItem(
        name: string,
        description: string,
        shippingCost: number,
        buyoutPrice: number = 0,
        maxLendingDuration: number = 30 * 24 * 60 * 60, // 30 days in seconds
        metadata: string = ''
    ): Promise<number> {
        // Batch validate all parameters
        assertdown((tri) => {
            tri(() => wardString(name, 'Item name is required'));
            tri(() => wardString(description, 'Item description is required'));
            tri(() => wardNumber(shippingCost, 'Shipping cost must be positive', 0));
            tri(() => wardNumber(buyoutPrice, 'Buyout price must be non-negative', 0));
            tri(() => wardNumber(maxLendingDuration, 'Lending duration must be positive', 0));
        }, { name, description, shippingCost, buyoutPrice, maxLendingDuration, metadata });

        try {
            const tx = await this.contract.createItem(
                name,
                description,
                ethers.utils.parseEther(shippingCost.toString()),
                ethers.utils.parseEther(buyoutPrice.toString()),
                maxLendingDuration,
                metadata
            );
            const receipt = await tx.wait();
            
            // Extract item ID from event
            const event = receipt.events?.find((e: any) => e.event === 'ItemCreated');
            return event?.args?.itemId?.toNumber() || 0;
        } catch (error) {
            console.error('Error creating item:', error);
            throw new Error('Failed to create item on blockchain');
        }
    }

    async getItem(itemId: number): Promise<InventoryItem> {
        wardNumber(itemId, 'Item ID must be positive', 0);

        try {
            const item = await this.contract.getItem(itemId);
            return {
                id: itemId,
                name: item.name,
                description: item.description,
                ownerId: item.owner,
                currentHolderId: item.currentHolder,
                shippingCost: parseFloat(ethers.utils.formatEther(item.shippingCost)),
                buyoutPrice: item.buyoutPrice.gt(0) ? parseFloat(ethers.utils.formatEther(item.buyoutPrice)) : undefined,
                status: this.determineStatus(item),
                hasDispute: item.hasDispute,
                shippingFund: parseFloat(ethers.utils.formatEther(item.shippingFund)),
                additionalProtection: parseFloat(ethers.utils.formatEther(item.additionalProtection)),
                metadata: item.metadata,
                createdAt: item.createdAt.toNumber(),
                updatedAt: item.updatedAt.toNumber()
            };
        } catch (error) {
            console.error('Error getting item:', error);
            throw new Error('Failed to retrieve item from blockchain');
        }
    }

    async lendItem(itemId: number, shippingCost: number, useAdditionalProtection: boolean = false): Promise<void> {
        assertdown((tri) => {
            tri(() => wardNumber(itemId, 'Item ID must be positive', 0));
            tri(() => wardNumber(shippingCost, 'Shipping cost must be positive', 0));
        }, { itemId, shippingCost, useAdditionalProtection });

        try {
            // Calculate payment amount: 2x for basic, 3x for additional protection
            const multiplier = useAdditionalProtection ? 3 : 2;
            const payment = ethers.utils.parseEther((shippingCost * multiplier).toString());
            
            const tx = await this.contract.lendItem(itemId, { value: payment });
            await tx.wait();
        } catch (error) {
            console.error('Error lending item:', error);
            throw new Error('Failed to borrow item from blockchain');
        }
    }

    async returnItem(itemId: number): Promise<void> {
        wardNumber(itemId, 'Item ID must be positive', 0);

        try {
            const tx = await this.contract.returnItem(itemId);
            await tx.wait();
        } catch (error) {
            console.error('Error returning item:', error);
            throw new Error('Failed to return item to blockchain');
        }
    }

    async earlyReturnItem(itemId: number, shipbackPayment: number): Promise<void> {
        assertdown((tri) => {
            tri(() => wardNumber(itemId, 'Item ID must be positive', 0));
            tri(() => wardNumber(shipbackPayment, 'Shipback payment must be positive', 0));
        }, { itemId, shipbackPayment });

        try {
            const payment = ethers.utils.parseEther(shipbackPayment.toString());
            const tx = await this.contract.earlyReturnItem(itemId, { value: payment });
            await tx.wait();
        } catch (error) {
            console.error('Error with early return:', error);
            throw new Error('Failed to return item early');
        }
    }

    async requestNextShipper(itemId: number, offeredShippingCost: number, useAdditionalProtection: boolean = false): Promise<void> {
        assertdown((tri) => {
            tri(() => wardNumber(itemId, 'Item ID must be positive', 0));
            tri(() => wardNumber(offeredShippingCost, 'Offered shipping cost must be positive', 0));
        }, { itemId, offeredShippingCost, useAdditionalProtection });

        try {
            // Calculate payment amount: 2x for basic, 3x for additional protection
            const multiplier = useAdditionalProtection ? 3 : 2;
            const payment = ethers.utils.parseEther((offeredShippingCost * multiplier).toString());
            
            const tx = await this.contract.requestNextShipper(itemId, { value: payment });
            await tx.wait();
        } catch (error) {
            console.error('Error requesting next shipper:', error);
            throw new Error('Failed to request next shipper');
        }
    }

    async acceptNextShipper(itemId: number, requester: string): Promise<void> {
        assertdown((tri) => {
            tri(() => wardNumber(itemId, 'Item ID must be positive', 0));
            tri(() => wardAddress(requester, 'Invalid requester address'));
        }, { itemId, requester });

        try {
            const tx = await this.contract.acceptNextShipper(itemId, requester);
            await tx.wait();
        } catch (error) {
            console.error('Error accepting next shipper:', error);
            throw new Error('Failed to accept next shipper');
        }
    }

    async rejectNextShipper(itemId: number, requester: string, returnShippingPayment: number): Promise<void> {
        assertdown((tri) => {
            tri(() => wardNumber(itemId, 'Item ID must be positive', 0));
            tri(() => wardAddress(requester, 'Invalid requester address'));
            tri(() => wardNumber(returnShippingPayment, 'Return shipping payment must be positive', 0));
        }, { itemId, requester, returnShippingPayment });

        try {
            const payment = ethers.utils.parseEther(returnShippingPayment.toString());
            const tx = await this.contract.rejectNextShipper(itemId, requester, { value: payment });
            await tx.wait();
        } catch (error) {
            console.error('Error rejecting next shipper:', error);
            throw new Error('Failed to reject next shipper');
        }
    }

    async raiseDispute(itemId: number, reason: string): Promise<void> {
        assertdown((tri) => {
            tri(() => wardNumber(itemId, 'Item ID must be positive', 0));
            tri(() => wardString(reason, 'Dispute reason is required'));
        }, { itemId, reason });

        try {
            const tx = await this.contract.raiseDispute(itemId, reason);
            await tx.wait();
        } catch (error) {
            console.error('Error raising dispute:', error);
            throw new Error('Failed to raise dispute');
        }
    }

    async getNextShipperRequests(itemId: number): Promise<NextShipperRequest[]> {
        wardNumber(itemId, 'Item ID must be positive', 0);

        try {
            const requests = await this.contract.getNextShipperRequests(itemId);
            return requests.map((request: any) => ({
                requester: request.requester,
                requestTime: request.requestTime.toNumber(),
                offeredShippingCost: ethers.utils.formatEther(request.offeredShippingCost),
                isActive: request.isActive
            }));
        } catch (error) {
            console.error('Error getting next shipper requests:', error);
            throw new Error('Failed to get next shipper requests');
        }
    }

    async getItemLendingHistory(itemId: number): Promise<LendingHistory[]> {
        wardNumber(itemId, 'Item ID must be positive', 0);

        try {
            const history = await this.contract.getItemLendingHistory(itemId);
            return history.map((entry: any) => ({
                itemId: entry.itemId.toNumber(),
                borrower: entry.borrower,
                startTime: entry.startTime.toNumber(),
                endTime: entry.endTime.toNumber(),
                wasReturned: entry.wasReturned,
                securityDepositAmount: parseFloat(ethers.utils.formatEther(entry.securityDepositAmount)),
                additionalProtectionAmount: parseFloat(ethers.utils.formatEther(entry.additionalProtectionAmount)),
                shippingCostPaid: parseFloat(ethers.utils.formatEther(entry.shippingCostPaid)),
                wasEarlyReturn: entry.wasEarlyReturn,
                wasDisputed: entry.wasDisputed
            }));
        } catch (error) {
            console.error('Error getting lending history:', error);
            throw new Error('Failed to get lending history');
        }
    }

    async buyItem(itemId: number, buyoutPrice: number): Promise<void> {
        assertdown((tri) => {
            tri(() => wardNumber(itemId, 'Item ID must be positive', 0));
            tri(() => wardNumber(buyoutPrice, 'Buyout price must be positive', 0));
        }, { itemId, buyoutPrice });

        try {
            const payment = ethers.utils.parseEther(buyoutPrice.toString());
            const tx = await this.contract.buyItem(itemId, { value: payment });
            await tx.wait();
        } catch (error) {
            console.error('Error buying item:', error);
            throw new Error('Failed to buy item');
        }
    }

    async reportItemLost(itemId: number): Promise<void> {
        wardNumber(itemId, 'Item ID must be positive', 0);

        try {
            const tx = await this.contract.reportItemLost(itemId);
            await tx.wait();
        } catch (error) {
            console.error('Error reporting item lost:', error);
            throw new Error('Failed to report item as lost');
        }
    }

    async withdrawShippingFund(itemId: number): Promise<void> {
        wardNumber(itemId, 'Item ID must be positive', 0);

        try {
            const tx = await this.contract.withdrawShippingFund(itemId);
            await tx.wait();
        } catch (error) {
            console.error('Error withdrawing shipping fund:', error);
            throw new Error('Failed to withdraw shipping fund');
        }
    }

    async getUserInfo(userAddress: string): Promise<UserInfo> {
        wardAddress(userAddress, 'Invalid user address');

        try {
            const userInfo = await this.contract.getUserInfo(userAddress);
            return {
                reputation: userInfo.reputation.toNumber(),
                totalItemsLent: userInfo.totalItemsLent.toNumber(),
                totalItemsBorrowed: userInfo.totalItemsBorrowed.toNumber(),
                isSuspended: userInfo.isSuspended,
                suspensionEndTime: userInfo.suspensionEndTime.toNumber(),
                totalDeposits: parseFloat(ethers.utils.formatEther(userInfo.totalDeposits)),
                totalAdditionalProtection: parseFloat(ethers.utils.formatEther(userInfo.totalAdditionalProtection))
            };
        } catch (error) {
            console.error('Error getting user info:', error);
            throw new Error('Failed to get user information');
        }
    }

    async getUserOwnedItems(userAddress: string): Promise<number[]> {
        wardAddress(userAddress, 'Invalid user address');

        try {
            const itemIds = await this.contract.getUserOwnedItems(userAddress);
            return itemIds.map((id: any) => id.toNumber());
        } catch (error) {
            console.error('Error getting user owned items:', error);
            throw new Error('Failed to get user owned items');
        }
    }

    async getUserBorrowedItems(userAddress: string): Promise<number[]> {
        wardAddress(userAddress, 'Invalid user address');

        try {
            const itemIds = await this.contract.getUserBorrowedItems(userAddress);
            return itemIds.map((id: any) => id.toNumber());
        } catch (error) {
            console.error('Error getting user borrowed items:', error);
            throw new Error('Failed to get user borrowed items');
        }
    }

    // Helper methods for payment calculations
    calculateLendingPayment(shippingCost: number, useAdditionalProtection: boolean = false): {
        totalPayment: number;
        securityDeposit: number;
        additionalProtection: number;
        shippingFund: number;
    } {
        const basePayment = shippingCost * 2; // 2x for basic lending
        const additionalPayment = useAdditionalProtection ? shippingCost : 0; // 1x extra for protection
        
        return {
            totalPayment: basePayment + additionalPayment,
            securityDeposit: shippingCost, // 1x as security
            additionalProtection: additionalPayment, // 0 or 1x for protection
            shippingFund: shippingCost // 1x for next shipping
        };
    }

    private determineStatus(item: any): 'AVAILABLE' | 'LENT' | 'SOLD' | 'LOST' {
        if (item.isLost) return 'LOST';
        if (item.isSold) return 'SOLD';
        if (item.isAvailable) return 'AVAILABLE';
        return 'LENT';
    }

    // Helper method to get current user address
    async getCurrentUserAddress(): Promise<string> {
        try {
            return await this.signer.getAddress();
        } catch (error) {
            console.error('Error getting current user address:', error);
            throw new Error('Failed to get current user address');
        }
    }

    // Helper method to check if user is connected
    async isConnected(): Promise<boolean> {
        try {
            const accounts = await this.provider.listAccounts();
            return accounts.length > 0;
        } catch (error) {
            return false;
        }
    }

    // Set auto-return preference for passive early shipping
    async setAutoReturnPreference(enabled: boolean, thresholdDays: number): Promise<void> {
        assertdown((tri) => {
            tri(() => ward(thresholdDays >= 1, 'Threshold must be at least 1 day'));
            tri(() => ward(thresholdDays <= 30, 'Threshold cannot exceed 30 days'));
        }, { enabled, thresholdDays });

        try {
            const thresholdSeconds = thresholdDays * 24 * 60 * 60; // Convert days to seconds
            const tx = await this.contract.setAutoReturnPreference(enabled, thresholdSeconds);
            await tx.wait();
        } catch (error) {
            console.error('Error setting auto-return preference:', error);
            throw new Error('Failed to set auto-return preference');
        }
    }

    // Get user's auto-return preference
    async getAutoReturnPreference(userAddress: string): Promise<AutoReturnPreference> {
        assertdown((tri) => {
            tri(() => wardAddress(userAddress, 'Invalid user address'));
        }, { userAddress });

        try {
            const [enabled, thresholdSeconds] = await this.contract.getAutoReturnPreference(userAddress);
            return {
                enabled,
                threshold: Number(thresholdSeconds) / (24 * 60 * 60) // Convert seconds to days
            };
        } catch (error) {
            console.error('Error getting auto-return preference:', error);
            throw new Error('Failed to get auto-return preference');
        }
    }

    // Trigger auto-return for an item (can be called by anyone if conditions are met)
    async triggerAutoReturn(itemId: number): Promise<void> {
        assertdown((tri) => {
            tri(() => wardNumber(itemId, 'Item ID must be positive', 0));
        }, { itemId });

        try {
            const tx = await this.contract.triggerAutoReturn(itemId);
            await tx.wait();
        } catch (error) {
            console.error('Error triggering auto-return:', error);
            throw new Error('Failed to trigger auto-return');
        }
    }
} 