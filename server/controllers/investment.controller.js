const { Router } = require("express");
const jwt = require("jsonwebtoken");
const { InvestmentService } = require("../services/investmentService");

const router = Router();

const InvestmentController = (DI) => {
  const investmentService = new InvestmentService(DI);

  // Middleware to verify JWT token
  const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).send({
        success: false,
        message: "Authentication token required",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.userId = decoded.userId;
      next();
    } catch (error) {
      return res.status(403).send({
        success: false,
        message: "Invalid or expired token",
      });
    }
  };

  // Create new investment
  router.post("/investments", authenticateToken, async (req, res) => {
    const { amount, investmentType, service } = req.body;

    if (!amount || !investmentType || !service) {
      return res.status(400).send({
        success: false,
        message: "Amount, investment type, and service are required",
      });
    }

    try {
      const investment = await investmentService.createInvestment(
        req.userId,
        amount,
        investmentType,
        service
      );

      res.status(201).send({
        success: true,
        message: "Investment created successfully",
        investment
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  // Get user's investment portfolio
  router.get("/portfolio", authenticateToken, async (req, res) => {
    try {
      const portfolio = await investmentService.getUserPortfolio(req.userId);
      
      res.status(200).send({
        success: true,
        message: "Portfolio retrieved successfully",
        portfolio
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  // Get all user's investments
  router.get("/investments", authenticateToken, async (req, res) => {
    try {
      const investments = await DI.investmentRepository.find({
        userId: req.userId
      });

      res.status(200).send({
        success: true,
        message: "Investments retrieved successfully",
        investments
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  // Get specific investment
  router.get("/investments/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
      const investment = await DI.investmentRepository.findOneOrFail({ id });
      
      // Check if user owns the investment
      if (investment.userId !== req.userId) {
        return res.status(403).send({
          success: false,
          message: "You can only view your own investments",
        });
      }

      res.status(200).send({
        success: true,
        message: "Investment retrieved successfully",
        investment
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  // Liquidate investment
  router.post("/investments/:id/liquidate", authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
      const result = await investmentService.liquidateInvestment(parseInt(id));
      
      res.status(200).send({
        success: true,
        message: "Investment liquidated successfully",
        ...result
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  // Get supported investment types and services
  router.get("/supported", async (req, res) => {
    try {
      const supported = investmentService.supportedServices;
      
      res.status(200).send({
        success: true,
        message: "Supported investment types retrieved successfully",
        supported
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  // Get investment performance history
  router.get("/performance", authenticateToken, async (req, res) => {
    try {
      const investments = await DI.investmentRepository.find({
        userId: req.userId
      });

      const performance = investments.map(inv => ({
        id: inv.id,
        investmentType: inv.investmentType,
        service: inv.service,
        amount: inv.amount,
        currentValue: inv.currentValue,
        returnRate: inv.returnRate,
        status: inv.status,
        createdAt: inv.createdAt,
        lastUpdated: inv.lastUpdated
      }));

      res.status(200).send({
        success: true,
        message: "Investment performance retrieved successfully",
        performance
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  // Admin endpoint to update all investment values (cron job)
  router.post("/update-values", async (req, res) => {
    try {
      // In production, this should be protected with admin authentication
      await investmentService.updateInvestmentValues();
      
      res.status(200).send({
        success: true,
        message: "All investment values updated successfully"
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  return router;
};

module.exports = { InvestmentController }; 