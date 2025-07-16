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
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("employee"), // admin, employee
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Equipment categories
export const equipmentCategories = pgTable("equipment_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Equipment items
export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  categoryId: integer("category_id").references(() => equipmentCategories.id).notNull(),
  description: text("description"),
  model: varchar("model"),
  power: varchar("power"), // e.g., "90.18 kW", "235 kW"
  // Additional technical specifications for generators
  fuelConsumption75: decimal("fuel_consumption_75", { precision: 6, scale: 2 }), // l/h at 75% load
  dimensions: varchar("dimensions"), // LxWxH in mm
  weight: varchar("weight"), // in kg
  engine: varchar("engine"), // engine manufacturer/model
  alternator: varchar("alternator"), // alternator info
  fuelTankCapacity: integer("fuel_tank_capacity"), // liters
  // Maintenance and filter costs
  oilFilterCost: decimal("oil_filter_cost", { precision: 8, scale: 2 }), // PLN per filter
  airFilterCost: decimal("air_filter_cost", { precision: 8, scale: 2 }), // PLN per filter
  fuelFilterCost: decimal("fuel_filter_cost", { precision: 8, scale: 2 }), // PLN per filter
  maintenanceIntervalHours: integer("maintenance_interval_hours").default(200), // service interval in hours
  quantity: integer("quantity").notNull().default(0),
  availableQuantity: integer("available_quantity").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pricing tiers for different rental periods
export const equipmentPricing = pgTable("equipment_pricing", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").references(() => equipment.id).notNull(),
  periodStart: integer("period_start").notNull(), // days
  periodEnd: integer("period_end"), // days, null for 30+
  pricePerDay: decimal("price_per_day", { precision: 10, scale: 2 }).notNull(),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Clients/Customers
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name").notNull(),
  nip: varchar("nip"),
  contactPerson: varchar("contact_person"),
  phone: varchar("phone"),
  email: varchar("email"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quotes
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  quoteNumber: varchar("quote_number").notNull().unique(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  createdById: varchar("created_by_id").references(() => users.id).notNull(),
  status: varchar("status").notNull().default("draft"), // draft, pending, approved, rejected
  totalNet: decimal("total_net", { precision: 12, scale: 2 }).notNull(),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).notNull().default("23"),
  totalGross: decimal("total_gross", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quote items
export const quoteItems = pgTable("quote_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").references(() => quotes.id).notNull(),
  equipmentId: integer("equipment_id").references(() => equipment.id).notNull(),
  quantity: integer("quantity").notNull(),
  rentalPeriodDays: integer("rental_period_days").notNull(),
  pricePerDay: decimal("price_per_day", { precision: 10, scale: 2 }).notNull(),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  // Fuel cost fields for generators
  fuelConsumptionLH: decimal("fuel_consumption_lh", { precision: 5, scale: 2 }), // liters per hour
  fuelPricePerLiter: decimal("fuel_price_per_liter", { precision: 6, scale: 2 }), // PLN per liter
  hoursPerDay: integer("hours_per_day").default(8), // operating hours per day
  totalFuelCost: decimal("total_fuel_cost", { precision: 12, scale: 2 }).default("0"),
  includeFuelCost: boolean("include_fuel_cost").default(false),
  // Maintenance cost fields for generators
  includeMaintenanceCost: boolean("include_maintenance_cost").default(false),
  maintenanceCostPerPeriod: decimal("maintenance_cost_per_period", { precision: 10, scale: 2 }).default("0"),
  expectedMaintenanceHours: integer("expected_maintenance_hours"), // expected operating hours for the rental period
  // Service travel cost fields
  includeTravelCost: boolean("include_travel_cost").default(false),
  travelDistanceKm: decimal("travel_distance_km", { precision: 8, scale: 2 }),
  numberOfTechnicians: integer("number_of_technicians").default(1),
  hourlyRatePerTechnician: decimal("hourly_rate_per_technician", { precision: 8, scale: 2 }).default("150"),
  travelRatePerKm: decimal("travel_rate_per_km", { precision: 6, scale: 2 }).default("1.15"),
  totalTravelCost: decimal("total_travel_cost", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const equipmentRelations = relations(equipment, ({ one, many }) => ({
  category: one(equipmentCategories, {
    fields: [equipment.categoryId],
    references: [equipmentCategories.id],
  }),
  pricing: many(equipmentPricing),
  quoteItems: many(quoteItems),
}));

export const equipmentCategoriesRelations = relations(equipmentCategories, ({ many }) => ({
  equipment: many(equipment),
}));

export const equipmentPricingRelations = relations(equipmentPricing, ({ one }) => ({
  equipment: one(equipment, {
    fields: [equipmentPricing.equipmentId],
    references: [equipment.id],
  }),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  quotes: many(quotes),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  client: one(clients, {
    fields: [quotes.clientId],
    references: [clients.id],
  }),
  createdBy: one(users, {
    fields: [quotes.createdById],
    references: [users.id],
  }),
  items: many(quoteItems),
}));

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteItems.quoteId],
    references: [quotes.id],
  }),
  equipment: one(equipment, {
    fields: [quoteItems.equipmentId],
    references: [equipment.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  quotes: many(quotes),
}));

// Insert and select schemas
export const insertUserSchema = createInsertSchema(users);
export const insertEquipmentCategorySchema = createInsertSchema(equipmentCategories);
export const insertEquipmentSchema = createInsertSchema(equipment);
export const insertEquipmentPricingSchema = createInsertSchema(equipmentPricing);
export const insertClientSchema = createInsertSchema(clients);
export const insertQuoteSchema = createInsertSchema(quotes);
export const insertQuoteItemSchema = createInsertSchema(quoteItems);

export const selectUserSchema = createSelectSchema(users);
export const selectEquipmentCategorySchema = createSelectSchema(equipmentCategories);
export const selectEquipmentSchema = createSelectSchema(equipment);
export const selectEquipmentPricingSchema = createSelectSchema(equipmentPricing);
export const selectClientSchema = createSelectSchema(clients);
export const selectQuoteSchema = createSelectSchema(quotes);
export const selectQuoteItemSchema = createSelectSchema(quoteItems);

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;
export type InsertEquipmentCategory = z.infer<typeof insertEquipmentCategorySchema>;
export type EquipmentCategory = z.infer<typeof selectEquipmentCategorySchema>;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type Equipment = z.infer<typeof selectEquipmentSchema>;
export type InsertEquipmentPricing = z.infer<typeof insertEquipmentPricingSchema>;
export type EquipmentPricing = z.infer<typeof selectEquipmentPricingSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = z.infer<typeof selectClientSchema>;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = z.infer<typeof selectQuoteSchema>;
export type InsertQuoteItem = z.infer<typeof insertQuoteItemSchema>;
export type QuoteItem = z.infer<typeof selectQuoteItemSchema>;

// Extended types for API responses
export type EquipmentWithCategory = Equipment & {
  category: EquipmentCategory;
  pricing: EquipmentPricing[];
};

export type QuoteWithDetails = Quote & {
  client: Client;
  createdBy: User;
  items: (QuoteItem & {
    equipment: EquipmentWithCategory;
  })[];
};
