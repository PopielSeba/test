var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  clients: () => clients,
  clientsRelations: () => clientsRelations,
  equipment: () => equipment,
  equipmentAdditional: () => equipmentAdditional,
  equipmentAdditionalRelations: () => equipmentAdditionalRelations,
  equipmentCategories: () => equipmentCategories,
  equipmentCategoriesRelations: () => equipmentCategoriesRelations,
  equipmentPricing: () => equipmentPricing,
  equipmentPricingRelations: () => equipmentPricingRelations,
  equipmentRelations: () => equipmentRelations,
  equipmentServiceCosts: () => equipmentServiceCosts,
  equipmentServiceCostsRelations: () => equipmentServiceCostsRelations,
  equipmentServiceItems: () => equipmentServiceItems,
  equipmentServiceItemsRelations: () => equipmentServiceItemsRelations,
  insertClientSchema: () => insertClientSchema,
  insertEquipmentAdditionalSchema: () => insertEquipmentAdditionalSchema,
  insertEquipmentCategorySchema: () => insertEquipmentCategorySchema,
  insertEquipmentPricingSchema: () => insertEquipmentPricingSchema,
  insertEquipmentSchema: () => insertEquipmentSchema,
  insertEquipmentServiceCostsSchema: () => insertEquipmentServiceCostsSchema,
  insertEquipmentServiceItemsSchema: () => insertEquipmentServiceItemsSchema,
  insertPricingSchemaSchema: () => insertPricingSchemaSchema,
  insertQuoteItemSchema: () => insertQuoteItemSchema,
  insertQuoteSchema: () => insertQuoteSchema,
  insertUserSchema: () => insertUserSchema,
  pricingSchemas: () => pricingSchemas,
  pricingSchemasRelations: () => pricingSchemasRelations,
  quoteItems: () => quoteItems,
  quoteItemsRelations: () => quoteItemsRelations,
  quotes: () => quotes,
  quotesRelations: () => quotesRelations,
  selectClientSchema: () => selectClientSchema,
  selectEquipmentAdditionalSchema: () => selectEquipmentAdditionalSchema,
  selectEquipmentCategorySchema: () => selectEquipmentCategorySchema,
  selectEquipmentPricingSchema: () => selectEquipmentPricingSchema,
  selectEquipmentSchema: () => selectEquipmentSchema,
  selectEquipmentServiceCostsSchema: () => selectEquipmentServiceCostsSchema,
  selectEquipmentServiceItemsSchema: () => selectEquipmentServiceItemsSchema,
  selectPricingSchemaSchema: () => selectPricingSchemaSchema,
  selectQuoteItemSchema: () => selectQuoteItemSchema,
  selectQuoteSchema: () => selectQuoteSchema,
  selectUserSchema: () => selectUserSchema,
  sessions: () => sessions,
  users: () => users,
  usersRelations: () => usersRelations
});
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("employee"),
  // admin, employee
  isActive: boolean("is_active").default(true).notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
  // admin approval required
  approvedAt: timestamp("approved_at"),
  approvedById: varchar("approved_by_id"),
  // Local authentication fields
  password: varchar("password"),
  // For local auth users
  authProvider: varchar("auth_provider").notNull().default("replit"),
  // "replit" or "local"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var equipmentCategories = pgTable("equipment_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow()
});
var equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  categoryId: integer("category_id").references(() => equipmentCategories.id).notNull(),
  description: text("description"),
  model: varchar("model"),
  power: varchar("power"),
  // e.g., "90.18 kW", "235 kW"
  // Additional technical specifications for generators
  fuelConsumption75: decimal("fuel_consumption_75", { precision: 6, scale: 2 }),
  // l/h at 75% load
  dimensions: varchar("dimensions"),
  // LxWxH in mm
  weight: varchar("weight"),
  // in kg
  engine: varchar("engine"),
  // engine manufacturer/model
  alternator: varchar("alternator"),
  // alternator info
  fuelTankCapacity: integer("fuel_tank_capacity"),
  // liters
  imageUrl: varchar("image_url"),
  // equipment image URL
  quantity: integer("quantity").notNull().default(0),
  availableQuantity: integer("available_quantity").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var equipmentPricing = pgTable("equipment_pricing", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").references(() => equipment.id).notNull(),
  periodStart: integer("period_start").notNull(),
  // days
  periodEnd: integer("period_end"),
  // days, null for 30+
  pricePerDay: decimal("price_per_day", { precision: 10, scale: 2 }).notNull(),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow()
});
var equipmentAdditional = pgTable("equipment_additional", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").references(() => equipment.id).notNull(),
  type: varchar("type").notNull(),
  // "additional" or "accessories"
  name: varchar("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  position: integer("position").notNull().default(1),
  // 1-4 for ordering
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name").notNull(),
  nip: varchar("nip"),
  contactPerson: varchar("contact_person"),
  phone: varchar("phone"),
  email: varchar("email"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var pricingSchemas = pgTable("pricing_schemas", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  // e.g., "Rabat od pierwszego dnia", "Rabat progowy"
  description: text("description"),
  calculationMethod: varchar("calculation_method").notNull().default("progressive"),
  // "first_day" or "progressive"
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  quoteNumber: varchar("quote_number").notNull().unique(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  createdById: varchar("created_by_id").references(() => users.id),
  isGuestQuote: boolean("is_guest_quote").default(false).notNull(),
  guestEmail: varchar("guest_email"),
  pricingSchemaId: integer("pricing_schema_id").references(() => pricingSchemas.id),
  status: varchar("status").notNull().default("draft"),
  // draft, pending, approved, rejected
  totalNet: decimal("total_net", { precision: 12, scale: 2 }).notNull(),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).notNull().default("23"),
  totalGross: decimal("total_gross", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var quoteItems = pgTable("quote_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").references(() => quotes.id).notNull(),
  equipmentId: integer("equipment_id").references(() => equipment.id).notNull(),
  quantity: integer("quantity").notNull(),
  rentalPeriodDays: integer("rental_period_days").notNull(),
  pricePerDay: decimal("price_per_day", { precision: 10, scale: 2 }).notNull(),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  // Fuel cost fields for generators
  fuelConsumptionLH: decimal("fuel_consumption_lh", { precision: 5, scale: 2 }),
  // liters per hour
  fuelPricePerLiter: decimal("fuel_price_per_liter", { precision: 6, scale: 2 }),
  // PLN per liter
  hoursPerDay: integer("hours_per_day").default(8),
  // operating hours per day
  totalFuelCost: decimal("total_fuel_cost", { precision: 12, scale: 2 }).default("0"),
  includeFuelCost: boolean("include_fuel_cost").default(false),
  // Maintenance/exploitation cost fields for generators (every 500 mth)
  includeMaintenanceCost: boolean("include_maintenance_cost").default(false),
  maintenanceIntervalHours: integer("maintenance_interval_hours").default(500),
  // every 500 mth
  // Filter costs (6 filters)
  fuelFilter1Cost: decimal("fuel_filter_1_cost", { precision: 8, scale: 2 }).default("49.00"),
  fuelFilter2Cost: decimal("fuel_filter_2_cost", { precision: 8, scale: 2 }).default("118.00"),
  oilFilterCost: decimal("oil_filter_cost", { precision: 8, scale: 2 }).default("45.00"),
  airFilter1Cost: decimal("air_filter_1_cost", { precision: 8, scale: 2 }).default("105.00"),
  airFilter2Cost: decimal("air_filter_2_cost", { precision: 8, scale: 2 }).default("54.00"),
  engineFilterCost: decimal("engine_filter_cost", { precision: 8, scale: 2 }).default("150.00"),
  // Oil cost
  oilCost: decimal("oil_cost", { precision: 8, scale: 2 }).default("162.44"),
  oilQuantityLiters: decimal("oil_quantity_liters", { precision: 5, scale: 1 }).default("14.7"),
  // Service work cost
  serviceWorkHours: decimal("service_work_hours", { precision: 4, scale: 1 }).default("2"),
  serviceWorkRatePerHour: decimal("service_work_rate_per_hour", { precision: 8, scale: 2 }).default("100.00"),
  // Service travel cost
  serviceTravelDistanceKm: decimal("service_travel_distance_km", { precision: 8, scale: 2 }).default("31"),
  serviceTravelRatePerKm: decimal("service_travel_rate_per_km", { precision: 6, scale: 2 }).default("1.15"),
  // Total maintenance cost for the rental period
  totalMaintenanceCost: decimal("total_maintenance_cost", { precision: 12, scale: 2 }).default("0"),
  expectedMaintenanceHours: integer("expected_maintenance_hours"),
  // expected operating hours for the rental period
  // Service travel cost fields
  includeTravelCost: boolean("include_travel_cost").default(false),
  travelDistanceKm: decimal("travel_distance_km", { precision: 8, scale: 2 }),
  numberOfTechnicians: integer("number_of_technicians").default(1),
  hourlyRatePerTechnician: decimal("hourly_rate_per_technician", { precision: 8, scale: 2 }).default("150"),
  travelRatePerKm: decimal("travel_rate_per_km", { precision: 6, scale: 2 }).default("1.15"),
  totalTravelCost: decimal("total_travel_cost", { precision: 10, scale: 2 }).default("0"),
  // Service items for heaters
  includeServiceItems: boolean("include_service_items").default(false),
  serviceItem1Cost: decimal("service_item_1_cost", { precision: 8, scale: 2 }).default("0.00"),
  serviceItem2Cost: decimal("service_item_2_cost", { precision: 8, scale: 2 }).default("0.00"),
  serviceItem3Cost: decimal("service_item_3_cost", { precision: 8, scale: 2 }).default("0.00"),
  totalServiceItemsCost: decimal("total_service_items_cost", { precision: 10, scale: 2 }).default("0.00"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});
var equipmentServiceCosts = pgTable("equipment_service_costs", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").references(() => equipment.id).notNull(),
  serviceIntervalMonths: integer("service_interval_months").default(12).notNull(),
  // How often service is required
  workerHours: decimal("worker_hours", { precision: 4, scale: 1 }).default("2.0").notNull(),
  // Fixed field name
  workerCostPerHour: decimal("worker_cost_per_hour", { precision: 8, scale: 2 }).default("100.00").notNull(),
  // Fixed field name
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var equipmentServiceItems = pgTable("equipment_service_items", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").references(() => equipment.id).notNull(),
  itemName: varchar("item_name").notNull(),
  // e.g., "Filtr paliwa 1", "Filtr oleju", "Wymiana oleju"
  itemCost: decimal("item_cost", { precision: 8, scale: 2 }).default("0.00").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var equipmentRelations = relations(equipment, ({ one, many }) => ({
  category: one(equipmentCategories, {
    fields: [equipment.categoryId],
    references: [equipmentCategories.id]
  }),
  pricing: many(equipmentPricing),
  quoteItems: many(quoteItems),
  additionalEquipment: many(equipmentAdditional),
  serviceCosts: one(equipmentServiceCosts, {
    fields: [equipment.id],
    references: [equipmentServiceCosts.equipmentId]
  }),
  serviceItems: many(equipmentServiceItems)
}));
var equipmentAdditionalRelations = relations(equipmentAdditional, ({ one }) => ({
  equipment: one(equipment, {
    fields: [equipmentAdditional.equipmentId],
    references: [equipment.id]
  })
}));
var equipmentCategoriesRelations = relations(equipmentCategories, ({ many }) => ({
  equipment: many(equipment)
}));
var equipmentPricingRelations = relations(equipmentPricing, ({ one }) => ({
  equipment: one(equipment, {
    fields: [equipmentPricing.equipmentId],
    references: [equipment.id]
  })
}));
var clientsRelations = relations(clients, ({ many }) => ({
  quotes: many(quotes)
}));
var pricingSchemasRelations = relations(pricingSchemas, ({ many }) => ({
  quotes: many(quotes)
}));
var quotesRelations = relations(quotes, ({ one, many }) => ({
  client: one(clients, {
    fields: [quotes.clientId],
    references: [clients.id]
  }),
  createdBy: one(users, {
    fields: [quotes.createdById],
    references: [users.id]
  }),
  pricingSchema: one(pricingSchemas, {
    fields: [quotes.pricingSchemaId],
    references: [pricingSchemas.id]
  }),
  items: many(quoteItems)
}));
var quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteItems.quoteId],
    references: [quotes.id]
  }),
  equipment: one(equipment, {
    fields: [quoteItems.equipmentId],
    references: [equipment.id]
  })
}));
var equipmentServiceCostsRelations = relations(equipmentServiceCosts, ({ one }) => ({
  equipment: one(equipment, {
    fields: [equipmentServiceCosts.equipmentId],
    references: [equipment.id]
  })
}));
var equipmentServiceItemsRelations = relations(equipmentServiceItems, ({ one }) => ({
  equipment: one(equipment, {
    fields: [equipmentServiceItems.equipmentId],
    references: [equipment.id]
  })
}));
var usersRelations = relations(users, ({ many }) => ({
  quotes: many(quotes)
}));
var insertUserSchema = createInsertSchema(users);
var insertEquipmentCategorySchema = createInsertSchema(equipmentCategories);
var insertEquipmentSchema = createInsertSchema(equipment).extend({
  fuelConsumption75: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === void 0 || val === null) return void 0;
    return typeof val === "number" ? val.toString() : val;
  }),
  fuelTankCapacity: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === void 0 || val === null) return void 0;
    return typeof val === "number" ? val : parseInt(val?.toString() || "0") || void 0;
  })
});
var insertEquipmentPricingSchema = createInsertSchema(equipmentPricing);
var insertClientSchema = createInsertSchema(clients);
var insertQuoteSchema = createInsertSchema(quotes);
var insertQuoteItemSchema = createInsertSchema(quoteItems);
var insertEquipmentAdditionalSchema = createInsertSchema(equipmentAdditional);
var insertPricingSchemaSchema = createInsertSchema(pricingSchemas);
var insertEquipmentServiceCostsSchema = createInsertSchema(equipmentServiceCosts);
var insertEquipmentServiceItemsSchema = createInsertSchema(equipmentServiceItems);
var selectUserSchema = createSelectSchema(users);
var selectEquipmentCategorySchema = createSelectSchema(equipmentCategories);
var selectEquipmentSchema = createSelectSchema(equipment);
var selectEquipmentPricingSchema = createSelectSchema(equipmentPricing);
var selectClientSchema = createSelectSchema(clients);
var selectQuoteSchema = createSelectSchema(quotes);
var selectQuoteItemSchema = createSelectSchema(quoteItems);
var selectEquipmentAdditionalSchema = createSelectSchema(equipmentAdditional);
var selectPricingSchemaSchema = createSelectSchema(pricingSchemas);
var selectEquipmentServiceCostsSchema = createSelectSchema(equipmentServiceCosts);
var selectEquipmentServiceItemsSchema = createSelectSchema(equipmentServiceItems);

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, and } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createLocalUser(userData) {
    const userId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [user] = await db.insert(users).values({
      id: userId,
      ...userData,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  async getAllUsers() {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }
  async getPendingUsers() {
    return await db.select().from(users).where(eq(users.isApproved, false)).orderBy(desc(users.createdAt));
  }
  async updateUserRole(id, role) {
    const [user] = await db.update(users).set({ role, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return user;
  }
  async approveUser(id, approvedById) {
    const [user] = await db.update(users).set({
      isApproved: true,
      approvedAt: /* @__PURE__ */ new Date(),
      approvedById,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, id)).returning();
    return user;
  }
  async rejectUser(id) {
    await db.delete(users).where(eq(users.id, id));
  }
  async toggleUserActive(id) {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    const [updatedUser] = await db.update(users).set({ isActive: !user.isActive, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return updatedUser;
  }
  async deleteUser(id) {
    await db.delete(users).where(eq(users.id, id));
  }
  // Equipment categories
  async getEquipmentCategories() {
    return await db.select().from(equipmentCategories);
  }
  async createEquipmentCategory(category) {
    const [result] = await db.insert(equipmentCategories).values(category).returning();
    return result;
  }
  async updateEquipmentCategory(id, category) {
    const [result] = await db.update(equipmentCategories).set(category).where(eq(equipmentCategories.id, id)).returning();
    return result;
  }
  async deleteEquipmentCategory(id) {
    const activeEquipmentInCategory = await db.select().from(equipment).where(and(eq(equipment.categoryId, id), eq(equipment.isActive, true)));
    if (activeEquipmentInCategory.length > 0) {
      throw new Error(`Nie mo\u017Cna usun\u0105\u0107 kategorii. Kategoria ma przypisany aktywny sprz\u0119t (${activeEquipmentInCategory.length} pozycji). Najpierw dezaktywuj lub usu\u0144 sprz\u0119t z tej kategorii.`);
    }
    const inactiveEquipment = await db.select().from(equipment).where(and(eq(equipment.categoryId, id), eq(equipment.isActive, false)));
    for (const item of inactiveEquipment) {
      await db.delete(quoteItems).where(eq(quoteItems.equipmentId, item.id));
      await db.delete(equipmentPricing).where(eq(equipmentPricing.equipmentId, item.id));
      await db.delete(equipmentAdditional).where(eq(equipmentAdditional.equipmentId, item.id));
    }
    await db.delete(equipment).where(and(eq(equipment.categoryId, id), eq(equipment.isActive, false)));
    await db.delete(equipmentCategories).where(eq(equipmentCategories.id, id));
  }
  // Equipment
  async getInactiveEquipment() {
    const result = await db.select().from(equipment).leftJoin(equipmentCategories, eq(equipment.categoryId, equipmentCategories.id)).leftJoin(equipmentPricing, eq(equipment.id, equipmentPricing.equipmentId)).leftJoin(equipmentAdditional, eq(equipment.id, equipmentAdditional.equipmentId)).leftJoin(equipmentServiceCosts, eq(equipment.id, equipmentServiceCosts.equipmentId)).leftJoin(equipmentServiceItems, eq(equipment.id, equipmentServiceItems.equipmentId)).where(eq(equipment.isActive, false));
    const equipmentMap = /* @__PURE__ */ new Map();
    for (const row of result) {
      if (!equipmentMap.has(row.equipment.id)) {
        equipmentMap.set(row.equipment.id, {
          ...row.equipment,
          category: row.equipment_categories,
          pricing: [],
          additionalEquipment: [],
          serviceCosts: row.equipment_service_costs || void 0,
          serviceItems: []
        });
      }
      const equipmentItem = equipmentMap.get(row.equipment.id);
      if (row.equipment_pricing) {
        const existingPricing = equipmentItem.pricing.find((p) => p.id === row.equipment_pricing.id);
        if (!existingPricing) {
          equipmentItem.pricing.push(row.equipment_pricing);
        }
      }
      if (row.equipment_additional) {
        const existingAdditional = equipmentItem.additionalEquipment.find((a) => a.id === row.equipment_additional.id);
        if (!existingAdditional) {
          equipmentItem.additionalEquipment.push(row.equipment_additional);
        }
      }
      if (row.equipment_service_items) {
        const existingServiceItem = equipmentItem.serviceItems.find((s) => s.id === row.equipment_service_items.id);
        if (!existingServiceItem) {
          equipmentItem.serviceItems.push(row.equipment_service_items);
        }
      }
    }
    return Array.from(equipmentMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }
  async getEquipment() {
    const result = await db.select().from(equipment).leftJoin(equipmentCategories, eq(equipment.categoryId, equipmentCategories.id)).leftJoin(equipmentPricing, eq(equipment.id, equipmentPricing.equipmentId)).leftJoin(equipmentAdditional, eq(equipment.id, equipmentAdditional.equipmentId)).leftJoin(equipmentServiceCosts, eq(equipment.id, equipmentServiceCosts.equipmentId)).leftJoin(equipmentServiceItems, eq(equipment.id, equipmentServiceItems.equipmentId)).where(eq(equipment.isActive, true));
    const equipmentMap = /* @__PURE__ */ new Map();
    for (const row of result) {
      if (!equipmentMap.has(row.equipment.id)) {
        equipmentMap.set(row.equipment.id, {
          ...row.equipment,
          category: row.equipment_categories,
          pricing: [],
          additionalEquipment: [],
          serviceCosts: row.equipment_service_costs || void 0,
          serviceItems: []
        });
      }
      const equipmentItem = equipmentMap.get(row.equipment.id);
      if (row.equipment_pricing) {
        const existingPricing = equipmentItem.pricing.find((p) => p.id === row.equipment_pricing.id);
        if (!existingPricing) {
          equipmentItem.pricing.push(row.equipment_pricing);
        }
      }
      if (row.equipment_additional) {
        const existingAdditional = equipmentItem.additionalEquipment.find((a) => a.id === row.equipment_additional.id);
        if (!existingAdditional) {
          equipmentItem.additionalEquipment.push(row.equipment_additional);
        }
      }
      if (row.equipment_service_items) {
        const existingServiceItem = equipmentItem.serviceItems.find((s) => s.id === row.equipment_service_items.id);
        if (!existingServiceItem) {
          equipmentItem.serviceItems.push(row.equipment_service_items);
        }
      }
    }
    return Array.from(equipmentMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }
  async getEquipmentById(id) {
    const result = await db.select().from(equipment).leftJoin(equipmentCategories, eq(equipment.categoryId, equipmentCategories.id)).leftJoin(equipmentPricing, eq(equipment.id, equipmentPricing.equipmentId)).leftJoin(equipmentAdditional, eq(equipment.id, equipmentAdditional.equipmentId)).leftJoin(equipmentServiceCosts, eq(equipment.id, equipmentServiceCosts.equipmentId)).leftJoin(equipmentServiceItems, eq(equipment.id, equipmentServiceItems.equipmentId)).where(eq(equipment.id, id));
    if (result.length === 0) return void 0;
    const equipmentData = result[0].equipment;
    const category = result[0].equipment_categories;
    const pricing = result.map((row) => row.equipment_pricing).filter(Boolean);
    const additionalEquipment = result.map((row) => row.equipment_additional).filter(Boolean);
    const serviceCosts = result[0].equipment_service_costs || void 0;
    const serviceItems = result.map((row) => row.equipment_service_items).filter(Boolean);
    return {
      ...equipmentData,
      category,
      pricing,
      additionalEquipment,
      serviceCosts,
      serviceItems
    };
  }
  async getEquipmentByCategory(categoryId) {
    const result = await db.select().from(equipment).leftJoin(equipmentCategories, eq(equipment.categoryId, equipmentCategories.id)).leftJoin(equipmentPricing, eq(equipment.id, equipmentPricing.equipmentId)).where(and(eq(equipment.categoryId, categoryId), eq(equipment.isActive, true)));
    const equipmentMap = /* @__PURE__ */ new Map();
    for (const row of result) {
      if (!equipmentMap.has(row.equipment.id)) {
        equipmentMap.set(row.equipment.id, {
          ...row.equipment,
          category: row.equipment_categories,
          pricing: [],
          additionalEquipment: [],
          serviceItems: []
        });
      }
      if (row.equipment_pricing) {
        equipmentMap.get(row.equipment.id).pricing.push(row.equipment_pricing);
      }
    }
    return Array.from(equipmentMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }
  async createEquipment(equipmentData) {
    const [result] = await db.insert(equipment).values(equipmentData).returning();
    const basicPricing = [
      { periodStart: 1, periodEnd: 2, discountPercent: 0 },
      { periodStart: 3, periodEnd: 7, discountPercent: 0 },
      { periodStart: 8, periodEnd: 18, discountPercent: 0 },
      { periodStart: 19, periodEnd: 29, discountPercent: 0 },
      { periodStart: 30, periodEnd: null, discountPercent: 0 }
    ];
    const basePricePerDay = 100;
    for (const tier of basicPricing) {
      await db.insert(equipmentPricing).values({
        equipmentId: result.id,
        periodStart: tier.periodStart,
        periodEnd: tier.periodEnd,
        pricePerDay: basePricePerDay.toString(),
        discountPercent: tier.discountPercent.toString()
      });
    }
    await db.insert(equipmentAdditional).values({
      equipmentId: result.id,
      type: "additional",
      name: "Dodatkowe wyposa\u017Cenie 1",
      price: "0.00"
    });
    return result;
  }
  async updateEquipment(id, equipmentData) {
    const [result] = await db.update(equipment).set({ ...equipmentData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(equipment.id, id)).returning();
    return result;
  }
  async deleteEquipment(id) {
    await db.update(equipment).set({ isActive: false }).where(eq(equipment.id, id));
  }
  async permanentlyDeleteEquipment(id) {
    await db.delete(quoteItems).where(eq(quoteItems.equipmentId, id));
    await db.delete(equipmentPricing).where(eq(equipmentPricing.equipmentId, id));
    await db.delete(equipmentAdditional).where(eq(equipmentAdditional.equipmentId, id));
    await db.delete(equipmentServiceCosts).where(eq(equipmentServiceCosts.equipmentId, id));
    await db.delete(equipmentServiceItems).where(eq(equipmentServiceItems.equipmentId, id));
    await db.delete(equipment).where(eq(equipment.id, id));
  }
  // Equipment pricing
  async createEquipmentPricing(pricing) {
    const [result] = await db.insert(equipmentPricing).values(pricing).returning();
    return result;
  }
  async updateEquipmentPricing(id, pricing) {
    const [result] = await db.update(equipmentPricing).set(pricing).where(eq(equipmentPricing.id, id)).returning();
    return result;
  }
  async deleteEquipmentPricing(id) {
    await db.delete(equipmentPricing).where(eq(equipmentPricing.id, id));
  }
  // Equipment additional and accessories
  async getEquipmentAdditional(equipmentId) {
    return await db.select().from(equipmentAdditional).where(eq(equipmentAdditional.equipmentId, equipmentId)).orderBy(equipmentAdditional.type, equipmentAdditional.position);
  }
  async createEquipmentAdditional(additional) {
    const [result] = await db.insert(equipmentAdditional).values(additional).returning();
    return result;
  }
  async updateEquipmentAdditional(id, additional) {
    const [result] = await db.update(equipmentAdditional).set({ ...additional, updatedAt: /* @__PURE__ */ new Date() }).where(eq(equipmentAdditional.id, id)).returning();
    return result;
  }
  async deleteEquipmentAdditional(id) {
    await db.delete(equipmentAdditional).where(eq(equipmentAdditional.id, id));
  }
  // Clients
  async getClients() {
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  }
  async getClientById(id) {
    const [client2] = await db.select().from(clients).where(eq(clients.id, id));
    return client2;
  }
  async createClient(client2) {
    const [result] = await db.insert(clients).values(client2).returning();
    return result;
  }
  async updateClient(id, client2) {
    const [result] = await db.update(clients).set({ ...client2, updatedAt: /* @__PURE__ */ new Date() }).where(eq(clients.id, id)).returning();
    return result;
  }
  async deleteClient(id) {
    await db.delete(clients).where(eq(clients.id, id));
  }
  // Quotes
  async getQuotes() {
    const result = await db.select().from(quotes).leftJoin(clients, eq(quotes.clientId, clients.id)).leftJoin(users, eq(quotes.createdById, users.id)).leftJoin(quoteItems, eq(quotes.id, quoteItems.quoteId)).leftJoin(equipment, eq(quoteItems.equipmentId, equipment.id)).leftJoin(equipmentCategories, eq(equipment.categoryId, equipmentCategories.id)).orderBy(desc(quotes.createdAt));
    const quotesMap = /* @__PURE__ */ new Map();
    for (const row of result) {
      if (!quotesMap.has(row.quotes.id)) {
        quotesMap.set(row.quotes.id, {
          ...row.quotes,
          client: row.clients,
          createdBy: row.users,
          items: []
        });
      }
      if (row.quote_items && row.equipment && row.equipment_categories) {
        const quote = quotesMap.get(row.quotes.id);
        const existingItem = quote.items.find((item) => item.id === row.quote_items.id);
        if (!existingItem) {
          quote.items.push({
            ...row.quote_items,
            equipment: {
              ...row.equipment,
              category: row.equipment_categories,
              pricing: [],
              // Would need separate query for pricing
              additionalEquipment: [],
              serviceItems: []
            }
          });
        }
      }
    }
    return Array.from(quotesMap.values());
  }
  async getQuoteById(id) {
    const result = await db.select().from(quotes).leftJoin(clients, eq(quotes.clientId, clients.id)).leftJoin(users, eq(quotes.createdById, users.id)).leftJoin(quoteItems, eq(quotes.id, quoteItems.quoteId)).leftJoin(equipment, eq(quoteItems.equipmentId, equipment.id)).leftJoin(equipmentCategories, eq(equipment.categoryId, equipmentCategories.id)).where(eq(quotes.id, id));
    if (result.length === 0) return void 0;
    const quote = result[0].quotes;
    const client2 = result[0].clients;
    const createdBy = result[0].users;
    const itemsWithAdditional = await Promise.all(
      result.filter((row) => row.quote_items && row.equipment && row.equipment_categories).map(async (row) => {
        const additionalEquipment = await this.getEquipmentAdditional(row.equipment.id);
        return {
          ...row.quote_items,
          equipment: {
            ...row.equipment,
            category: row.equipment_categories,
            pricing: [],
            additionalEquipment,
            serviceItems: []
          }
        };
      })
    );
    return {
      ...quote,
      client: client2,
      createdBy,
      items: itemsWithAdditional
    };
  }
  async getQuotesByUser(userId) {
    const result = await db.select().from(quotes).leftJoin(clients, eq(quotes.clientId, clients.id)).leftJoin(users, eq(quotes.createdById, users.id)).leftJoin(quoteItems, eq(quotes.id, quoteItems.quoteId)).leftJoin(equipment, eq(quoteItems.equipmentId, equipment.id)).leftJoin(equipmentCategories, eq(equipment.categoryId, equipmentCategories.id)).where(eq(quotes.createdById, userId)).orderBy(desc(quotes.createdAt));
    const quotesMap = /* @__PURE__ */ new Map();
    for (const row of result) {
      if (!quotesMap.has(row.quotes.id)) {
        quotesMap.set(row.quotes.id, {
          ...row.quotes,
          client: row.clients,
          createdBy: row.users,
          items: []
        });
      }
      if (row.quote_items && row.equipment && row.equipment_categories) {
        const quote = quotesMap.get(row.quotes.id);
        const existingItem = quote.items.find((item) => item.id === row.quote_items.id);
        if (!existingItem) {
          quote.items.push({
            ...row.quote_items,
            equipment: {
              ...row.equipment,
              category: row.equipment_categories,
              pricing: [],
              additionalEquipment: [],
              serviceItems: []
            }
          });
        }
      }
    }
    return Array.from(quotesMap.values());
  }
  async createQuote(quote) {
    const [result] = await db.insert(quotes).values(quote).returning();
    return result;
  }
  async updateQuote(id, quote) {
    const [result] = await db.update(quotes).set({ ...quote, updatedAt: /* @__PURE__ */ new Date() }).where(eq(quotes.id, id)).returning();
    return result;
  }
  async deleteQuote(id) {
    await db.delete(quoteItems).where(eq(quoteItems.quoteId, id));
    await db.delete(quotes).where(eq(quotes.id, id));
  }
  // Quote items
  async createQuoteItem(item) {
    const [result] = await db.insert(quoteItems).values(item).returning();
    return result;
  }
  async updateQuoteItem(id, item) {
    const [result] = await db.update(quoteItems).set(item).where(eq(quoteItems.id, id)).returning();
    return result;
  }
  async deleteQuoteItem(id) {
    await db.delete(quoteItems).where(eq(quoteItems.id, id));
  }
  async getQuoteItems(quoteId) {
    return await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));
  }
  // Pricing schemas
  async getPricingSchemas() {
    const schemas = await db.select().from(pricingSchemas).orderBy(pricingSchemas.name);
    return schemas;
  }
  async getPricingSchemaById(id) {
    const [schema] = await db.select().from(pricingSchemas).where(eq(pricingSchemas.id, id));
    return schema;
  }
  async createPricingSchema(schemaData) {
    const [schema] = await db.insert(pricingSchemas).values(schemaData).returning();
    return schema;
  }
  async updatePricingSchema(id, schemaData) {
    const [schema] = await db.update(pricingSchemas).set({ ...schemaData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(pricingSchemas.id, id)).returning();
    return schema;
  }
  async deletePricingSchema(id) {
    await db.delete(pricingSchemas).where(eq(pricingSchemas.id, id));
  }
  // Equipment service costs methods
  async getEquipmentServiceCosts(equipmentId) {
    const [result] = await db.select().from(equipmentServiceCosts).where(eq(equipmentServiceCosts.equipmentId, equipmentId));
    return result;
  }
  async upsertEquipmentServiceCosts(serviceCosts) {
    const [result] = await db.insert(equipmentServiceCosts).values(serviceCosts).onConflictDoUpdate({
      target: equipmentServiceCosts.equipmentId,
      set: {
        serviceIntervalMonths: serviceCosts.serviceIntervalMonths,
        workerHours: serviceCosts.workerHours,
        workerCostPerHour: serviceCosts.workerCostPerHour,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return result;
  }
  // Equipment service items methods
  async getEquipmentServiceItems(equipmentId) {
    return await db.select().from(equipmentServiceItems).where(eq(equipmentServiceItems.equipmentId, equipmentId)).orderBy(equipmentServiceItems.sortOrder);
  }
  async createEquipmentServiceItem(serviceItem) {
    const [result] = await db.insert(equipmentServiceItems).values(serviceItem).returning();
    return result;
  }
  async updateEquipmentServiceItem(id, serviceItem) {
    const [result] = await db.update(equipmentServiceItems).set({ ...serviceItem, updatedAt: /* @__PURE__ */ new Date() }).where(eq(equipmentServiceItems.id, id)).returning();
    return result;
  }
  async deleteEquipmentServiceItem(id) {
    await db.delete(equipmentServiceItems).where(eq(equipmentServiceItems.id, id));
  }
};
var storage = new DatabaseStorage();

// server/replitAuth.ts
import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
if (!process.env.REPLIT_DOMAINS) {
  console.warn("Environment variable REPLIT_DOMAINS not provided - using localhost for development");
}
var getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID
    );
  },
  { maxAge: 3600 * 1e3 }
);
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl
    }
  });
}
function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}
async function upsertUser(claims) {
  const existingUser = await storage.getUser(claims["sub"]);
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    // New users need approval, existing users keep their approval status
    isApproved: existingUser?.isApproved ?? false
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  const config = await getOidcConfig();
  const verify = async (tokens, verified) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };
  const domains = process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(",") : ["localhost"];
  for (const domain of domains) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`
      },
      verify
    );
    passport.use(strategy);
  }
  passport.serializeUser((user, cb) => {
    if (user.claims) {
      cb(null, user);
    } else {
      cb(null, { type: "local", id: user.id });
    }
  });
  passport.deserializeUser(async (obj, cb) => {
    if (obj.type === "local") {
      const user = await storage.getUser(obj.id);
      cb(null, user);
    } else {
      cb(null, obj);
    }
  });
  app2.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"]
    })(req, res, next);
  });
  app2.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login"
    })(req, res, next);
  });
  app2.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`
        }).href
      );
    });
  });
}
var isAuthenticated = async (req, res, next) => {
  const user = req.user;
  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const now = Math.floor(Date.now() / 1e3);
  if (now <= user.expires_at) {
    return next();
  }
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// server/localAuth.ts
import passport2 from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupLocalAuth(app2) {
  passport2.use(
    "local-login",
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || user.authProvider !== "local" || !user.password) {
            return done(null, false, { message: "Invalid email or password" });
          }
          const isValid = await comparePasswords(password, user.password);
          if (!isValid) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required" });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      const hashedPassword = await hashPassword(password);
      const newUser = await storage.createLocalUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        authProvider: "local",
        isApproved: false
        // Requires admin approval
      });
      req.login(newUser, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          return res.status(500).json({ message: "Registration successful but login failed" });
        }
        res.status(201).json({
          message: "Registration successful. Your account is pending approval.",
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            isApproved: newUser.isApproved,
            authProvider: newUser.authProvider
          }
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });
  app2.post("/api/auth/login", (req, res, next) => {
    passport2.authenticate("local-login", (err, user, info) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: "Login failed" });
        }
        if (!user.isApproved) {
          return res.status(403).json({
            message: "Account pending approval",
            needsApproval: true,
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              isApproved: user.isApproved,
              authProvider: user.authProvider
            }
          });
        }
        res.json({
          message: "Login successful",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isApproved: user.isApproved,
            authProvider: user.authProvider
          }
        });
      });
    })(req, res, next);
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
}

