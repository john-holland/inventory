const { wrap } = require("@mikro-orm/core");
const { Router } = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../entities/User");

const router = Router();

const UserController = (DI) => {
  // Register new user
  router.post("/register", async (req, res) => {
    const { email, username, password, walletAddress } = req.body;

    if (!email || !username || !password) {
      return res.status(400).send({
        success: false,
        message: "Email, username, and password are required",
      });
    }

    try {
      // Check if user already exists
      const existingUser = await DI.userRepository.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return res.status(400).send({
          success: false,
          message: "User with this email or username already exists",
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = new User(email, username, passwordHash, walletAddress);
      await DI.userRepository.persistAndFlush(user);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.status(201).send({
        success: true,
        message: "User successfully registered",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          walletAddress: user.walletAddress,
          isVerified: user.isVerified,
          availableBalance: user.availableBalance,
          heldBalance: user.heldBalance
        },
        token
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  // Login user
  router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "Email and password are required",
      });
    }

    try {
      const user = await DI.userRepository.findOne({ email });

      if (!user) {
        return res.status(401).send({
          success: false,
          message: "Invalid credentials",
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);

      if (!isValidPassword) {
        return res.status(401).send({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.status(200).send({
        success: true,
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          walletAddress: user.walletAddress,
          isVerified: user.isVerified,
          availableBalance: user.availableBalance,
          heldBalance: user.heldBalance,
          rating: user.rating,
          totalTransactions: user.totalTransactions
        },
        token
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  // Get user profile
  router.get("/profile", async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).send({
          success: false,
          message: "Authentication token required",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await DI.userRepository.findOneOrFail({ id: decoded.userId });

      res.status(200).send({
        success: true,
        message: "User profile retrieved successfully",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          walletAddress: user.walletAddress,
          isVerified: user.isVerified,
          availableBalance: user.availableBalance,
          heldBalance: user.heldBalance,
          rating: user.rating,
          totalTransactions: user.totalTransactions,
          location: user.location,
          preferences: user.preferences
        }
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  // Update user profile
  router.put("/profile", async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).send({
          success: false,
          message: "Authentication token required",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await DI.userRepository.findOneOrFail({ id: decoded.userId });

      const { username, walletAddress, location, preferences } = req.body;

      wrap(user).assign({
        username: username || user.username,
        walletAddress: walletAddress || user.walletAddress,
        location: location || user.location,
        preferences: preferences || user.preferences
      });

      await DI.userRepository.flush();

      res.status(200).send({
        success: true,
        message: "Profile updated successfully",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          walletAddress: user.walletAddress,
          isVerified: user.isVerified,
          availableBalance: user.availableBalance,
          heldBalance: user.heldBalance,
          rating: user.rating,
          totalTransactions: user.totalTransactions,
          location: user.location,
          preferences: user.preferences
        }
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  // Add funds to wallet
  router.post("/wallet/deposit", async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).send({
          success: false,
          message: "Authentication token required",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await DI.userRepository.findOneOrFail({ id: decoded.userId });

      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).send({
          success: false,
          message: "Valid amount is required",
        });
      }

      wrap(user).assign({
        availableBalance: user.availableBalance + amount
      });

      // Create transaction record
      const transaction = new DI.transactionRepository.entity(
        'deposit',
        user.id,
        null,
        amount,
        `Wallet deposit`,
        'completed'
      );

      transaction.referenceId = `DEP_${Date.now()}`;

      await DI.transactionRepository.persistAndFlush(transaction);
      await DI.userRepository.flush();

      res.status(200).send({
        success: true,
        message: "Funds deposited successfully",
        newBalance: user.availableBalance + amount
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  return router;
};

module.exports = { UserController }; 