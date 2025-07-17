import {
  users,
  equipment,
  equipmentCategories,
  equipmentPricing,
  equipmentAdditional,
  clients,
  quotes,
  quoteItems,
  maintenanceDefaults,
  type User,
  type UpsertUser,
  type Equipment,
  type EquipmentCategory,
  type EquipmentPricing,
  type EquipmentAdditional,
  type InsertEquipmentAdditional,
  type EquipmentWithCategory,
  type Client,
  type Quote,
  type QuoteItem,
  type QuoteWithDetails,
  type InsertEquipmentCategory,
  type InsertEquipment,
  type InsertEquipmentPricing,
  type InsertClient,
  type InsertQuote,
  type InsertQuoteItem,
  type MaintenanceDefaults,
  type InsertMaintenanceDefaults,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, and } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User>;
  toggleUserActive(id: string): Promise<User>;

  // Equipment categories
  getEquipmentCategories(): Promise<EquipmentCategory[]>;
  createEquipmentCategory(category: InsertEquipmentCategory): Promise<EquipmentCategory>;
  updateEquipmentCategory(id: number, category: Partial<InsertEquipmentCategory>): Promise<EquipmentCategory>;
  deleteEquipmentCategory(id: number): Promise<void>;

  // Equipment
  getEquipment(): Promise<EquipmentWithCategory[]>;
  getEquipmentById(id: number): Promise<EquipmentWithCategory | undefined>;
  getEquipmentByCategory(categoryId: number): Promise<EquipmentWithCategory[]>;
  createEquipment(equipment: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: number, equipment: Partial<InsertEquipment>): Promise<Equipment>;
  deleteEquipment(id: number): Promise<void>;

  // Equipment pricing
  createEquipmentPricing(pricing: InsertEquipmentPricing): Promise<EquipmentPricing>;
  updateEquipmentPricing(id: number, pricing: Partial<InsertEquipmentPricing>): Promise<EquipmentPricing>;
  deleteEquipmentPricing(id: number): Promise<void>;

  // Equipment additional and accessories
  getEquipmentAdditional(equipmentId: number): Promise<EquipmentAdditional[]>;
  createEquipmentAdditional(additional: InsertEquipmentAdditional): Promise<EquipmentAdditional>;
  updateEquipmentAdditional(id: number, additional: Partial<InsertEquipmentAdditional>): Promise<EquipmentAdditional>;
  deleteEquipmentAdditional(id: number): Promise<void>;

  // Clients
  getClients(): Promise<Client[]>;
  getClientById(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: number): Promise<void>;

  // Quotes
  getQuotes(): Promise<QuoteWithDetails[]>;
  getQuoteById(id: number): Promise<QuoteWithDetails | undefined>;
  getQuotesByUser(userId: string): Promise<QuoteWithDetails[]>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote>;
  deleteQuote(id: number): Promise<void>;

  // Quote items
  createQuoteItem(item: InsertQuoteItem): Promise<QuoteItem>;
  updateQuoteItem(id: number, item: Partial<InsertQuoteItem>): Promise<QuoteItem>;
  deleteQuoteItem(id: number): Promise<void>;
  getQuoteItems(quoteId: number): Promise<QuoteItem[]>;

  // Maintenance defaults
  getMaintenanceDefaults(categoryName: string): Promise<MaintenanceDefaults | undefined>;
  getAllMaintenanceDefaults(): Promise<MaintenanceDefaults[]>;
  updateMaintenanceDefaults(categoryName: string, defaults: Partial<InsertMaintenanceDefaults>): Promise<MaintenanceDefaults>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async toggleUserActive(id: string): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    
    const [updatedUser] = await db
      .update(users)
      .set({ isActive: !user.isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Equipment categories
  async getEquipmentCategories(): Promise<EquipmentCategory[]> {
    return await db.select().from(equipmentCategories);
  }

  async createEquipmentCategory(category: InsertEquipmentCategory): Promise<EquipmentCategory> {
    const [result] = await db.insert(equipmentCategories).values(category).returning();
    return result;
  }

  async updateEquipmentCategory(id: number, category: Partial<InsertEquipmentCategory>): Promise<EquipmentCategory> {
    const [result] = await db
      .update(equipmentCategories)
      .set(category)
      .where(eq(equipmentCategories.id, id))
      .returning();
    return result;
  }

  async deleteEquipmentCategory(id: number): Promise<void> {
    await db.delete(equipmentCategories).where(eq(equipmentCategories.id, id));
  }

  // Equipment
  async getEquipment(): Promise<EquipmentWithCategory[]> {
    const result = await db
      .select()
      .from(equipment)
      .leftJoin(equipmentCategories, eq(equipment.categoryId, equipmentCategories.id))
      .leftJoin(equipmentPricing, eq(equipment.id, equipmentPricing.equipmentId))
      .leftJoin(equipmentAdditional, eq(equipment.id, equipmentAdditional.equipmentId))
      .where(eq(equipment.isActive, true));

    const equipmentMap = new Map<number, EquipmentWithCategory>();

    for (const row of result) {
      if (!equipmentMap.has(row.equipment.id)) {
        equipmentMap.set(row.equipment.id, {
          ...row.equipment,
          category: row.equipment_categories!,
          pricing: [],
          additionalEquipment: [],
        });
      }

      const equipmentItem = equipmentMap.get(row.equipment.id)!;

      if (row.equipment_pricing) {
        const existingPricing = equipmentItem.pricing.find(p => p.id === row.equipment_pricing!.id);
        if (!existingPricing) {
          equipmentItem.pricing.push(row.equipment_pricing);
        }
      }

      if (row.equipment_additional) {
        const existingAdditional = equipmentItem.additionalEquipment.find(a => a.id === row.equipment_additional!.id);
        if (!existingAdditional) {
          equipmentItem.additionalEquipment.push(row.equipment_additional);
        }
      }
    }

    return Array.from(equipmentMap.values());
  }

  async getEquipmentById(id: number): Promise<EquipmentWithCategory | undefined> {
    const result = await db
      .select()
      .from(equipment)
      .leftJoin(equipmentCategories, eq(equipment.categoryId, equipmentCategories.id))
      .leftJoin(equipmentPricing, eq(equipment.id, equipmentPricing.equipmentId))
      .leftJoin(equipmentAdditional, eq(equipment.id, equipmentAdditional.equipmentId))
      .where(eq(equipment.id, id));

    if (result.length === 0) return undefined;

    const equipmentData = result[0].equipment;
    const category = result[0].equipment_categories!;
    const pricing = result.map(row => row.equipment_pricing).filter(Boolean) as EquipmentPricing[];
    const additionalEquipment = result.map(row => row.equipment_additional).filter(Boolean) as EquipmentAdditional[];

    return {
      ...equipmentData,
      category,
      pricing,
      additionalEquipment,
    };
  }

  async getEquipmentByCategory(categoryId: number): Promise<EquipmentWithCategory[]> {
    const result = await db
      .select()
      .from(equipment)
      .leftJoin(equipmentCategories, eq(equipment.categoryId, equipmentCategories.id))
      .leftJoin(equipmentPricing, eq(equipment.id, equipmentPricing.equipmentId))
      .where(and(eq(equipment.categoryId, categoryId), eq(equipment.isActive, true)));

    const equipmentMap = new Map<number, EquipmentWithCategory>();

    for (const row of result) {
      if (!equipmentMap.has(row.equipment.id)) {
        equipmentMap.set(row.equipment.id, {
          ...row.equipment,
          category: row.equipment_categories!,
          pricing: [],
        });
      }

      if (row.equipment_pricing) {
        equipmentMap.get(row.equipment.id)!.pricing.push(row.equipment_pricing);
      }
    }

    return Array.from(equipmentMap.values());
  }

  async createEquipment(equipmentData: InsertEquipment): Promise<Equipment> {
    const [result] = await db.insert(equipment).values(equipmentData).returning();
    
    // Automatically create standard pricing tiers for new equipment
    const standardPricing = [
      { periodStart: 1, periodEnd: 2, discountPercent: 0 },
      { periodStart: 3, periodEnd: 7, discountPercent: 14.29 },
      { periodStart: 8, periodEnd: 18, discountPercent: 28.57 },
      { periodStart: 19, periodEnd: 29, discountPercent: 42.86 },
      { periodStart: 30, periodEnd: null, discountPercent: 57.14 }
    ];

    // Create default pricing entries (admin will need to set actual prices)
    const defaultPricePerDay = 100; // Default price that admin should update
    
    for (const tier of standardPricing) {
      const discountedPrice = defaultPricePerDay * (1 - tier.discountPercent / 100);
      await db.insert(equipmentPricing).values({
        equipmentId: result.id,
        periodStart: tier.periodStart,
        periodEnd: tier.periodEnd,
        pricePerDay: discountedPrice.toFixed(2),
        discountPercent: tier.discountPercent.toString()
      });
    }

    // Create default additional equipment entry for immediate access
    await db.insert(equipmentAdditional).values({
      equipmentId: result.id,
      type: "type1",
      name: "Dodatkowe wyposażenie 1",
      pricePerDay: "0.00"
    });
    
    return result;
  }

  async updateEquipment(id: number, equipmentData: Partial<InsertEquipment>): Promise<Equipment> {
    const [result] = await db
      .update(equipment)
      .set({ ...equipmentData, updatedAt: new Date() })
      .where(eq(equipment.id, id))
      .returning();
    return result;
  }

  async deleteEquipment(id: number): Promise<void> {
    await db.update(equipment).set({ isActive: false }).where(eq(equipment.id, id));
  }

  // Equipment pricing
  async createEquipmentPricing(pricing: InsertEquipmentPricing): Promise<EquipmentPricing> {
    const [result] = await db.insert(equipmentPricing).values(pricing).returning();
    return result;
  }

  async updateEquipmentPricing(id: number, pricing: Partial<InsertEquipmentPricing>): Promise<EquipmentPricing> {
    const [result] = await db
      .update(equipmentPricing)
      .set(pricing)
      .where(eq(equipmentPricing.id, id))
      .returning();
    return result;
  }

  async deleteEquipmentPricing(id: number): Promise<void> {
    await db.delete(equipmentPricing).where(eq(equipmentPricing.id, id));
  }

  // Equipment additional and accessories
  async getEquipmentAdditional(equipmentId: number): Promise<EquipmentAdditional[]> {
    return await db
      .select()
      .from(equipmentAdditional)
      .where(eq(equipmentAdditional.equipmentId, equipmentId))
      .orderBy(equipmentAdditional.type, equipmentAdditional.position);
  }

  async createEquipmentAdditional(additional: InsertEquipmentAdditional): Promise<EquipmentAdditional> {
    const [result] = await db.insert(equipmentAdditional).values(additional).returning();
    return result;
  }

  async updateEquipmentAdditional(id: number, additional: Partial<InsertEquipmentAdditional>): Promise<EquipmentAdditional> {
    const [result] = await db
      .update(equipmentAdditional)
      .set({ ...additional, updatedAt: new Date() })
      .where(eq(equipmentAdditional.id, id))
      .returning();
    return result;
  }

  async deleteEquipmentAdditional(id: number): Promise<void> {
    await db.delete(equipmentAdditional).where(eq(equipmentAdditional.id, id));
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getClientById(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [result] = await db.insert(clients).values(client).returning();
    return result;
  }

  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client> {
    const [result] = await db
      .update(clients)
      .set({ ...client, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return result;
  }

  async deleteClient(id: number): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  // Quotes
  async getQuotes(): Promise<QuoteWithDetails[]> {
    const result = await db
      .select()
      .from(quotes)
      .leftJoin(clients, eq(quotes.clientId, clients.id))
      .leftJoin(users, eq(quotes.createdById, users.id))
      .leftJoin(quoteItems, eq(quotes.id, quoteItems.quoteId))
      .leftJoin(equipment, eq(quoteItems.equipmentId, equipment.id))
      .leftJoin(equipmentCategories, eq(equipment.categoryId, equipmentCategories.id))
      .orderBy(desc(quotes.createdAt));

    const quotesMap = new Map<number, QuoteWithDetails>();

    for (const row of result) {
      if (!quotesMap.has(row.quotes.id)) {
        quotesMap.set(row.quotes.id, {
          ...row.quotes,
          client: row.clients!,
          createdBy: row.users!,
          items: [],
        });
      }

      if (row.quote_items && row.equipment && row.equipment_categories) {
        const quote = quotesMap.get(row.quotes.id)!;
        const existingItem = quote.items.find(item => item.id === row.quote_items!.id);
        
        if (!existingItem) {
          quote.items.push({
            ...row.quote_items,
            equipment: {
              ...row.equipment,
              category: row.equipment_categories,
              pricing: [], // Would need separate query for pricing
            },
          });
        }
      }
    }

    return Array.from(quotesMap.values());
  }

  async getQuoteById(id: number): Promise<QuoteWithDetails | undefined> {
    const result = await db
      .select()
      .from(quotes)
      .leftJoin(clients, eq(quotes.clientId, clients.id))
      .leftJoin(users, eq(quotes.createdById, users.id))
      .leftJoin(quoteItems, eq(quotes.id, quoteItems.quoteId))
      .leftJoin(equipment, eq(quoteItems.equipmentId, equipment.id))
      .leftJoin(equipmentCategories, eq(equipment.categoryId, equipmentCategories.id))
      .where(eq(quotes.id, id));

    if (result.length === 0) return undefined;

    const quote = result[0].quotes;
    const client = result[0].clients!;
    const createdBy = result[0].users!;
    
    const items = result
      .filter(row => row.quote_items && row.equipment && row.equipment_categories)
      .map(row => ({
        ...row.quote_items!,
        equipment: {
          ...row.equipment!,
          category: row.equipment_categories!,
          pricing: [], // Would need separate query for pricing
        },
      }));

    return {
      ...quote,
      client,
      createdBy,
      items,
    };
  }

  async getQuotesByUser(userId: string): Promise<QuoteWithDetails[]> {
    const result = await db
      .select()
      .from(quotes)
      .leftJoin(clients, eq(quotes.clientId, clients.id))
      .leftJoin(users, eq(quotes.createdById, users.id))
      .leftJoin(quoteItems, eq(quotes.id, quoteItems.quoteId))
      .leftJoin(equipment, eq(quoteItems.equipmentId, equipment.id))
      .leftJoin(equipmentCategories, eq(equipment.categoryId, equipmentCategories.id))
      .where(eq(quotes.createdById, userId))
      .orderBy(desc(quotes.createdAt));

    const quotesMap = new Map<number, QuoteWithDetails>();

    for (const row of result) {
      if (!quotesMap.has(row.quotes.id)) {
        quotesMap.set(row.quotes.id, {
          ...row.quotes,
          client: row.clients!,
          createdBy: row.users!,
          items: [],
        });
      }

      if (row.quote_items && row.equipment && row.equipment_categories) {
        const quote = quotesMap.get(row.quotes.id)!;
        const existingItem = quote.items.find(item => item.id === row.quote_items!.id);
        
        if (!existingItem) {
          quote.items.push({
            ...row.quote_items,
            equipment: {
              ...row.equipment,
              category: row.equipment_categories,
              pricing: [],
            },
          });
        }
      }
    }

    return Array.from(quotesMap.values());
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    const [result] = await db.insert(quotes).values(quote).returning();
    return result;
  }

  async updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote> {
    const [result] = await db
      .update(quotes)
      .set({ ...quote, updatedAt: new Date() })
      .where(eq(quotes.id, id))
      .returning();
    return result;
  }

  async deleteQuote(id: number): Promise<void> {
    // First delete all quote items
    await db.delete(quoteItems).where(eq(quoteItems.quoteId, id));
    // Then delete the quote itself
    await db.delete(quotes).where(eq(quotes.id, id));
  }

  // Quote items
  async createQuoteItem(item: InsertQuoteItem): Promise<QuoteItem> {
    const [result] = await db.insert(quoteItems).values(item).returning();
    return result;
  }

  async updateQuoteItem(id: number, item: Partial<InsertQuoteItem>): Promise<QuoteItem> {
    const [result] = await db
      .update(quoteItems)
      .set(item)
      .where(eq(quoteItems.id, id))
      .returning();
    return result;
  }

  async deleteQuoteItem(id: number): Promise<void> {
    await db.delete(quoteItems).where(eq(quoteItems.id, id));
  }

  async getQuoteItems(quoteId: number): Promise<QuoteItem[]> {
    return await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));
  }

  // Maintenance defaults operations
  async getMaintenanceDefaults(categoryName: string): Promise<MaintenanceDefaults | undefined> {
    const [defaults] = await db
      .select()
      .from(maintenanceDefaults)
      .where(eq(maintenanceDefaults.categoryName, categoryName))
      .limit(1);
    return defaults;
  }

  async getAllMaintenanceDefaults(): Promise<MaintenanceDefaults[]> {
    return await db.select().from(maintenanceDefaults);
  }

  async updateMaintenanceDefaults(categoryName: string, defaultsData: Partial<InsertMaintenanceDefaults>): Promise<MaintenanceDefaults> {
    // Check if record exists for this category
    const existing = await this.getMaintenanceDefaults(categoryName);
    
    if (existing) {
      // Update existing record
      const [updated] = await db
        .update(maintenanceDefaults)
        .set({
          ...defaultsData,
          updatedAt: new Date(),
        })
        .where(eq(maintenanceDefaults.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new record for this category
      const [created] = await db
        .insert(maintenanceDefaults)
        .values({
          ...defaultsData,
          categoryName,
        })
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
