const { BaseEntity } = require("./BaseEntity");
const { Post } = require("./Post");
const { User } = require("./User");
const { Item } = require("./Item");
const { Transaction } = require("./Transaction");
const { ShippingRoute } = require("./ShippingRoute");
const { Investment } = require("./Investment");
const { WaterLimit } = require("./WaterLimit");
const { ConsumerInvestment } = require("./ConsumerInvestment");
const { PlatformInvestment } = require("./PlatformInvestment");
const { AmazonUser } = require("./AmazonUser");
const { DropShippingList } = require("./DropShippingList");
const { AmazonProduct } = require("./AmazonProduct");
const { ListProduct } = require("./ListProduct");
const { AmazonOrder } = require("./AmazonOrder");
const { SquareAccount } = require("./SquareAccount");
const { SquareBill } = require("./SquareBill");
const { WaterLevelBill } = require("./WaterLevelBill");
const { Waitlist } = require("./Waitlist");
const { Whitelist } = require("./Whitelist");
const { Hold } = require("./Hold");
const { Release } = require("./Release");
const { Disbursement } = require("./Disbursement");
const { MetaMarketplaceItem } = require("./MetaMarketplaceItem");
const { UserAddress } = require("./UserAddress");
const { InvestmentPool } = require("./InvestmentPool");
const { CarePhoto } = require("./CarePhoto");
const { Dispute } = require("./Dispute");
const { Notification } = require("./Notification");
const { WatchList } = require("./WatchList");

// New entities for eBay integration
const { eBayProduct } = require("./eBayProduct");
const { eBayUser } = require("./eBayUser");

// New entities for chat system
const { Chat } = require("./Chat");
const { Message } = require("./Message");
const { FriendRequest } = require("./FriendRequest");

// New entities for HR system
const { Interview } = require("./Interview");
const { Employee } = require("./Employee");
const { JobChange } = require("./JobChange");
const { Meeting } = require("./Meeting");

// New entities for HealthCheck and BanRequest
const { HealthCheck } = require("./HealthCheck");
const { BanRequest } = require("./BanRequest");

module.exports = [
  BaseEntity, 
  Post, 
  User, 
  Item, 
  Transaction, 
  ShippingRoute, 
  Investment, 
  WaterLimit, 
  ConsumerInvestment, 
  PlatformInvestment,
  AmazonUser,
  DropShippingList,
  AmazonProduct,
  ListProduct,
  AmazonOrder,
  SquareAccount,
  SquareBill,
  WaterLevelBill,
  Waitlist,
  Whitelist,
  Hold,
  Release,
  Disbursement,
  MetaMarketplaceItem,
  UserAddress,
  InvestmentPool,
  CarePhoto,
  Dispute,
  Notification,
  WatchList,
  
  // eBay entities
  eBayProduct,
  eBayUser,
  
  // Chat entities
  Chat,
  Message,
  FriendRequest,
  
  // HR entities
  Interview,
  Employee,
  JobChange,
  Meeting,
  
  // New entities for HealthCheck and BanRequest
  HealthCheck,
  BanRequest
];
