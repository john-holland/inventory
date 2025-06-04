import { ethers } from 'ethers';
import InventoryContract from '../contracts/InventoryContract.json';

export interface InventoryItem {
    id: string;
    name: string;
    description: string;
    ownerId: string;
    currentHolderId: string | null;
    status: 'AVAILABLE' | 'LENT' | 'SOLD' | 'RETURNED' | 'LOST';
    shippingCost: number;
    buyoutPrice: number | null;
    createdAt: Date;
    updatedAt: Date;
    contractAddress: string | null;
    location: {
        latitude: number;
        longitude: number;
        address: string;
    };
}

export class InventoryService {
    private contract: ethers.Contract;
    private provider: ethers.Provider;
    private signer: ethers.Signer;

    constructor(contractAddress: string, provider: ethers.Provider, signer: ethers.Signer) {
        this.provider = provider;
        this.signer = signer;
        this.contract = new ethers.Contract(contractAddress, InventoryContract.abi, signer);
    }

    async createItem(
        name: string,
        description: string,
        shippingCost: number,
        buyoutPrice: number | null
    ): Promise<string> {
        const tx = await this.contract.createItem(
            name,
            description,
            ethers.parseEther(shippingCost.toString()),
            buyoutPrice ? ethers.parseEther(buyoutPrice.toString()) : 0
        );
        const receipt = await tx.wait();
        const event = receipt.events?.find(e => e.event === 'ItemCreated');
        return event?.args?.itemId;
    }

    async lendItem(itemId: string, shippingCost: number): Promise<void> {
        const tx = await this.contract.lendItem(itemId, {
            value: ethers.parseEther((shippingCost * 2).toString())
        });
        await tx.wait();
    }

    async returnItem(itemId: string): Promise<void> {
        const tx = await this.contract.returnItem(itemId);
        await tx.wait();
    }

    async buyItem(itemId: string, buyoutPrice: number): Promise<void> {
        const tx = await this.contract.buyItem(itemId, {
            value: ethers.parseEther(buyoutPrice.toString())
        });
        await tx.wait();
    }

    async getItem(itemId: string): Promise<InventoryItem> {
        const item = await this.contract.getItem(itemId);
        return {
            id: itemId,
            name: item.name,
            description: item.description,
            ownerId: item.owner,
            currentHolderId: item.currentHolder,
            status: this.mapContractStatus(item.isAvailable, item.isSold),
            shippingCost: Number(ethers.formatEther(item.shippingCost)),
            buyoutPrice: Number(ethers.formatEther(item.buyoutPrice)) || null,
            createdAt: new Date(Number(item.createdAt) * 1000),
            updatedAt: new Date(Number(item.updatedAt) * 1000),
            contractAddress: this.contract.address,
            location: {
                latitude: 0, // These would need to be stored off-chain
                longitude: 0,
                address: ''
            }
        };
    }

    private mapContractStatus(isAvailable: boolean, isSold: boolean): InventoryItem['status'] {
        if (isSold) return 'SOLD';
        if (isAvailable) return 'AVAILABLE';
        return 'LENT';
    }
} 