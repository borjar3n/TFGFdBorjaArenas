import { pgTable, text, serial, integer, boolean, timestamp, foreignKey, jsonb, date, doublePrecision, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Definición de tipos para GeoJSON
export type GeoJSONCoordinate = [number, number];
export type GeoJSONPolygon = {
  type: "Polygon";
  coordinates: GeoJSONCoordinate[][];
};

// User Roles
export enum UserRole {
  SUPER_ADMIN = "super_admin",
  COMPANY_ADMIN = "company_admin", 
  WORKER = "worker",
  VIEWER = "viewer"
}

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").$type<UserRole>().notNull().default(UserRole.WORKER),
  currentCompanyId: integer("current_company_id"),
  lastLogin: timestamp("last_login"),
});

// Companies (Explotaciones agrícolas)
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow()
});

// Company Members (Relación usuario-empresa con permisos)
export const companyMembers = pgTable("company_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  companyId: integer("company_id").notNull(),
  role: text("role").$type<UserRole>().notNull().default(UserRole.WORKER),
  permissions: jsonb("permissions").$type<{
    fields: boolean;
    inventory: boolean;
    tasks: boolean;
    reports: boolean;
    weather: boolean;
    users: boolean;
  }>().notNull().default({
    fields: false,
    inventory: false,
    tasks: false,
    reports: false,
    weather: false,
    users: false
  }),
  joinedAt: timestamp("joined_at").defaultNow()
});

// Invitation Codes (Códigos de invitación)
export const invitationCodes = pgTable("invitation_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  companyId: integer("company_id").notNull(),
  createdBy: integer("created_by").notNull(),
  role: text("role").$type<UserRole>().notNull().default(UserRole.WORKER),
  permissions: jsonb("permissions").$type<{
    fields: boolean;
    inventory: boolean;
    tasks: boolean;
    reports: boolean;
    weather: boolean;
    users: boolean;
  }>().notNull(),
  maxUses: integer("max_uses").default(1),
  currentUses: integer("current_uses").default(0),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// Task Status
export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  DELAYED = "delayed",
  CANCELLED = "cancelled"
}

// Task Priority
export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent"
}

// Tasks schema
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").$type<TaskStatus>().notNull().default(TaskStatus.PENDING),
  priority: text("priority").$type<TaskPriority>().notNull().default(TaskPriority.MEDIUM),
  dueDate: timestamp("due_date"),
  assignedTo: integer("assigned_to").references(() => users.id),
  createdBy: integer("created_by").references(() => users.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
});

// Field Status
export enum FieldStatus {
  PREPARATION = "preparation",
  SEEDING = "seeding",
  GROWING = "growing",
  HARVESTING = "harvesting",
  FALLOW = "fallow"
}

// Fields schema
export const fields = pgTable("fields", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  area: integer("area").notNull(), // in square meters
  crop: text("crop"),
  status: text("status").$type<FieldStatus>().default(FieldStatus.PREPARATION),
  progress: integer("progress").default(0), // percentage of growth progress
  healthStatus: text("health_status").default("good"),
  notes: text("notes"),
  companyId: integer("company_id").notNull().references(() => companies.id),
  
  // Datos catastrales (opcionales)
  provincia: text("provincia"),
  municipio: text("municipio"),
  poligono: text("poligono"),
  parcela: text("parcela"),
  recinto: text("recinto"),
  referenciaCatastral: text("referencia_catastral"),
  
  // Datos geográficos para el centro de la parcela (opcionales)
  latitud: doublePrecision("latitud"),
  longitud: doublePrecision("longitud"),
  altitud: doublePrecision("altitud"),
  
  // GeoJSON para representar el polígono de la parcela (opcional)
  geometria: json("geometria").$type<GeoJSONPolygon | null>(),
});

// Inventory Item Types
export enum InventoryType {
  SEED = "seed",
  FERTILIZER = "fertilizer",
  PESTICIDE = "pesticide",
  EQUIPMENT = "equipment",
  OTHER = "other"
}

// Inventory schema
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").$type<InventoryType>().notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull(),
  minQuantity: integer("min_quantity").default(0),
  notes: text("notes"),
  companyId: integer("company_id").notNull().references(() => companies.id),
});

// Weather data
export const weather = pgTable("weather", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  temperature: integer("temperature"), // in Celsius
  conditions: text("conditions"),
  forecast: jsonb("forecast"), // array of forecast data
  companyId: integer("company_id").notNull().references(() => companies.id),
});

// Field activity types
export enum ActivityType {
  PLANTING = "planting",
  IRRIGATION = "irrigation",
  FERTILIZATION = "fertilization",
  PEST_CONTROL = "pest_control",
  HARVESTING = "harvesting",
  MAINTENANCE = "maintenance",
  OTHER = "other"
}

