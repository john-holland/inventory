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
  InvestmentPool
];
