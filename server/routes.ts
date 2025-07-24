import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isApproved } from "./replitAuth";
import { z } from "zod";
import {
  insertEquipmentCategorySchema,
  insertEquipmentSchema,
  insertEquipmentPricingSchema,
  insertEquipmentAdditionalSchema,
  insertEquipmentServiceCostsSchema,
  insertEquipmentServiceItemsSchema,
  insertClientSchema,
  insertQuoteSchema,
  insertQuoteItemSchema,

  insertPricingSchemaSchema,

} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Remove development mode bypass - require authentication for all protected routes

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // If user exists but is not approved, return 403 with special flag
      if (user && !user.isApproved) {
        return res.status(403).json({ 
          message: "Account pending approval", 
          needsApproval: true,
          user: user // Still return user data for display purposes
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User management routes (admin only)
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put('/api/users/:id/role', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { id } = req.params;
      const { role } = req.body;
      
      if (!['admin', 'employee'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const updatedUser = await storage.updateUserRole(id, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.put('/api/users/:id/toggle-active', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { id } = req.params;
      const updatedUser = await storage.toggleUserActive(id);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error toggling user active status:", error);
      res.status(500).json({ message: "Failed to toggle user active status" });
    }
  });

  app.get('/api/users/pending', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const pendingUsers = await storage.getPendingUsers();
      res.json(pendingUsers);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  app.post('/api/users/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { id } = req.params;
      const approvedUser = await storage.approveUser(id, currentUser.id);
      res.json(approvedUser);
    } catch (error) {
      console.error("Error approving user:", error);
      res.status(500).json({ message: "Failed to approve user" });
    }
  });

  app.delete('/api/users/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { id } = req.params;
      await storage.rejectUser(id);
      res.json({ message: "User rejected and removed successfully" });
    } catch (error) {
      console.error("Error rejecting user:", error);
      res.status(500).json({ message: "Failed to reject user" });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { id } = req.params;
      
      // Prevent admin from deleting themselves
      if (id === req.user.claims.sub) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Equipment Categories
  app.get('/api/equipment-categories', isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getEquipmentCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/equipment-categories', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const categoryData = insertEquipmentCategorySchema.parse(req.body);
      const category = await storage.createEquipmentCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.delete('/api/equipment-categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const id = parseInt(req.params.id);
      await storage.deleteEquipmentCategory(id);
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Equipment
  app.get('/api/equipment/inactive', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const equipment = await storage.getInactiveEquipment();
      res.json(equipment);
    } catch (error) {
      console.error("Error fetching inactive equipment:", error);
      res.status(500).json({ message: "Failed to fetch inactive equipment" });
    }
  });

  app.get('/api/equipment', isAuthenticated, async (req, res) => {
    try {
      const equipment = await storage.getEquipment();
      res.json(equipment);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      res.status(500).json({ message: "Failed to fetch equipment" });
    }
  });

  app.get('/api/equipment/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const equipment = await storage.getEquipmentById(id);
      if (!equipment) {
        return res.status(404).json({ message: "Equipment not found" });
      }
      res.json(equipment);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      res.status(500).json({ message: "Failed to fetch equipment" });
    }
  });

  app.post('/api/equipment', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const equipmentData = insertEquipmentSchema.parse(req.body);
      const equipment = await storage.createEquipment(equipmentData);
      res.json({
        ...equipment,
        message: "Sprzęt został utworzony z domyślnymi cenami 100 zł/dzień (0% rabaty). Zaktualizuj ceny w sekcji 'Cenniki sprzętu'."
      });
    } catch (error) {
      console.error("Error creating equipment:", error);
      res.status(500).json({ message: "Failed to create equipment" });
    }
  });

  app.put('/api/equipment/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const id = parseInt(req.params.id);
      console.log("Update equipment request body:", req.body);
      
      // Handle both direct body and nested equipment field
      const equipmentData = req.body.equipment || req.body;
      console.log("Equipment data for update:", equipmentData);
      
      const parsedData = insertEquipmentSchema.partial().parse(equipmentData);
      const equipment = await storage.updateEquipment(id, parsedData);
      res.json(equipment);
    } catch (error) {
      console.error("Error updating equipment:", error);
      res.status(500).json({ message: "Failed to update equipment" });
    }
  });

  app.patch('/api/equipment/:id/quantity', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const id = parseInt(req.params.id);
      const { quantity, availableQuantity } = req.body;
      
      if (typeof quantity !== 'number' || typeof availableQuantity !== 'number') {
        return res.status(400).json({ message: "Quantity and availableQuantity must be numbers" });
      }

      if (availableQuantity > quantity) {
        return res.status(400).json({ message: "Available quantity cannot exceed total quantity" });
      }

      const equipment = await storage.updateEquipment(id, { quantity, availableQuantity });
      res.json(equipment);
    } catch (error) {
      console.error("Error updating equipment quantity:", error);
      res.status(500).json({ message: "Failed to update equipment quantity" });
    }
  });

  app.delete('/api/equipment/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const id = parseInt(req.params.id);
      await storage.deleteEquipment(id);
      res.json({ message: "Equipment deleted successfully" });
    } catch (error) {
      console.error("Error deleting equipment:", error);
      res.status(500).json({ message: "Failed to delete equipment" });
    }
  });

  app.delete('/api/equipment/:id/permanent', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const id = parseInt(req.params.id);
      await storage.permanentlyDeleteEquipment(id);
      res.json({ message: "Equipment permanently deleted successfully" });
    } catch (error) {
      console.error("Error permanently deleting equipment:", error);
      res.status(500).json({ message: "Failed to permanently delete equipment" });
    }
  });

  // Equipment Pricing
  app.post('/api/equipment-pricing', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const pricingData = insertEquipmentPricingSchema.parse(req.body);
      const pricing = await storage.createEquipmentPricing(pricingData);
      res.json(pricing);
    } catch (error) {
      console.error("Error creating pricing:", error);
      res.status(500).json({ message: "Failed to create pricing" });
    }
  });

  app.patch('/api/equipment-pricing/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const id = parseInt(req.params.id);
      const pricingData = insertEquipmentPricingSchema.partial().parse(req.body);
      const pricing = await storage.updateEquipmentPricing(id, pricingData);
      res.json(pricing);
    } catch (error) {
      console.error("Error updating pricing:", error);
      res.status(500).json({ message: "Failed to update pricing" });
    }
  });

  app.delete('/api/equipment-pricing/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const id = parseInt(req.params.id);
      await storage.deleteEquipmentPricing(id);
      res.json({ message: "Equipment pricing deleted successfully" });
    } catch (error) {
      console.error("Error deleting pricing:", error);
      res.status(500).json({ message: "Failed to delete pricing" });
    }
  });

  // Equipment Additional and Accessories
  app.get('/api/equipment/:id/additional', isAuthenticated, async (req, res) => {
    try {
      const equipmentId = parseInt(req.params.id);
      let additional = await storage.getEquipmentAdditional(equipmentId);
      
      // If no additional equipment exists, create a default one
      if (additional.length === 0) {
        await storage.createEquipmentAdditional({
          equipmentId: equipmentId,
          type: "additional",
          name: "Dodatkowe wyposażenie 1",
          price: "0.00",
          position: 1
        });
        additional = await storage.getEquipmentAdditional(equipmentId);
      }
      
      res.json(additional);
    } catch (error) {
      console.error("Error fetching equipment additional:", error);
      res.status(500).json({ message: "Failed to fetch equipment additional" });
    }
  });

  app.post('/api/equipment-additional', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const additionalData = insertEquipmentAdditionalSchema.parse(req.body);
      const additional = await storage.createEquipmentAdditional(additionalData);
      res.json(additional);
    } catch (error) {
      console.error("Error creating equipment additional:", error);
      res.status(500).json({ message: "Failed to create equipment additional" });
    }
  });

  app.patch('/api/equipment-additional/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const id = parseInt(req.params.id);
      const additionalData = insertEquipmentAdditionalSchema.partial().parse(req.body);
      const additional = await storage.updateEquipmentAdditional(id, additionalData);
      res.json(additional);
    } catch (error) {
      console.error("Error updating equipment additional:", error);
      res.status(500).json({ message: "Failed to update equipment additional" });
    }
  });

  app.delete('/api/equipment-additional/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const id = parseInt(req.params.id);
      await storage.deleteEquipmentAdditional(id);
      res.json({ message: "Equipment additional deleted successfully" });
    } catch (error) {
      console.error("Error deleting equipment additional:", error);
      res.status(500).json({ message: "Failed to delete equipment additional" });
    }
  });

  // Clients
  app.get('/api/clients', isAuthenticated, async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post('/api/clients', isAuthenticated, async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      res.json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put('/api/clients/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.updateClient(id, clientData);
      res.json(client);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  // Quotes - accessible to admin and employee roles
  app.get('/api/quotes', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin' && user?.role !== 'employee') {
        return res.status(403).json({ message: "Access denied. Admin or employee role required." });
      }

      const quotes = await storage.getQuotes();
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });

  app.get('/api/quotes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin' && user?.role !== 'employee') {
        return res.status(403).json({ message: "Access denied. Admin or employee role required." });
      }

      const id = parseInt(req.params.id);
      const quote = await storage.getQuoteById(id);
      
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      res.json(quote);
    } catch (error) {
      console.error("Error fetching quote:", error);
      res.status(500).json({ message: "Failed to fetch quote" });
    }
  });

  app.post('/api/quotes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const quoteData = insertQuoteSchema.parse({
        ...req.body,
        createdById: userId,
        quoteNumber: `WYC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        isGuestQuote: false,
      });
      const quote = await storage.createQuote(quoteData);
      res.json(quote);
    } catch (error) {
      console.error("Error creating quote:", error);
      console.error("Request body:", req.body);
      console.error("Validation error details:", error);
      res.status(500).json({ message: "Failed to create quote" });
    }
  });

  // Guest quote creation (no authentication required)
  app.post('/api/quotes/guest', async (req: any, res) => {
    try {
      const { guestEmail, clientData, items, ...quoteBody } = req.body;
      
      // Create or find client
      const client = await storage.createClient(clientData);
      
      // Create quote
      const quoteData = insertQuoteSchema.parse({
        ...quoteBody,
        clientId: client.id,
        isGuestQuote: true,
        guestEmail,
        createdById: null,
        quoteNumber: `GUE-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      });
      const quote = await storage.createQuote(quoteData);
      
      // Create quote items
      for (const item of items) {
        await storage.createQuoteItem({
          ...item,
          quoteId: quote.id,
        });
      }
      
      res.json(quote);
    } catch (error) {
      console.error("Error creating guest quote:", error);
      res.status(500).json({ message: "Failed to create guest quote" });
    }
  });

  app.put('/api/quotes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin' && user?.role !== 'employee') {
        return res.status(403).json({ message: "Access denied. Admin or employee role required." });
      }

      const id = parseInt(req.params.id);
      const quote = await storage.getQuoteById(id);
      
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      const quoteData = insertQuoteSchema.partial().parse(req.body);
      const updatedQuote = await storage.updateQuote(id, quoteData);
      res.json(updatedQuote);
    } catch (error) {
      console.error("Error updating quote:", error);
      res.status(500).json({ message: "Failed to update quote" });
    }
  });

  app.delete('/api/quotes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const id = parseInt(req.params.id);
      const quote = await storage.getQuoteById(id);
      
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      await storage.deleteQuote(id);
      res.json({ message: "Quote deleted successfully" });
    } catch (error) {
      console.error("Error deleting quote:", error);
      res.status(500).json({ message: "Failed to delete quote" });
    }
  });

  app.get('/api/quotes/:id/print', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.getQuoteById(id);
      
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin' && user?.role !== 'employee') {
        return res.status(403).json({ message: "Access denied. Admin or employee role required." });
      }

      // Generate HTML content for the quote
      console.log("Quote data for print:", {
        id: quote.id,
        itemsCount: quote.items?.length || 0,
        items: quote.items
      });
      
      const htmlContent = generateQuoteHTML(quote);
      
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlContent);
    } catch (error) {
      console.error("Error generating print view:", error);
      res.status(500).json({ message: "Failed to generate print view" });
    }
  });

  // Quote Items - accessible to admin and employee roles, or guest in development
  app.post('/api/quote-items', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin' && user?.role !== 'employee') {
        return res.status(403).json({ message: "Access denied. Admin or employee role required." });
      }

      const itemData = insertQuoteItemSchema.parse(req.body);
      const item = await storage.createQuoteItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating quote item:", error);
      console.error("Request body:", req.body);
      console.error("Validation error details:", error);
      res.status(500).json({ message: "Failed to create quote item" });
    }
  });

  app.put('/api/quote-items/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin' && user?.role !== 'employee') {
        return res.status(403).json({ message: "Access denied. Admin or employee role required." });
      }

      const id = parseInt(req.params.id);
      const itemData = insertQuoteItemSchema.partial().parse(req.body);
      const item = await storage.updateQuoteItem(id, itemData);
      res.json(item);
    } catch (error) {
      console.error("Error updating quote item:", error);
      res.status(500).json({ message: "Failed to update quote item" });
    }
  });

  app.delete('/api/quote-items/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin' && user?.role !== 'employee') {
        return res.status(403).json({ message: "Access denied. Admin or employee role required." });
      }

      const id = parseInt(req.params.id);
      await storage.deleteQuoteItem(id);
      res.json({ message: "Quote item deleted successfully" });
    } catch (error) {
      console.error("Error deleting quote item:", error);
      res.status(500).json({ message: "Failed to delete quote item" });
    }
  });



  // Pricing schemas routes
  app.get('/api/pricing-schemas', isAuthenticated, async (req, res) => {
    try {
      const schemas = await storage.getPricingSchemas();
      res.json(schemas);
    } catch (error) {
      console.error("Error fetching pricing schemas:", error);
      res.status(500).json({ message: "Failed to fetch pricing schemas" });
    }
  });

  app.get('/api/pricing-schemas/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const schema = await storage.getPricingSchemaById(parseInt(id));
      if (!schema) {
        return res.status(404).json({ message: "Pricing schema not found" });
      }
      res.json(schema);
    } catch (error) {
      console.error("Error fetching pricing schema:", error);
      res.status(500).json({ message: "Failed to fetch pricing schema" });
    }
  });

  app.post('/api/pricing-schemas', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertPricingSchemaSchema.parse(req.body);
      const schema = await storage.createPricingSchema(validatedData);
      res.status(201).json(schema);
    } catch (error) {
      console.error("Error creating pricing schema:", error);
      res.status(500).json({ message: "Failed to create pricing schema" });
    }
  });

  app.patch('/api/pricing-schemas/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const validatedData = insertPricingSchemaSchema.partial().parse(req.body);
      const schema = await storage.updatePricingSchema(parseInt(id), validatedData);
      res.json(schema);
    } catch (error) {
      console.error("Error updating pricing schema:", error);
      res.status(500).json({ message: "Failed to update pricing schema" });
    }
  });

  app.delete('/api/pricing-schemas/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      await storage.deletePricingSchema(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting pricing schema:", error);
      res.status(500).json({ message: "Failed to delete pricing schema" });
    }
  });

  // Equipment service costs endpoints
  app.get('/api/equipment/:id/service-costs', isAuthenticated, async (req, res) => {
    try {
      const equipmentId = parseInt(req.params.id);
      const serviceCosts = await storage.getEquipmentServiceCosts(equipmentId);
      res.json(serviceCosts || null);
    } catch (error) {
      console.error("Error fetching equipment service costs:", error);
      res.status(500).json({ message: "Failed to fetch equipment service costs" });
    }
  });

  app.post('/api/equipment/:id/service-costs', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const equipmentId = parseInt(req.params.id);
      const serviceCostsData = insertEquipmentServiceCostsSchema.parse({
        ...req.body,
        equipmentId
      });
      const serviceCosts = await storage.upsertEquipmentServiceCosts(serviceCostsData);
      res.json(serviceCosts);
    } catch (error) {
      console.error("Error upserting equipment service costs:", error);
      res.status(500).json({ message: "Failed to upsert equipment service costs" });
    }
  });

  // Equipment service items endpoints
  app.get('/api/equipment/:id/service-items', isAuthenticated, async (req, res) => {
    try {
      const equipmentId = parseInt(req.params.id);
      
      // Auto-sync service work hours with admin configuration before returning data
      await storage.syncServiceWorkHours(equipmentId);
      
      const serviceItems = await storage.getEquipmentServiceItems(equipmentId);
      res.json(serviceItems);
    } catch (error) {
      console.error("Error fetching equipment service items:", error);
      res.status(500).json({ message: "Failed to fetch equipment service items" });
    }
  });

  app.post('/api/equipment/:id/service-items', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const equipmentId = parseInt(req.params.id);
      const serviceItemData = insertEquipmentServiceItemsSchema.parse({
        ...req.body,
        equipmentId
      });
      const serviceItem = await storage.createEquipmentServiceItem(serviceItemData);
      res.json(serviceItem);
    } catch (error) {
      console.error("Error creating equipment service item:", error);
      res.status(500).json({ message: "Failed to create equipment service item" });
    }
  });

  app.patch('/api/equipment-service-items/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const id = parseInt(req.params.id);
      const serviceItemData = insertEquipmentServiceItemsSchema.partial().parse(req.body);
      const serviceItem = await storage.updateEquipmentServiceItem(id, serviceItemData);
      res.json(serviceItem);
    } catch (error) {
      console.error("Error updating equipment service item:", error);
      res.status(500).json({ message: "Failed to update equipment service item" });
    }
  });

  app.delete('/api/equipment-service-items/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const id = parseInt(req.params.id);
      await storage.deleteEquipmentServiceItem(id);
      res.json({ message: "Equipment service item deleted successfully" });
    } catch (error) {
      console.error("Error deleting equipment service item:", error);
      res.status(500).json({ message: "Failed to delete equipment service item" });
    }
  });

  // API endpoint to sync all equipment with admin settings
  app.post('/api/admin/sync-all-equipment', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      await storage.syncAllEquipmentWithAdminSettings();
      res.json({ message: "Wszystkie urządzenia zostały zsynchronizowane z ustawieniami panelu admina" });
    } catch (error) {
      console.error("Error syncing equipment:", error);
      res.status(500).json({ message: "Failed to sync equipment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function generateQuoteHTML(quote: any) {
  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRentalPeriodText = (days: number) => {
    if (days === 1) return "1 dzień";
    if (days < 5) return `${days} dni`;
    return `${days} dni`;
  };

  const itemsHTML = quote.items.map((item: any) => {
    const detailsRows = [];
    
    // Podstawowe informacje o sprzęcie
    detailsRows.push(`
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.equipment.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${getRentalPeriodText(item.rentalPeriodDays)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.pricePerDay)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.discountPercent}%</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.totalPrice)}</td>
      </tr>
    `);

    // Szczegółowe opcje paliwowe
    if (item.includeFuelCost) {
      detailsRows.push(`
        <tr>
          <td colspan="6" style="padding: 8px 15px; border-bottom: 1px solid #eee; background-color: #f8f9ff; font-size: 0.9em;">
            <strong>🛢️ Koszt paliwa:</strong> ${formatCurrency(item.totalFuelCost)}<br>
            • Zużycie: ${item.fuelConsumptionLH} l/h<br>
            • Cena paliwa: ${formatCurrency(item.fuelPricePerLiter)}/l<br>
            • Godziny pracy dziennie: ${item.hoursPerDay} h<br>
            • Całkowite zużycie: ${(parseFloat(item.fuelConsumptionLH) * item.hoursPerDay * item.rentalPeriodDays).toFixed(1)} l
          </td>
        </tr>
      `);
    }

    // Szczegółowe opcje montażu/dojazdu
    if (item.includeTravelCost || item.totalTravelCost > 0) {
      detailsRows.push(`
        <tr>
          <td colspan="6" style="padding: 8px 15px; border-bottom: 1px solid #eee; background-color: #f0fff8; font-size: 0.9em;">
            <strong>🚚 Koszt dojazdu/montażu:</strong> ${formatCurrency(item.totalTravelCost)}<br>
            • Dystans: ${item.travelDistanceKm} km<br>
            • Liczba techników: ${item.numberOfTechnicians}<br>
            • Stawka za technika: ${formatCurrency(item.hourlyRatePerTechnician)}/h<br>
            • Stawka za km: ${formatCurrency(item.travelRatePerKm)}/km
          </td>
        </tr>
      `);
    }

    // Szczegółowe opcje eksploatacji/serwisu
    if (item.includeMaintenanceCost) {
      detailsRows.push(`
        <tr>
          <td colspan="6" style="padding: 8px 15px; border-bottom: 1px solid #eee; background-color: #fff8f0; font-size: 0.9em;">
            <strong>🔧 Koszt eksploatacji:</strong> ${formatCurrency(item.totalMaintenanceCost)}<br>
            • Interwał serwisowy: co ${item.maintenanceIntervalHours} mth<br>
            • Filtry paliwowe: ${formatCurrency(item.fuelFilter1Cost)} + ${formatCurrency(item.fuelFilter2Cost)}<br>
            • Filtr oleju: ${formatCurrency(item.oilFilterCost)}<br>
            • Filtry powietrza: ${formatCurrency(item.airFilter1Cost)} + ${formatCurrency(item.airFilter2Cost)}<br>
            • Filtr silnika: ${formatCurrency(item.engineFilterCost)}<br>
            • Olej: ${formatCurrency(item.oilCost)} (${item.oilQuantityLiters}l)<br>
            • Praca serwisowa: ${item.serviceWorkHours}h × ${formatCurrency(item.serviceWorkRatePerHour)}/h<br>
            • Dojazd serwisu: ${item.serviceTravelDistanceKm}km × ${formatCurrency(item.serviceTravelRatePerKm)}/km
          </td>
        </tr>
      `);
    }

    // Szczegółowe pozycje serwisowe (dla nagrzewnic)
    if (item.includeServiceItems && (parseFloat(item.serviceItem1Cost) > 0 || parseFloat(item.serviceItem2Cost) > 0 || parseFloat(item.serviceItem3Cost) > 0)) {
      detailsRows.push(`
        <tr>
          <td colspan="6" style="padding: 8px 15px; border-bottom: 1px solid #eee; background-color: #fff0f8; font-size: 0.9em;">
            <strong>🛠️ Koszty serwisowe:</strong> ${formatCurrency(item.totalServiceItemsCost)}<br>
            ${parseFloat(item.serviceItem1Cost) > 0 ? `• Przegląd serwisowy: ${formatCurrency(item.serviceItem1Cost)}<br>` : ''}
            ${parseFloat(item.serviceItem2Cost) > 0 ? `• Dojazd: ${formatCurrency(item.serviceItem2Cost)}<br>` : ''}
            ${parseFloat(item.serviceItem3Cost) > 0 ? `• Wymiana palnika: ${formatCurrency(item.serviceItem3Cost)}<br>` : ''}
          </td>
        </tr>
      `);
    }

    // Wyposażenie dodatkowe i akcesoria - wyświetl dostępne opcje dla tego sprzętu
    // Show selected additional equipment based on data stored in notes field
    if (item.equipment.additionalEquipment && item.equipment.additionalEquipment.length > 0) {
      let selectedAdditionalIds: number[] = [];
      let selectedAccessoriesIds: number[] = [];
      
      // Try to parse selected items from notes field (JSON format)
      try {
        if (item.notes && item.notes.startsWith('{"selectedAdditional"')) {
          const notesData = JSON.parse(item.notes);
          selectedAdditionalIds = notesData.selectedAdditional || [];
          selectedAccessoriesIds = notesData.selectedAccessories || [];
          console.log('Print debug - parsed notes:', {
            selectedAdditionalIds,
            selectedAccessoriesIds,
            availableAdditional: item.equipment.additionalEquipment?.map((a: any) => ({ id: a.id, name: a.name, type: a.type, price: a.price })),
            notesRaw: item.notes
          });
        }
      } catch (e) {
        // If parsing fails, don't show any additional equipment
        console.log('Print debug - notes parsing failed:', e);
      }
      
      // Filter to show only selected items
      const selectedAdditionalItems = item.equipment.additionalEquipment.filter((add: any) => 
        add.type === 'additional' && selectedAdditionalIds.includes(add.id)
      );
      const selectedAccessoryItems = item.equipment.additionalEquipment.filter((add: any) => 
        add.type === 'accessories' && selectedAccessoriesIds.includes(add.id)
      );
      
      console.log('Print debug - filtered results:', {
        selectedAdditionalItems: selectedAdditionalItems.map((a: any) => ({ id: a.id, name: a.name, price: a.price })),
        selectedAccessoryItems: selectedAccessoryItems.map((a: any) => ({ id: a.id, name: a.name, price: a.price }))
      });
      
      if (selectedAdditionalItems.length > 0 || selectedAccessoryItems.length > 0) {
        let additionalHTML = '<strong>🔧 Wyposażenie dodatkowe i akcesoria:</strong><br>';
        
        if (selectedAdditionalItems.length > 0) {
          additionalHTML += '<strong>Wyposażenie dodatkowe:</strong><br>';
          selectedAdditionalItems.forEach((add: any) => {
            additionalHTML += `• ${add.name} - ${formatCurrency(add.price)}<br>`;
          });
        }
        
        if (selectedAccessoryItems.length > 0) {
          additionalHTML += '<strong>Akcesoria:</strong><br>';
          selectedAccessoryItems.forEach((add: any) => {
            additionalHTML += `• ${add.name} - ${formatCurrency(add.price)}<br>`;
          });
        }
        
        detailsRows.push(`
          <tr>
            <td colspan="6" style="padding: 8px 15px; border-bottom: 1px solid #eee; background-color: #f0f8ff; font-size: 0.9em;">
              ${additionalHTML}
            </td>
          </tr>
        `);
      }
    }

    // Uwagi - show only user notes, not technical JSON data
    let userNotes = "";
    try {
      if (item.notes && item.notes.startsWith('{"selectedAdditional"')) {
        const notesData = JSON.parse(item.notes);
        userNotes = notesData.userNotes || "";
      } else {
        userNotes = item.notes || "";
      }
    } catch (e) {
      userNotes = item.notes || "";
    }
    
    if (userNotes.trim()) {
      detailsRows.push(`
        <tr>
          <td colspan="6" style="padding: 8px 15px; border-bottom: 1px solid #eee; background-color: #f5f5f5; font-size: 0.9em;">
            <strong>📝 Uwagi:</strong> ${userNotes}
          </td>
        </tr>
      `);
    }

    return detailsRows.join('');
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Wycena ${quote.quoteNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-logo { font-size: 24px; font-weight: bold; color: #0066cc; }
        .quote-title { font-size: 18px; margin-top: 10px; }
        .quote-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .quote-info div { flex: 1; }
        .quote-info h3 { margin: 0 0 10px 0; color: #0066cc; }
        .quote-info p { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background-color: #0066cc; color: white; padding: 12px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        .total-row { font-weight: bold; background-color: #f0f0f0; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none; }
        }
        .print-button { position: fixed; top: 20px; right: 20px; z-index: 1000; background: #0066cc; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
        .print-button:hover { background: #0052a3; }
      </style>
    </head>
    <body>
      <button class="print-button no-print" onclick="window.print()">🖨️ Drukuj</button>
      <div class="header">
        <div class="company-logo">Sebastian Popiel :: PPP :: Program</div>
        <div class="quote-title">Wycena sprzętu</div>
      </div>

      <div class="quote-info">
        <div>
          <h3>Dane klienta:</h3>
          <p><strong>${quote.client.companyName}</strong></p>
          ${quote.client.contactPerson ? `<p>Osoba kontaktowa: ${quote.client.contactPerson}</p>` : ''}
          ${quote.client.email ? `<p>Email: ${quote.client.email}</p>` : ''}
          ${quote.client.phone ? `<p>Telefon: ${quote.client.phone}</p>` : ''}
          ${quote.client.address ? `<p>Adres: ${quote.client.address}</p>` : ''}
          ${quote.client.nip ? `<p>NIP: ${quote.client.nip}</p>` : ''}
        </div>
        <div>
          <h3>Dane wyceny:</h3>
          <p><strong>Numer:</strong> ${quote.quoteNumber}</p>
          <p><strong>Data utworzenia:</strong> ${formatDate(quote.createdAt)}</p>
          <p><strong>Utworzył:</strong> ${quote.createdBy 
            ? (quote.createdBy.firstName && quote.createdBy.lastName 
                ? `${quote.createdBy.firstName} ${quote.createdBy.lastName}`
                : quote.createdBy.email || 'Nieznany użytkownik')
            : 'Wycena gościnna'}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Nazwa sprzętu</th>
            <th>Ilość</th>
            <th>Okres wynajmu</th>
            <th>Cena za dzień</th>
            <th>Rabat</th>
            <th>Wartość</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
          <tr class="total-row">
            <td colspan="5" style="text-align: right; padding: 15px;">Wartość netto:</td>
            <td style="text-align: right; padding: 15px;">${formatCurrency(quote.totalNet)}</td>
          </tr>
          <tr class="total-row">
            <td colspan="5" style="text-align: right; padding: 15px;">Wartość brutto (VAT 23%):</td>
            <td style="text-align: right; padding: 15px;">${formatCurrency(quote.totalGross)}</td>
          </tr>
        </tbody>
      </table>

      <div class="footer">
        <p>Wycena wygenerowana: ${formatDate(new Date().toISOString())}</p>
        <p>Sebastian Popiel :: PPP :: Program - Wynajem sprzętu</p>
      </div>
    </body>
    </html>
  `;
}
