# Distributed Inventory Sharing Network

A decentralized platform for sharing physical items with smart contract-based security and automated shipping fee management.

## Features

- Smart contract-based item lending and borrowing
- Double shipping fee deposit system for security
- Optional buyout prices for permanent transfers
- Ethereum-based transaction security
- Modern web interface with Material-UI
- Kotlin backend with JAX-RS (Jersey)

## Prerequisites

- JDK 17 or later
- Node.js 16 or later
- Ethereum wallet (MetaMask recommended)
- PostgreSQL database

## Project Structure

```
.
├── backend/                 # Kotlin backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── kotlin/     # Kotlin source files
│   │   │   └── resources/  # Configuration files
│   │   │
│   │   └── build.gradle.kts    # Gradle build configuration
├── frontend/               # React TypeScript frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contracts/     # Smart contracts
│   │   └── services/      # TypeScript services
│   └── package.json       # NPM package configuration
└── README.md
```

## Setup

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Build the project:
   ```bash
   ./gradlew build
   ```

3. Run the application:
   ```bash
   ./gradlew appRun
   ```

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Smart Contract

The platform uses a Solidity smart contract to manage:
- Item creation and ownership
- Lending and borrowing
- Shipping fee deposits
- Buyout transactions

The contract ensures:
- Double shipping fee deposit for security
- Automatic return of deposits upon item return
- Secure transfer of ownership for buyouts

## Security Features

1. Double Shipping Fee Deposit:
   - One portion covers shipping costs
   - Second portion held as security deposit
   - Automatically returned upon item return

2. Smart Contract Security:
   - Cryptographic verification of transactions
   - Immutable record of item status
   - Automated enforcement of lending terms

3. User Protection:
   - Suspension system for malicious users
   - Buyout options for permanent transfers
   - Location tracking for valuable items

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.