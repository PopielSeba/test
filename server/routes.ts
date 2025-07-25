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
import { db } from "./db";
import { eq, desc, sql, asc, count, and, inArray } from "drizzle-orm";
import { 
  equipmentCategories, 
  equipment, 
  equipmentPricing, 
  equipmentAdditional, 
  equipmentServiceCosts, 
  equipmentServiceItems, 
  clients, 
  quotes, 
  quoteItems, 
  users, 
  pricingSchemas 
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

      // Fetch service items and additional equipment for each equipment in the quote
      const quoteWithServiceItems = {
        ...quote,
        items: await Promise.all(quote.items.map(async (item) => {
          const serviceItems = await storage.getEquipmentServiceItems(item.equipmentId);
          
          // Parse selected additional equipment and accessories from notes
          let selectedAdditional: number[] = [];
          let selectedAccessories: number[] = [];
          let additionalEquipmentData: any[] = [];
          let accessoriesData: any[] = [];
          
          try {
            console.log(`Processing item ${item.equipmentId}, notes:`, item.notes);
            
            // Check if accessoriesCost > 0, then try to fetch all accessories for this equipment
            if (parseFloat(item.accessoriesCost || 0) > 0) {
              console.log(`Item has accessories cost: ${item.accessoriesCost}, fetching all accessories for equipment ${item.equipmentId}`);
              
              // If notes contain selection data, use it
              if (item.notes && item.notes.startsWith('{"selectedAdditional"')) {
                const notesData = JSON.parse(item.notes);
                selectedAdditional = notesData.selectedAdditional || [];
                selectedAccessories = notesData.selectedAccessories || [];
                console.log('Found selected accessories in notes:', selectedAccessories);
              } else {
                // Fallback: get all accessories for this equipment since cost > 0
                console.log('No selection data in notes, fetching all accessories');
                const allAccessories = await db.select().from(equipmentAdditional)
                  .where(and(
                    eq(equipmentAdditional.equipmentId, item.equipmentId),
                    eq(equipmentAdditional.type, 'accessories')
                  ));
                accessoriesData = allAccessories;
                console.log('Found accessories (fallback):', accessoriesData.length);
              }
              
              // Fetch additional equipment details
              if (selectedAdditional.length > 0) {
                additionalEquipmentData = await db.select().from(equipmentAdditional)
                  .where(and(
                    eq(equipmentAdditional.equipmentId, item.equipmentId),
                    eq(equipmentAdditional.type, 'additional'),
                    inArray(equipmentAdditional.id, selectedAdditional)
                  ));
              }
              
              // Fetch specific accessories details if we have selection (only if not already fetched by fallback)
              if (selectedAccessories.length > 0 && accessoriesData.length === 0) {
                accessoriesData = await db.select().from(equipmentAdditional)
                  .where(and(
                    eq(equipmentAdditional.equipmentId, item.equipmentId),
                    eq(equipmentAdditional.type, 'accessories'),
                    inArray(equipmentAdditional.id, selectedAccessories)
                  ));
                console.log('Found specific accessories from selection:', accessoriesData.length);
              }
            }
          } catch (e) {
            console.error('Error parsing notes for additional equipment:', e);
          }
          
          return {
            ...item,
            serviceItems: serviceItems || [],
            additionalEquipmentData,
            accessoriesData
          };
        }))
      };

      // Generate HTML content for the quote
      console.log("Quote data for print:", {
        id: quote.id,
        itemsCount: quote.items?.length || 0,
        items: quoteWithServiceItems.items.map((item: any) => ({
          notes: item.notes,
          additionalEquipmentData: item.additionalEquipmentData?.length || 0,
          accessoriesData: item.accessoriesData?.length || 0,
          hasAdditionalCosts: parseFloat(item.additionalCost || 0) > 0,
          hasAccessoriesCosts: parseFloat(item.accessoriesCost || 0) > 0
        }))
      });
      
      const htmlContent = generateQuoteHTML(quoteWithServiceItems);
      
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
    if (isNaN(numAmount)) return "0,00 zł";
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
    
    // Podstawowa linia sprzętu
    detailsRows.push(`
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">${item.equipment.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${getRentalPeriodText(item.rentalPeriodDays)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.pricePerDay)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.discountPercent}%</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">${formatCurrency(item.totalPrice)}</td>
      </tr>
    `);

    // Opcja: Koszt paliwa
    if (item.includeFuelCost && parseFloat(item.totalFuelCost || 0) > 0) {
      let fuelDetails = '';
      if (item.calculationType === 'kilometers') {
        // Pojazdy - kalkulacja kilometrowa
        const totalKm = item.kilometersPerDay * item.rentalPeriodDays;
        const totalFuelConsumption = (totalKm / 100) * parseFloat(item.fuelConsumptionPer100km);
        fuelDetails = `
          • Zużycie: ${item.fuelConsumptionPer100km} l/100km<br>
          • Kilometry dziennie: ${item.kilometersPerDay} km<br>
          • Całkowite kilometry: ${totalKm} km<br>
          • Całkowite zużycie: ${totalFuelConsumption.toFixed(1)} l<br>
          • Cena paliwa: ${formatCurrency(item.fuelPricePerLiter)}/l
        `;
      } else {
        // Tradycyjne urządzenia - kalkulacja motogodzinowa
        const totalFuelConsumption = parseFloat(item.fuelConsumptionLH) * item.hoursPerDay * item.rentalPeriodDays;
        fuelDetails = `
          • Zużycie: ${item.fuelConsumptionLH} l/h<br>
          • Godziny pracy dziennie: ${item.hoursPerDay} h<br>
          • Całkowite zużycie: ${totalFuelConsumption.toFixed(1)} l<br>
          • Cena paliwa: ${formatCurrency(item.fuelPricePerLiter)}/l
        `;
      }
      
      detailsRows.push(`
        <tr>
          <td colspan="6" style="padding: 8px 15px; border-bottom: 1px solid #eee; background-color: #f8f9ff; font-size: 0.9em;">
            <strong>🛢️ Uwzględniono koszt paliwa:</strong> ${formatCurrency(item.totalFuelCost)}<br>
            ${fuelDetails}
          </td>
        </tr>
      `);
    }

    // Opcja: Koszt montażu - pokazuj gdy flaga jest zaznaczona
    if (item.includeInstallationCost) {
      detailsRows.push(`
        <tr>
          <td colspan="6" style="padding: 8px 15px; border-bottom: 1px solid #eee; background-color: #f0fff8; font-size: 0.9em;">
            <strong>🔧 Uwzględniono koszt montażu:</strong> ${formatCurrency(item.totalInstallationCost || 0)}<br>
            • Dystans (tam i z powrotem): ${item.installationDistanceKm || 0} km<br>
            • Liczba techników: ${item.numberOfTechnicians || 1}<br>
            • Stawka za technika: ${formatCurrency(item.serviceRatePerTechnician || 150)}<br>
            • Stawka za km: ${formatCurrency(item.travelRatePerKm || 1.15)}/km
          </td>
        </tr>
      `);
    }

    // Opcja: Koszt demontażu - pokazuj gdy flaga jest zaznaczona
    if (item.includeDisassemblyCost) {
      detailsRows.push(`
        <tr>
          <td colspan="6" style="padding: 8px 15px; border-bottom: 1px solid #eee; background-color: #fff8f0; font-size: 0.9em;">
            <strong>🔨 Uwzględniono koszt demontażu:</strong> ${formatCurrency(item.totalDisassemblyCost || 0)}<br>
            • Dystans (tam i z powrotem): ${item.disassemblyDistanceKm || 0} km<br>
            • Liczba techników: ${item.disassemblyNumberOfTechnicians || 1}<br>
            • Stawka za technika: ${formatCurrency(item.disassemblyServiceRatePerTechnician || 150)}<br>
            • Stawka za km: ${formatCurrency(item.disassemblyTravelRatePerKm || 1.15)}/km
          </td>
        </tr>
      `);
    }

    // Opcja: Koszt dojazdu / serwis - pokazuj gdy flaga jest zaznaczona
    if (item.includeTravelServiceCost) {
      detailsRows.push(`
        <tr>
          <td colspan="6" style="padding: 8px 15px; border-bottom: 1px solid #eee; background-color: #f8fff0; font-size: 0.9em;">
            <strong>🚚 Uwzględniono koszt dojazdu / serwis:</strong> ${formatCurrency(item.totalTravelServiceCost || 0)}<br>
            • Dystans (tam i z powrotem): ${item.travelServiceDistanceKm || 0} km<br>
            • Liczba techników: ${item.travelServiceNumberOfTechnicians || 1}<br>
            • Stawka za technika: ${formatCurrency(item.travelServiceServiceRatePerTechnician || 150)}<br>
            • Stawka za km: ${formatCurrency(item.travelServiceTravelRatePerKm || 1.15)}/km<br>
            • Ilość wyjazdów: ${item.travelServiceNumberOfTrips || 1}
          </td>
        </tr>
      `);
    }

    // Opcja: Koszty serwisowe (pozycje serwisowe) - pokazuj gdy flaga jest zaznaczona
    if (item.includeServiceItems) {
      let serviceItemsHTML = '';
      
      // Pobierz rzeczywiste nazwy usług z bazy danych
      if (item.serviceItems && item.serviceItems.length > 0) {
        if (parseFloat(item.serviceItem1Cost || 0) > 0 && item.serviceItems[0]) {
          serviceItemsHTML += `• ${item.serviceItems[0].itemName}: ${formatCurrency(item.serviceItem1Cost)}<br>`;
        }
        if (parseFloat(item.serviceItem2Cost || 0) > 0 && item.serviceItems[1]) {
          serviceItemsHTML += `• ${item.serviceItems[1].itemName}: ${formatCurrency(item.serviceItem2Cost)}<br>`;
        }
        if (parseFloat(item.serviceItem3Cost || 0) > 0 && item.serviceItems[2]) {
          serviceItemsHTML += `• ${item.serviceItems[2].itemName}: ${formatCurrency(item.serviceItem3Cost)}<br>`;
        }
        if (parseFloat(item.serviceItem4Cost || 0) > 0 && item.serviceItems[3]) {
          serviceItemsHTML += `• ${item.serviceItems[3].itemName}: ${formatCurrency(item.serviceItem4Cost)}<br>`;
        }
      } else {
        // Fallback nazwy
        if (parseFloat(item.serviceItem1Cost || 0) > 0) {
          serviceItemsHTML += `• Pozycja serwisowa 1: ${formatCurrency(item.serviceItem1Cost)}<br>`;
        }
        if (parseFloat(item.serviceItem2Cost || 0) > 0) {
          serviceItemsHTML += `• Pozycja serwisowa 2: ${formatCurrency(item.serviceItem2Cost)}<br>`;
        }
        if (parseFloat(item.serviceItem3Cost || 0) > 0) {
          serviceItemsHTML += `• Pozycja serwisowa 3: ${formatCurrency(item.serviceItem3Cost)}<br>`;
        }
        if (parseFloat(item.serviceItem4Cost || 0) > 0) {
          serviceItemsHTML += `• Pozycja serwisowa 4: ${formatCurrency(item.serviceItem4Cost)}<br>`;
        }
      }
      
      detailsRows.push(`
        <tr>
          <td colspan="6" style="padding: 8px 15px; border-bottom: 1px solid #eee; background-color: #fff0f8; font-size: 0.9em;">
            <strong>🛠️ Uwzględniono koszty serwisowe:</strong> ${formatCurrency(item.totalServiceItemsCost)}<br>
            ${serviceItemsHTML}
          </td>
        </tr>
      `);
    }

    // Opcja: Wyposażenie dodatkowe i akcesoria
    const hasAdditionalCosts = parseFloat(item.additionalCost || 0) > 0;
    const hasAccessoriesCosts = parseFloat(item.accessoriesCost || 0) > 0;
    
    if (hasAdditionalCosts || hasAccessoriesCosts) {
      let additionalHTML = '';
      
      // Parse selected items from notes
      let selectedAdditional = [];
      let selectedAccessories = [];
      
      try {
        if (item.notes && item.notes.startsWith('{"selectedAdditional"')) {
          const notesData = JSON.parse(item.notes);
          selectedAdditional = notesData.selectedAdditional || [];
          selectedAccessories = notesData.selectedAccessories || [];
        }
      } catch (e) {
        console.error('Error parsing notes for additional equipment:', e);
      }
      
      // Show detailed equipment and accessories using pre-fetched data
      if (hasAdditionalCosts && item.additionalEquipmentData && item.additionalEquipmentData.length > 0) {
        additionalHTML += `<strong>Wyposażenie dodatkowe:</strong><br>`;
        
        for (const additionalItem of item.additionalEquipmentData) {
          const itemCost = parseFloat(additionalItem.price) * item.quantity;
          additionalHTML += `&nbsp;&nbsp;• ${additionalItem.name}: ${formatCurrency(parseFloat(additionalItem.price))} × ${item.quantity} = ${formatCurrency(itemCost)}<br>`;
        }
        additionalHTML += `&nbsp;&nbsp;<strong>Suma wyposażenia dodatkowego: ${formatCurrency(parseFloat(item.additionalCost))}</strong><br><br>`;
      } else if (hasAdditionalCosts) {
        additionalHTML += `• Wyposażenie dodatkowe: ${formatCurrency(parseFloat(item.additionalCost))}<br>`;
      }
      
      if (hasAccessoriesCosts && item.accessoriesData && item.accessoriesData.length > 0) {
        additionalHTML += `<strong>Akcesoria:</strong><br>`;
        
        for (const accessoryItem of item.accessoriesData) {
          const itemCost = parseFloat(accessoryItem.price) * item.quantity;
          additionalHTML += `&nbsp;&nbsp;• ${accessoryItem.name}: ${formatCurrency(parseFloat(accessoryItem.price))} × ${item.quantity} = ${formatCurrency(itemCost)}<br>`;
        }
        additionalHTML += `&nbsp;&nbsp;<strong>Suma akcesoriów: ${formatCurrency(parseFloat(item.accessoriesCost))}</strong><br>`;
      } else if (hasAccessoriesCosts) {
        additionalHTML += `• Akcesoria: ${formatCurrency(parseFloat(item.accessoriesCost))}<br>`;
      }
      
      const totalAdditionalCost = (parseFloat(item.additionalCost || 0) + parseFloat(item.accessoriesCost || 0));
      
      detailsRows.push(`
        <tr>
          <td colspan="6" style="padding: 8px 15px; border-bottom: 1px solid #eee; background-color: #f0f8ff; font-size: 0.9em;">
            <strong>📦 Uwzględniono wyposażenie dodatkowe i akcesoria:</strong> ${formatCurrency(totalAdditionalCost)}<br>
            ${additionalHTML}
          </td>
        </tr>
      `);
    }

    // Uwagi użytkownika
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