// Field activities schema
export const fieldActivities = pgTable("field_activities", {
  id: serial("id").primaryKey(),
  fieldId: integer("field_id").notNull().references(() => fields.id),
  type: text("type").$type<ActivityType>().notNull(),
  date: timestamp("date").notNull(),
  description: text("description"),
  performedBy: integer("performed_by").references(() => users.id),
  notes: text("notes"),
  companyId: integer("company_id").notNull().references(() => companies.id),
});

// Inventory transactions
export enum TransactionType {
  PURCHASE = "purchase",
  USAGE = "usage",
  ADJUSTMENT = "adjustment",
  TRANSFER = "transfer"
}

// Inventory transactions schema
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: serial("id").primaryKey(),
  inventoryId: integer("inventory_id").notNull().references(() => inventory.id),
  type: text("type").$type<TransactionType>().notNull(),
  quantity: integer("quantity").notNull(),
  date: timestamp("date").notNull(),
  notes: text("notes"),
  performedBy: integer("performed_by").references(() => users.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
});

// Define relations between tables
export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks, { relationName: "user_tasks" }),
  assignedTasks: many(tasks, { relationName: "user_assigned_tasks" }),
  fieldActivities: many(fieldActivities, { relationName: "user_field_activities" }),
  inventoryTransactions: many(inventoryTransactions, { relationName: "user_inventory_transactions" }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignedUser: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
    relationName: "user_assigned_tasks"
  }),
  createdByUser: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
    relationName: "user_tasks"
  }),
}));

export const fieldsRelations = relations(fields, ({ many }) => ({
  activities: many(fieldActivities, { relationName: "field_activities" }),
}));

export const fieldActivitiesRelations = relations(fieldActivities, ({ one }) => ({
  field: one(fields, {
    fields: [fieldActivities.fieldId],
    references: [fields.id],
    relationName: "field_activities"
  }),
  user: one(users, {
    fields: [fieldActivities.performedBy],
    references: [users.id],
    relationName: "user_field_activities"
  }),
}));

export const inventoryRelations = relations(inventory, ({ many }) => ({
  transactions: many(inventoryTransactions, { relationName: "inventory_transactions" }),
}));

export const inventoryTransactionsRelations = relations(inventoryTransactions, ({ one }) => ({
  inventoryItem: one(inventory, {
    fields: [inventoryTransactions.inventoryId],
    references: [inventory.id],
    relationName: "inventory_transactions"
  }),
  user: one(users, {
    fields: [inventoryTransactions.performedBy],
    references: [users.id],
    relationName: "user_inventory_transactions"
  }),
}));

// Create insert schemas using drizzle-zod
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  lastLogin: true,
});

export const insertTaskSchema = createInsertSchema(tasks)
  .omit({
    id: true,
  })
  // Personaliza la validación de dueDate para permitir string y convertirlo a Date
  .extend({
    dueDate: z.union([
      z.date().nullable(),
      z.string().transform((str) => new Date(str)).nullable(),
      z.null()
    ])
  });

export const insertFieldSchema = createInsertSchema(fields).omit({
  id: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
});

export const insertWeatherSchema = createInsertSchema(weather).omit({
  id: true,
});

export const insertFieldActivitySchema = createInsertSchema(fieldActivities)
  .omit({
    id: true,
  })
  // Personaliza la validación de date para permitir string y convertirlo a Date
  .extend({
    date: z.union([
      z.date(),
      z.string().transform((str) => new Date(str))
    ])
  });

export const insertInventoryTransactionSchema = createInsertSchema(inventoryTransactions)
  .omit({
    id: true,
  })
  // Personaliza la validación de date para permitir string y convertirlo a Date
  .extend({
    date: z.union([
      z.date(),
      z.string().transform((str) => new Date(str))
    ])
  });

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
});

export const insertCompanyMemberSchema = createInsertSchema(companyMembers).omit({
  id: true,
});

