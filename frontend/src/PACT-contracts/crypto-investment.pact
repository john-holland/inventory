# Crypto and Investment PACT Tests
# This file defines the expected interactions for crypto transactions and investment features

Pact {
  "consumer": {
    "name": "inventory-frontend"
  },
  "provider": {
    "name": "inventory-crypto-service"
  },
  "interactions": [
    {
      "description": "Get current ETH price for shipping cost calculation",
      "request": {
        "method": "GET",
        "path": "/crypto/price/ETH"
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "currency": "ETH",
          "price": "2500.00",
          "timestamp": "1640995200",
          "source": "coinbase"
        }
      }
    },
    {
      "description": "Calculate shipping cost in ETH based on USD amount",
      "request": {
        "method": "POST",
        "path": "/crypto/calculate-shipping",
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "usdAmount": "25.00",
          "fromLocation": "New York, NY",
          "toLocation": "Los Angeles, CA",
          "itemWeight": "2.5",
          "itemDimensions": {
            "length": "12",
            "width": "8",
            "height": "6"
          }
        }
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "usdCost": "25.00",
          "ethCost": "0.01",
          "weiCost": "10000000000000000",
          "estimatedGas": "80000",
          "gasPrice": "20000000000",
          "totalTransactionCost": "0.0116",
          "shippingProvider": "USPS",
          "estimatedDeliveryDays": "3-5"
        }
      }
    },
    {
      "description": "Get user's ETH balance for deposit validation",
      "request": {
        "method": "GET",
        "path": "/crypto/balance/0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
          "balance": "1.5",
          "balanceWei": "1500000000000000000",
          "lastUpdated": "1640995200"
        }
      }
    },
    {
      "description": "Validate transaction before execution",
      "request": {
        "method": "POST",
        "path": "/crypto/validate-transaction",
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "fromAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
          "toAddress": "0x1234567890123456789012345678901234567890",
          "amount": "0.02",
          "gasLimit": "150000",
          "gasPrice": "20000000000",
          "contractAddress": "0xabcdef1234567890abcdef1234567890abcdef12"
        }
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "valid": true,
          "estimatedCost": "0.023",
          "userBalance": "1.5",
          "sufficientFunds": true,
          "warnings": [],
          "recommendations": [
            "Consider using lower gas price during off-peak hours"
          ]
        }
      }
    },
    {
      "description": "Get investment portfolio performance for shipping fund",
      "request": {
        "method": "GET",
        "path": "/investment/portfolio/shipping-fund"
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "totalValue": "125000.00",
          "totalValueEth": "50.0",
          "totalDeposits": "100000.00",
          "totalReturns": "25000.00",
          "annualizedReturn": "0.15",
          "riskLevel": "low",
          "allocation": {
            "stablecoins": "0.40",
            "defi": "0.30",
            "traditional": "0.20",
            "crypto": "0.10"
          },
          "lastRebalanced": "1640995200",
          "nextRebalance": "1641081600"
        }
      }
    },
    {
      "description": "Calculate dividends for item owners",
      "request": {
        "method": "POST",
        "path": "/investment/calculate-dividends",
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "userAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
          "itemsOwned": 5,
          "totalLendingDays": 150,
          "reputation": 100
        }
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "userAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
          "dividendAmount": "0.025",
          "dividendAmountWei": "25000000000000000",
          "calculationFactors": {
            "baseDividend": "0.02",
            "reputationBonus": "0.003",
            "lendingActivityBonus": "0.002"
          },
          "paymentSchedule": "monthly",
          "nextPayment": "1640995200"
        }
      }
    },
    {
      "description": "Get gas price recommendations",
      "request": {
        "method": "GET",
        "path": "/crypto/gas-recommendations"
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "slow": {
            "gwei": "15",
            "wei": "15000000000",
            "estimatedTime": "5-10 minutes"
          },
          "standard": {
            "gwei": "20",
            "wei": "20000000000",
            "estimatedTime": "2-5 minutes"
          },
          "fast": {
            "gwei": "25",
            "wei": "25000000000",
            "estimatedTime": "30 seconds - 2 minutes"
          },
          "networkCongestion": "medium",
          "recommendation": "standard"
        }
      }
    },
    {
      "description": "Track shipping fund investment performance",
      "request": {
        "method": "GET",
        "path": "/investment/performance/shipping-fund/history"
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "performanceHistory": [
            {
              "date": "1640995200",
              "totalValue": "125000.00",
              "dailyReturn": "0.002",
              "cumulativeReturn": "0.25"
            },
            {
              "date": "1640908800",
              "totalValue": "124750.00",
              "dailyReturn": "0.001",
              "cumulativeReturn": "0.248"
            }
          ],
          "metrics": {
            "volatility": "0.08",
            "sharpeRatio": "1.85",
            "maxDrawdown": "0.05",
            "beta": "0.3"
          }
        }
      }
    },
    {
      "description": "Get security deposit insurance options",
      "request": {
        "method": "GET",
        "path": "/investment/insurance/security-deposits"
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "insuranceOptions": [
            {
              "type": "basic",
              "coverage": "0.5",
              "premium": "0.001",
              "description": "Covers 50% of lost security deposits"
            },
            {
              "type": "standard",
              "coverage": "0.8",
              "premium": "0.002",
              "description": "Covers 80% of lost security deposits"
            },
            {
              "type": "premium",
              "coverage": "1.0",
              "premium": "0.003",
              "description": "Covers 100% of lost security deposits"
            }
          ],
          "recommendations": {
            "lowRiskUsers": "basic",
            "mediumRiskUsers": "standard",
            "highRiskUsers": "premium"
          }
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