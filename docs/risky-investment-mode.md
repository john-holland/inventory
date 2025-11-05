# Risky Investment Mode Documentation

## Overview

Risky Investment Mode is an optional feature that allows users to invest their 2x shipping holds (normally reserved for round-trip shipping) in cryptocurrency and yield-generating investments. This feature includes automated risk management, anti-collateral requirements, and 50/50 loss sharing in case of investment failure.

## Key Concepts

### 1. Shipping Hold Investment Rules

#### Standard Rules (Non-Risky Mode)
- **First 2x shipping holds**: NON-INVESTABLE
- **Purpose**: Reserved for round-trip shipping (outbound + return)
- **Rationale**: Ensures shipping costs are always covered
- **Investment blocking**: Prevents crypto investment until 2x threshold secured

#### Risky Mode Exception
- **Optional investment**: Users can choose to invest 2x shipping holds
- **Anti-collateral required**: Additional deposit equal to opposite of risk boundary error
- **Custom risk control**: User chooses percentage of 2x to invest (0-100% slider)
- **Automated monitoring**: Investment robots monitor for descent and auto-withdraw

### 2. Anti-Collateral System

#### Calculation Method
```
Anti-Collateral = Investment Amount × Risk Boundary Error
```

Where:
- **Investment Amount**: Percentage of 2x shipping hold being invested
- **Risk Boundary Error**: Current market risk assessment (typically 15-25%)

#### Example Calculation
- 2x shipping hold: $30.00
- Risk percentage: 50% (user choice)
- Amount at risk: $15.00
- Risk boundary error: 20%
- Required anti-collateral: $15.00 × 0.20 = $3.00

#### Purpose
- **Risk mitigation**: Provides buffer against investment losses
- **Market volatility**: Accounts for current market conditions
- **Dynamic adjustment**: Risk boundary error updates based on market data

### 3. Investment Robot Monitoring

#### Robot Activation
- **Automatic activation**: Robots activate when risky investment mode enabled
- **Continuous monitoring**: Check investment value every 30 seconds
- **Stop-loss triggers**: Automatic withdrawal when threshold reached
- **Market integration**: Coordinate with Variable Flywheel Cron from Plan #2

#### Monitoring Parameters
- **Initial value tracking**: Record investment value at activation
- **Stop-loss threshold**: Typically 15% loss (configurable)
- **Risk tolerance**: Maximum 20% loss before emergency protocols
- **Pull-out period**: Calculate time window for safe withdrawal

#### Emergency Protocols
- **Descent detection**: Identify when investment is at risk
- **Withdrawal window checking**: Verify if withdrawal is possible
- **Emergency execution**: Attempt immediate withdrawal if conditions met
- **Fallout triggering**: If withdrawal fails, trigger 50/50 loss sharing

### 4. Fallout Scenarios & Loss Sharing

#### Fallout Triggers
- **Investment failure**: When crypto investment loses significant value
- **Withdrawal failure**: When emergency withdrawal cannot be executed
- **Market crash**: When market conditions prevent safe withdrawal
- **Robot timeout**: When monitoring systems detect critical risk

#### Loss Calculation
```
Total Costs = Shipping Cost + Insurance Cost
Borrower Share = Total Costs × 0.5
Owner Share = Total Costs × 0.5
Investment Loss = Total Loss - Total Costs
```

#### Example Fallout Scenario
- **Total investment loss**: $50.00
- **Shipping cost**: $15.00
- **Insurance cost**: $5.00
- **Total costs**: $20.00
- **Borrower share**: $10.00
- **Owner share**: $10.00
- **Investment loss**: $30.00 (capital loss for both parties)

#### Recovery Process
- **Automatic refunds**: Process 50/50 refunds automatically
- **Capital loss records**: Generate tax documents for both parties
- **Chat room creation**: Create dispute resolution chat room
- **Robot deactivation**: Deactivate risky investment mode

### 5. Integration with Plan #2 Systems

#### Tax Document Generation
- **Capital loss reports**: Generated automatically for fallout scenarios
- **Tax properties**: Stored in warehousing for tax reporting
- **Document access**: Available through Documents page

#### Chat Room Automation
- **Dispute resolution**: Fallout triggers "Dispute Resolution" chat room
- **Participant notification**: Borrower, owner, and mediator notified
- **Context sharing**: Investment details and loss calculations shared

#### Market Monitoring
- **Variable Flywheel Cron**: Investment robots coordinate with market monitoring
- **ML warehouse**: Robot data shared for optimization
- **Emergency protocols**: Market alerts trigger robot emergency checks

## User Interface

### 1. Risky Investment Mode Controls

#### Enable Risky Mode
- **Toggle switch**: Enable/disable risky investment mode
- **Risk percentage slider**: Choose percentage of 2x to invest (0-100%)
- **Anti-collateral display**: Show required collateral amount
- **Warning messages**: Clear warnings about risks and consequences

#### Risk Configuration
- **Risk percentage**: User-controlled slider from 0-100%
- **Anti-collateral calculation**: Real-time calculation based on current market
- **Risk boundary error**: Displayed current market risk assessment
- **Investment amount**: Shows actual amount being invested

#### Robot Status
- **Active indicator**: Shows if robots are monitoring
- **Last check time**: When robots last checked investment
- **Stop-loss status**: Current stop-loss threshold
- **Emergency status**: Any active emergency protocols

### 2. Investment Status Display