export const insertInvitationCodeSchema = createInsertSchema(invitationCodes).omit({
  id: true,
  createdAt: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertField = z.infer<typeof insertFieldSchema>;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type InsertWeather = z.infer<typeof insertWeatherSchema>;
export type InsertFieldActivity = z.infer<typeof insertFieldActivitySchema>;
export type InsertInventoryTransaction = z.infer<typeof insertInventoryTransactionSchema>;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertCompanyMember = z.infer<typeof insertCompanyMemberSchema>;
export type InsertInvitationCode = z.infer<typeof insertInvitationCodeSchema>;

export type User = typeof users.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Field = typeof fields.$inferSelect;
export type Inventory = typeof inventory.$inferSelect;
export type Weather = typeof weather.$inferSelect;
export type FieldActivity = typeof fieldActivities.$inferSelect;
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type CompanyMember = typeof companyMembers.$inferSelect;
export type InvitationCode = typeof invitationCodes.$inferSelect;

// === AGRICULTURAL STATISTICS TABLES ===

// Production Data
export const productionRecords = pgTable("production_records", {
  id: serial("id").primaryKey(),
  fieldId: integer("field_id").references(() => fields.id).notNull(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  crop: text("crop").notNull(),
  season: text("season").notNull(),
  harvestDate: timestamp("harvest_date"),
  quantityHarvested: doublePrecision("quantity_harvested").notNull(),
  quality: text("quality").default("standard"),
  pricePerUnit: doublePrecision("price_per_unit"),
  totalRevenue: doublePrecision("total_revenue"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Economic Data
export const economicRecords = pgTable("economic_records", {
  id: serial("id").primaryKey(),
  fieldId: integer("field_id").references(() => fields.id),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: doublePrecision("amount").notNull(),
  date: timestamp("date").notNull(),
  season: text("season"),
  paymentMethod: text("payment_method"),
  supplier: text("supplier"),
  invoiceNumber: text("invoice_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Environmental Data
export const environmentalRecords = pgTable("environmental_records", {
  id: serial("id").primaryKey(),
  fieldId: integer("field_id").references(() => fields.id),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  recordDate: timestamp("record_date").notNull(),
  soilPh: doublePrecision("soil_ph"),
  soilMoisture: doublePrecision("soil_moisture"),
  soilTemperature: doublePrecision("soil_temperature"),
  ambientTemperature: doublePrecision("ambient_temperature"),
  humidity: doublePrecision("humidity"),
  rainfall: doublePrecision("rainfall"),
  windSpeed: doublePrecision("wind_speed"),
  solarRadiation: doublePrecision("solar_radiation"),
  pestUsage: doublePrecision("pest_usage"),
  fertilizerUsage: doublePrecision("fertilizer_usage"),
  waterUsage: doublePrecision("water_usage"),
  carbonFootprint: doublePrecision("carbon_footprint"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Operational Efficiency Data
export const operationalRecords = pgTable("operational_records", {
  id: serial("id").primaryKey(),
  fieldId: integer("field_id").references(() => fields.id),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  recordDate: timestamp("record_date").notNull(),
  operation: text("operation").notNull(),
  machineryUsed: text("machinery_used"),
  laborHours: doublePrecision("labor_hours"),
  fuelConsumption: doublePrecision("fuel_consumption"),
  areaWorked: doublePrecision("area_worked"),
  efficiency: doublePrecision("efficiency"),
  qualityScore: integer("quality_score"),
  weatherConditions: text("weather_conditions"),
  operatorName: text("operator_name"),
  maintenanceCost: doublePrecision("maintenance_cost"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations for new tables
export const productionRecordsRelations = relations(productionRecords, ({ one }) => ({
  field: one(fields, { fields: [productionRecords.fieldId], references: [fields.id] }),
  company: one(companies, { fields: [productionRecords.companyId], references: [companies.id] }),
}));

export const economicRecordsRelations = relations(economicRecords, ({ one }) => ({
  field: one(fields, { fields: [economicRecords.fieldId], references: [fields.id] }),
  company: one(companies, { fields: [economicRecords.companyId], references: [companies.id] }),
}));

export const environmentalRecordsRelations = relations(environmentalRecords, ({ one }) => ({
  field: one(fields, { fields: [environmentalRecords.fieldId], references: [fields.id] }),
  company: one(companies, { fields: [environmentalRecords.companyId], references: [companies.id] }),
}));

export const operationalRecordsRelations = relations(operationalRecords, ({ one }) => ({
  field: one(fields, { fields: [operationalRecords.fieldId], references: [fields.id] }),
  company: one(companies, { fields: [operationalRecords.companyId], references: [companies.id] }),
}));

// Insert schemas for new tables
export const insertProductionRecordSchema = createInsertSchema(productionRecords).omit({
  id: true,
  createdAt: true,
});

export const insertEconomicRecordSchema = createInsertSchema(economicRecords).omit({
  id: true,
  createdAt: true,
});

export const insertEnvironmentalRecordSchema = createInsertSchema(environmentalRecords).omit({
  id: true,
  createdAt: true,
});

export const insertOperationalRecordSchema = createInsertSchema(operationalRecords).omit({
  id: true,
  createdAt: true,
});

// Types for new tables
export type ProductionRecord = typeof productionRecords.$inferSelect;
export type EconomicRecord = typeof economicRecords.$inferSelect;
export type EnvironmentalRecord = typeof environmentalRecords.$inferSelect;
export type OperationalRecord = typeof operationalRecords.$inferSelect;

export type InsertProductionRecord = z.infer<typeof insertProductionRecordSchema>;
export type InsertEconomicRecord = z.infer<typeof insertEconomicRecordSchema>;
export type InsertEnvironmentalRecord = z.infer<typeof insertEnvironmentalRecordSchema>;
export type InsertOperationalRecord = z.infer<typeof insertOperationalRecordSchema>;