// server/routes.ts
async function registerRoutes(app2) {
  await setupAuth(app2);
  setupLocalAuth(app2);
  const unifiedAuth = async (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };
  app2.get("/api/auth/user", unifiedAuth, async (req, res) => {
    try {
      let user;
      if (req.user.claims) {
        const userId = req.user.claims.sub;
        user = await storage.getUser(userId);
      } else {
        user = req.user;
      }
      if (user && !user.isApproved) {
        return res.status(403).json({
          message: "Account pending approval",
          needsApproval: true,
          user
          // Still return user data for display purposes
        });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/users", unifiedAuth, async (req, res) => {
    try {
      let currentUser;
      if (req.user.claims) {
        currentUser = await storage.getUser(req.user.claims.sub);
      } else {
        currentUser = req.user;
      }
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const users2 = await storage.getAllUsers();
      res.json(users2);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.put("/api/users/:id/role", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const { id } = req.params;
      const { role } = req.body;
      if (!["admin", "employee"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const updatedUser = await storage.updateUserRole(id, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
  app2.put("/api/users/:id/toggle-active", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== "admin") {
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
  app2.get("/api/users/pending", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const pendingUsers = await storage.getPendingUsers();
      res.json(pendingUsers);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });
  app2.post("/api/users/:id/approve", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== "admin") {
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
  app2.delete("/api/users/:id/reject", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== "admin") {
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
  app2.delete("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const { id } = req.params;
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
  app2.get("/api/equipment-categories", isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getEquipmentCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  app2.post("/api/equipment-categories", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
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
  app2.delete("/api/equipment-categories/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
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
  app2.get("/api/equipment/inactive", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      const equipment2 = await storage.getInactiveEquipment();
      res.json(equipment2);
    } catch (error) {
      console.error("Error fetching inactive equipment:", error);
      res.status(500).json({ message: "Failed to fetch inactive equipment" });
    }
  });
  app2.get("/api/equipment", isAuthenticated, async (req, res) => {
    try {
      const equipment2 = await storage.getEquipment();
      res.json(equipment2);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      res.status(500).json({ message: "Failed to fetch equipment" });
    }
  });
  app2.get("/api/equipment/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const equipment2 = await storage.getEquipmentById(id);
      if (!equipment2) {
        return res.status(404).json({ message: "Equipment not found" });
      }
      res.json(equipment2);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      res.status(500).json({ message: "Failed to fetch equipment" });
    }
  });
  app2.post("/api/equipment", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      const equipmentData = insertEquipmentSchema.parse(req.body);
      const equipment2 = await storage.createEquipment(equipmentData);
      res.json({
        ...equipment2,
        message: "Sprz\u0119t zosta\u0142 utworzony z domy\u015Blnymi cenami 100 z\u0142/dzie\u0144 (0% rabaty). Zaktualizuj ceny w sekcji 'Cenniki sprz\u0119tu'."
      });
    } catch (error) {
      console.error("Error creating equipment:", error);
      res.status(500).json({ message: "Failed to create equipment" });
    }
  });
  app2.put("/api/equipment/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      const id = parseInt(req.params.id);
      console.log("Update equipment request body:", req.body);
      const equipmentData = req.body.equipment || req.body;
      console.log("Equipment data for update:", equipmentData);
      const parsedData = insertEquipmentSchema.partial().parse(equipmentData);
      const equipment2 = await storage.updateEquipment(id, parsedData);
      res.json(equipment2);
    } catch (error) {
      console.error("Error updating equipment:", error);
      res.status(500).json({ message: "Failed to update equipment" });
    }
  });
  app2.patch("/api/equipment/:id/quantity", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      const id = parseInt(req.params.id);
      const { quantity, availableQuantity } = req.body;
      if (typeof quantity !== "number" || typeof availableQuantity !== "number") {
        return res.status(400).json({ message: "Quantity and availableQuantity must be numbers" });
      }
      if (availableQuantity > quantity) {
        return res.status(400).json({ message: "Available quantity cannot exceed total quantity" });
      }
      const equipment2 = await storage.updateEquipment(id, { quantity, availableQuantity });
      res.json(equipment2);
    } catch (error) {
      console.error("Error updating equipment quantity:", error);
      res.status(500).json({ message: "Failed to update equipment quantity" });
    }
  });
  app2.delete("/api/equipment/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
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
  app2.delete("/api/equipment/:id/permanent", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
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
  app2.post("/api/equipment-pricing", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
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
  app2.patch("/api/equipment-pricing/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
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
  app2.delete("/api/equipment-pricing/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
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
  app2.get("/api/equipment/:id/additional", isAuthenticated, async (req, res) => {
    try {
      const equipmentId = parseInt(req.params.id);
      let additional = await storage.getEquipmentAdditional(equipmentId);
      if (additional.length === 0) {
        await storage.createEquipmentAdditional({
          equipmentId,
          type: "additional",
          name: "Dodatkowe wyposa\u017Cenie 1",
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
  app2.post("/api/equipment-additional", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
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
  app2.patch("/api/equipment-additional/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
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
  app2.delete("/api/equipment-additional/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
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
  app2.get("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const clients2 = await storage.getClients();
      res.json(clients2);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });
  app2.post("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client2 = await storage.createClient(clientData);
      res.json(client2);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });
  app2.put("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientData = insertClientSchema.parse(req.body);
      const client2 = await storage.updateClient(id, clientData);
      res.json(client2);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });
  app2.get("/api/quotes", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin" && user?.role !== "employee") {
        return res.status(403).json({ message: "Access denied. Admin or employee role required." });
      }
      const quotes2 = await storage.getQuotes();
      res.json(quotes2);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });
  app2.get("/api/quotes/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin" && user?.role !== "employee") {
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
  app2.post("/api/quotes", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const quoteData = insertQuoteSchema.parse({
        ...req.body,
        createdById: userId,
        quoteNumber: `WYC-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(Date.now()).slice(-6)}`,
        isGuestQuote: false
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
  app2.post("/api/quotes/guest", async (req, res) => {
    try {
      const { guestEmail, clientData, items, ...quoteBody } = req.body;
      const client2 = await storage.createClient(clientData);
      const quoteData = insertQuoteSchema.parse({
        ...quoteBody,
        clientId: client2.id,
        isGuestQuote: true,
        guestEmail,
        createdById: null,
        quoteNumber: `GUE-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(Date.now()).slice(-6)}`
      });
      const quote = await storage.createQuote(quoteData);
      for (const item of items) {
        await storage.createQuoteItem({
          ...item,
          quoteId: quote.id
        });
      }
      res.json(quote);
    } catch (error) {
      console.error("Error creating guest quote:", error);
      res.status(500).json({ message: "Failed to create guest quote" });
    }
  });
  app2.put("/api/quotes/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin" && user?.role !== "employee") {
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
  app2.delete("/api/quotes/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
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
  app2.get("/api/quotes/:id/print", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.getQuoteById(id);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin" && user?.role !== "employee") {
        return res.status(403).json({ message: "Access denied. Admin or employee role required." });
      }
      console.log("Quote data for print:", {
        id: quote.id,
        itemsCount: quote.items?.length || 0,
        items: quote.items
      });
      const htmlContent = generateQuoteHTML(quote);
      res.setHeader("Content-Type", "text/html");
      res.send(htmlContent);
    } catch (error) {
      console.error("Error generating print view:", error);
      res.status(500).json({ message: "Failed to generate print view" });
    }
  });
  app2.post("/api/quote-items", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin" && user?.role !== "employee") {
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
  app2.put("/api/quote-items/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin" && user?.role !== "employee") {
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
  app2.delete("/api/quote-items/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin" && user?.role !== "employee") {
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
  app2.get("/api/pricing-schemas", isAuthenticated, async (req, res) => {
    try {
      const schemas = await storage.getPricingSchemas();
      res.json(schemas);
    } catch (error) {
      console.error("Error fetching pricing schemas:", error);
      res.status(500).json({ message: "Failed to fetch pricing schemas" });
    }
  });
  app2.get("/api/pricing-schemas/:id", isAuthenticated, async (req, res) => {
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
  app2.post("/api/pricing-schemas", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== "admin") {
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
  app2.patch("/api/pricing-schemas/:id", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== "admin") {
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
  app2.delete("/api/pricing-schemas/:id", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== "admin") {
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
  app2.get("/api/equipment/:id/service-costs", isAuthenticated, async (req, res) => {
    try {
      const equipmentId = parseInt(req.params.id);
      const serviceCosts = await storage.getEquipmentServiceCosts(equipmentId);
      res.json(serviceCosts || null);
    } catch (error) {
      console.error("Error fetching equipment service costs:", error);
      res.status(500).json({ message: "Failed to fetch equipment service costs" });
    }
  });
  app2.post("/api/equipment/:id/service-costs", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
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
  app2.get("/api/equipment/:id/service-items", isAuthenticated, async (req, res) => {
    try {
      const equipmentId = parseInt(req.params.id);
      const serviceItems = await storage.getEquipmentServiceItems(equipmentId);
      res.json(serviceItems);
    } catch (error) {
      console.error("Error fetching equipment service items:", error);
      res.status(500).json({ message: "Failed to fetch equipment service items" });
    }
  });
  app2.post("/api/equipment/:id/service-items", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
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
  app2.patch("/api/equipment-service-items/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
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
  app2.delete("/api/equipment-service-items/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
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
  const httpServer = createServer(app2);
  return httpServer;
}
function generateQuoteHTML(quote) {
  const formatCurrency = (amount) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN"
    }).format(numAmount);
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };
  const getRentalPeriodText = (days) => {
    if (days === 1) return "1 dzie\u0144";
    if (days < 5) return `${days} dni`;
    return `${days} dni`;
  };
  const itemsHTML = quote.items.map((item) => {
    const detailsRows = [];
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
    if (item.includeFuelCost) {
      detailsRows.push(`
        <tr>
          <td colspan="6" style="padding: 8px 15px; border-bottom: 1px solid #eee; background-color: #f8f9ff; font-size: 0.9em;">
            <strong>\u{1F6E2}\uFE0F Koszt paliwa:</strong> ${formatCurrency(item.totalFuelCost)}<br>
            \u2022 Zu\u017Cycie: ${item.fuelConsumptionLH} l/h<br>
            \u2022 Cena paliwa: ${formatCurrency(item.fuelPricePerLiter)}/l<br>
            \u2022 Godziny pracy dziennie: ${item.hoursPerDay} h<br>
            \u2022 Ca\u0142kowite zu\u017Cycie: ${(parseFloat(item.fuelConsumptionLH) * item.hoursPerDay * item.rentalPeriodDays).toFixed(1)} l
          </td>
        </tr>
      `);
    }
    if (item.includeTravelCost || item.totalTravelCost > 0) {
      detailsRows.push(`
        <tr>
          <td colspan="6" style="padding: 8px 15px; border-bottom: 1px solid #eee; background-color: #f0fff8; font-size: 0.9em;">
            <strong>\u{1F69A} Koszt dojazdu/monta\u017Cu:</strong> ${formatCurrency(item.totalTravelCost)}<br>
            \u2022 Dystans: ${item.travelDistanceKm} km<br>
            \u2022 Liczba technik\xF3w: ${item.numberOfTechnicians}<br>
            \u2022 Stawka za technika: ${formatCurrency(item.hourlyRatePerTechnician)}/h<br>
            \u2022 Stawka za km: ${formatCurrency(item.travelRatePerKm)}/km
          </td>
        </tr>
      `);
    }
    if (item.includeMaintenanceCost) {
      detailsRows.push(`
        <tr>
          <td colspan="6" style="padding: 8px 15px; border-bottom: 1px solid #eee; background-color: #fff8f0; font-size: 0.9em;">
            <strong>\u{1F527} Koszt eksploatacji:</strong> ${formatCurrency(item.totalMaintenanceCost)}<br>
            \u2022 Interwa\u0142 serwisowy: co ${item.maintenanceIntervalHours} mth<br>
            \u2022 Filtry paliwowe: ${formatCurrency(item.fuelFilter1Cost)} + ${formatCurrency(item.fuelFilter2Cost)}<br>
            \u2022 Filtr oleju: ${formatCurrency(item.oilFilterCost)}<br>
            \u2022 Filtry powietrza: ${formatCurrency(item.airFilter1Cost)} + ${formatCurrency(item.airFilter2Cost)}<br>
            \u2022 Filtr silnika: ${formatCurrency(item.engineFilterCost)}<br>
            \u2022 Olej: ${formatCurrency(item.oilCost)} (${item.oilQuantityLiters}l)<br>
            \u2022 Praca serwisowa: ${item.serviceWorkHours}h \xD7 ${formatCurrency(item.serviceWorkRatePerHour)}/h<br>
            \u2022 Dojazd serwisu: ${item.serviceTravelDistanceKm}km \xD7 ${formatCurrency(item.serviceTravelRatePerKm)}/km
          </td>
        </tr>
      `);
    }
    if (item.includeServiceItems && (parseFloat(item.serviceItem1Cost) > 0 || parseFloat(item.serviceItem2Cost) > 0 || parseFloat(item.serviceItem3Cost) > 0)) {
      detailsRows.push(`
        <tr>
          <td colspan="6" style="padding: 8px 15px; border-bottom: 1px solid #eee; background-color: #fff0f8; font-size: 0.9em;">
            <strong>\u{1F6E0}\uFE0F Koszty serwisowe:</strong> ${formatCurrency(item.totalServiceItemsCost)}<br>
            ${parseFloat(item.serviceItem1Cost) > 0 ? `\u2022 Przegl\u0105d serwisowy: ${formatCurrency(item.serviceItem1Cost)}<br>` : ""}
            ${parseFloat(item.serviceItem2Cost) > 0 ? `\u2022 Dojazd: ${formatCurrency(item.serviceItem2Cost)}<br>` : ""}
            ${parseFloat(item.serviceItem3Cost) > 0 ? `\u2022 Wymiana palnika: ${formatCurrency(item.serviceItem3Cost)}<br>` : ""}
          </td>
        </tr>
      `);
    }
    if (item.equipment.additionalEquipment && item.equipment.additionalEquipment.length > 0) {
      const additionalItems = item.equipment.additionalEquipment.filter((add) => add.type === "additional");
      const accessoryItems = item.equipment.additionalEquipment.filter((add) => add.type === "accessories");
      if (additionalItems.length > 0 || accessoryItems.length > 0) {
        let additionalHTML = "<strong>\u{1F527} Wyposa\u017Cenie dodatkowe i akcesoria:</strong><br>";
        if (additionalItems.length > 0) {
          additionalHTML += "<strong>Wyposa\u017Cenie dodatkowe:</strong><br>";
          additionalItems.forEach((add) => {
            additionalHTML += `\u2022 ${add.name} - ${formatCurrency(add.price)}<br>`;
          });
        }
        if (accessoryItems.length > 0) {
          additionalHTML += "<strong>Akcesoria:</strong><br>";
          accessoryItems.forEach((add) => {
            additionalHTML += `\u2022 ${add.name} - ${formatCurrency(add.price)}<br>`;
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
    if (item.notes) {
      detailsRows.push(`
        <tr>
          <td colspan="6" style="padding: 8px 15px; border-bottom: 1px solid #eee; background-color: #f5f5f5; font-size: 0.9em;">
            <strong>\u{1F4DD} Uwagi:</strong> ${item.notes}
          </td>
        </tr>
      `);
    }
    return detailsRows.join("");
  }).join("");
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
      <button class="print-button no-print" onclick="window.print()">\u{1F5A8}\uFE0F Drukuj</button>
      <div class="header">
        <div class="company-logo">Sebastian Popiel :: PPP :: Program</div>
        <div class="quote-title">Wycena sprz\u0119tu</div>
      </div>

      <div class="quote-info">
        <div>
          <h3>Dane klienta:</h3>
          <p><strong>${quote.client.companyName}</strong></p>
          ${quote.client.contactPerson ? `<p>Osoba kontaktowa: ${quote.client.contactPerson}</p>` : ""}
          ${quote.client.email ? `<p>Email: ${quote.client.email}</p>` : ""}
          ${quote.client.phone ? `<p>Telefon: ${quote.client.phone}</p>` : ""}
          ${quote.client.address ? `<p>Adres: ${quote.client.address}</p>` : ""}
          ${quote.client.nip ? `<p>NIP: ${quote.client.nip}</p>` : ""}
        </div>
        <div>
          <h3>Dane wyceny:</h3>
          <p><strong>Numer:</strong> ${quote.quoteNumber}</p>
          <p><strong>Data utworzenia:</strong> ${formatDate(quote.createdAt)}</p>
          <p><strong>Utworzy\u0142:</strong> ${quote.createdBy ? quote.createdBy.firstName && quote.createdBy.lastName ? `${quote.createdBy.firstName} ${quote.createdBy.lastName}` : quote.createdBy.email || "Nieznany u\u017Cytkownik" : "Wycena go\u015Bcinna"}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Nazwa sprz\u0119tu</th>
            <th>Ilo\u015B\u0107</th>
            <th>Okres wynajmu</th>
            <th>Cena za dzie\u0144</th>
            <th>Rabat</th>
            <th>Warto\u015B\u0107</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
          <tr class="total-row">
            <td colspan="5" style="text-align: right; padding: 15px;">Warto\u015B\u0107 netto:</td>
            <td style="text-align: right; padding: 15px;">${formatCurrency(quote.totalNet)}</td>
          </tr>
          <tr class="total-row">
            <td colspan="5" style="text-align: right; padding: 15px;">Warto\u015B\u0107 brutto (VAT 23%):</td>
            <td style="text-align: right; padding: 15px;">${formatCurrency(quote.totalGross)}</td>
          </tr>
        </tbody>
      </table>

      <div class="footer">
        <p>Wycena wygenerowana: ${formatDate((/* @__PURE__ */ new Date()).toISOString())}</p>
        <p>Sebastian Popiel :: PPP :: Program - Wynajem sprz\u0119tu</p>
      </div>
    </body>
    </html>
  `;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
