# Inventory Smart Contract PACT Tests
# This file defines the expected interactions between the frontend and smart contract

Pact {
  "consumer": {
    "name": "inventory-frontend"
  },
  "provider": {
    "name": "inventory-smart-contract"
  },
  "interactions": [
    {
      "description": "Create a new inventory item",
      "request": {
        "method": "POST",
        "path": "/contract/createItem",
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "name": "Test Item",
          "description": "A test item for lending",
          "shippingCost": "1000000000000000000",
          "buyoutPrice": "5000000000000000000",
          "maxLendingDuration": "2592000",
          "metadata": "ipfs://QmTestHash"
        }
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "success": true,
          "itemId": "1",
          "transactionHash": "0x1234567890abcdef",
          "gasUsed": "150000",
          "events": [
            {
              "event": "ItemCreated",
              "itemId": "1",
              "owner": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
              "name": "Test Item"
            }
          ]
        }
      }
    },
    {
      "description": "Lend an item with double shipping deposit",
      "request": {
        "method": "POST",
        "path": "/contract/lendItem",
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "itemId": "1",
          "borrowerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
          "depositAmount": "2000000000000000000"
        }
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "success": true,
          "transactionHash": "0xabcdef1234567890",
          "gasUsed": "120000",
          "events": [
            {
              "event": "ItemLent",
              "itemId": "1",
              "borrower": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
              "securityDeposit": "1000000000000000000",
              "shippingCost": "1000000000000000000"
            }
          ]
        }
      }
    },
    {
      "description": "Return an item and get security deposit refund",
      "request": {
        "method": "POST",
        "path": "/contract/returnItem",
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "itemId": "1",
          "borrowerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
        }
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "success": true,
          "transactionHash": "0x7890abcdef123456",
          "gasUsed": "80000",
          "refundAmount": "1000000000000000000",
          "events": [
            {
              "event": "ItemReturned",
              "itemId": "1",
              "borrower": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
              "securityRefund": "1000000000000000000"
            },
            {
              "event": "ShippingFundForwarded",
              "itemId": "1",
              "amount": "1000000000000000000"
            }
          ]
        }
      }
    },
    {
      "description": "Early return with shipback payment",
      "request": {
        "method": "POST",
        "path": "/contract/earlyReturnItem",
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "itemId": "1",
          "borrowerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
          "shipbackPayment": "1000000000000000000"
        }
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "success": true,
          "transactionHash": "0x4567890abcdef123",
          "gasUsed": "100000",
          "securityRefund": "1000000000000000000",
          "shipbackCost": "1000000000000000000",
          "events": [
            {
              "event": "ItemEarlyReturned",
              "itemId": "1",
              "borrower": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
              "shippingCostPaid": "1000000000000000000"
            }
          ]
        }
      }
    },
    {
      "description": "Request to be next shipper",
      "request": {
        "method": "POST",
        "path": "/contract/requestNextShipper",
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "itemId": "1",
          "requesterAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
          "offeredShippingCost": "1000000000000000000"
        }
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "success": true,
          "transactionHash": "0xdef1234567890abc",
          "gasUsed": "90000",
          "events": [
            {
              "event": "NextShipperRequested",
              "itemId": "1",
              "requester": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
              "offeredCost": "1000000000000000000"
            }
          ]
        }
      }
    },
    {
      "description": "Get item information",
      "request": {
        "method": "GET",
        "path": "/contract/getItem/1"
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "name": "Test Item",
          "description": "A test item for lending",
          "owner": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
          "currentHolder": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
          "shippingCost": "1000000000000000000",
          "buyoutPrice": "5000000000000000000",
          "isAvailable": true,
          "isSold": false,
          "isLost": false,
          "createdAt": "1640995200",
          "metadata": "ipfs://QmTestHash",
          "shippingFund": "1000000000000000000"
        }
      }
    },
    {
      "description": "Get user information",
      "request": {
        "method": "GET",
        "path": "/contract/getUserInfo/0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "reputation": "100",
          "totalItemsLent": "5",
          "totalItemsBorrowed": "3",
          "isSuspended": false,
          "suspensionEndTime": "0",
          "totalDeposits": "0"
        }
      }
    }
  ],
  "metadata": {
    "pact-specification": {
      "version": "3.0.0"
    },
    "pact-jvm": {
      "version": "4.1.0"
    }
  }
} 