#### Hold Balances
- **Shipping holds (2x)**: $X.XX (Non-investable)
- **Additional holds (3rd x)**: $X.XX (Investable)
- **Insurance holds**: $X.XX (Investable after shipping)
- **Total investable**: $X.XX
- **Current investments**: $X.XX
- **Investment return**: +$X.XX (+X.X%)

#### Risk Information
- **Current risk level**: Low/Medium/High/Critical
- **Risk percentage**: User-selected percentage
- **Anti-collateral deposited**: Amount of collateral held
- **Robots active**: Number of active monitoring robots

## Technical Implementation

### 1. Smart Contract Integration

#### New Fields in Item Struct
```solidity
uint256 shippingHold2x;        // Non-investable 2x shipping hold
uint256 additionalHold;        // Investable 3rd x hold
uint256 insuranceHold;        // Investable insurance hold
bool riskyModeEnabled;        // Risky investment mode flag
uint256 riskyModePercentage;  // % of 2x to invest
uint256 antiCollateral;       // Required collateral amount
bool insuranceHoldInvested;   // Insurance investment flag
address[] investmentRobots;   // Active monitoring robots
```

#### New Functions
- `enableRiskyInvestmentMode()`: Enable risky mode with anti-collateral
- `createAdditionalInvestmentHold()`: Create 3rd x hold (immediately investable)
- `createInsuranceHold()`: Create insurance hold (investable after shipping)
- `triggerInsuranceHoldInvestment()`: Invest insurance after shipping
- `handleFalloutScenario()`: Process fallout with 50/50 split
- `activateInvestmentRobot()`: Activate monitoring robot

#### New Events
- `RiskyModeEnabled()`: Risky mode enabled with parameters
- `InsuranceHoldInvested()`: Insurance hold invested
- `FalloutTriggered()`: Fallout scenario with loss details
- `InvestmentRobotActivated()`: Robot activated for monitoring

### 2. Service Integration

#### InvestmentService
- **Hold tracking**: Track per-item holds and eligibility
- **Risk calculation**: Calculate anti-collateral requirements
- **Eligibility checks**: Determine if holds can be invested
- **Status management**: Get complete investment status

#### InvestmentRobotService
- **Robot management**: Activate, monitor, and deactivate robots
- **Market monitoring**: Process market alerts and volatility
- **Emergency protocols**: Coordinate emergency withdrawal
- **ML integration**: Share data with ML warehouse

#### ShipStationService
- **Rate optimization**: Compare and optimize shipping rates
- **Refund checking**: Verify if label refunds are free
- **Savings reinvestment**: Automatically reinvest optimization savings
- **Conservative approach**: Only optimize when safe and profitable

## Risk Management

### 1. Risk Controls

#### User Controls
- **Risk percentage slider**: User controls how much to invest
- **Anti-collateral requirement**: Mandatory buffer against losses
- **Robot monitoring**: Automated stop-loss and withdrawal
- **Emergency protocols**: Automatic fallout handling

#### System Controls
- **Market monitoring**: Continuous market condition assessment
- **Risk boundary calculation**: Dynamic risk assessment
- **Withdrawal window checking**: Verify withdrawal availability
- **Fallback mechanisms**: Automatic recovery procedures

### 2. Risk Mitigation

#### Anti-Collateral Buffer
- **Market-based calculation**: Based on current market volatility
- **Minimum requirements**: At least 20% of shipping cost
- **Dynamic adjustment**: Updates with market conditions
- **Loss absorption**: Absorbs initial losses before affecting parties

#### Automated Monitoring
- **Continuous checking**: Robots check every 30 seconds
- **Stop-loss triggers**: Automatic withdrawal at threshold
- **Emergency protocols**: Immediate action on critical conditions
- **Market coordination**: Integration with market monitoring systems

#### Fallout Protection
- **50/50 loss sharing**: Fair distribution of shipping/insurance costs
- **Capital loss separation**: Investment losses separate from shipping costs
- **Tax documentation**: Automatic generation of capital loss reports
- **Dispute resolution**: Automatic chat room creation for resolution

## Best Practices

### 1. For Users

#### Risk Assessment
- **Understand risks**: Clear understanding of potential losses
- **Start small**: Begin with low risk percentages
- **Monitor regularly**: Check investment status frequently
- **Set limits**: Use stop-loss and risk tolerance settings

#### Risk Management
- **Anti-collateral**: Always maintain required anti-collateral
- **Robot monitoring**: Keep robots active for monitoring
- **Emergency preparedness**: Understand fallout scenarios
- **Tax planning**: Prepare for potential capital losses

### 2. For Developers

#### Implementation
- **Robust monitoring**: Implement reliable robot monitoring
- **Market integration**: Coordinate with market monitoring systems
- **Error handling**: Implement comprehensive error handling
- **Testing**: Thorough testing of all risk scenarios

#### Maintenance
- **Regular updates**: Keep risk calculations current
- **Performance monitoring**: Monitor robot performance
- **User feedback**: Collect and act on user feedback
- **Documentation**: Keep documentation current

## Conclusion

Risky Investment Mode provides users with the option to invest their shipping holds while maintaining robust risk management and protection mechanisms. The system balances potential returns with comprehensive risk controls, automated monitoring, and fair loss sharing in case of investment failure.

The integration with Plan #2 systems (tax documents, chat rooms, market monitoring) ensures a seamless experience and proper handling of all scenarios, from successful investments to fallout situations.
