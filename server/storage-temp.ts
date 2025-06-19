import { 
  users, type User, type InsertUser,
  tasks, type Task, type InsertTask,
  fields, type Field, type InsertField,
  inventory, type Inventory, type InsertInventory,
  weather, type Weather, type InsertWeather,
  fieldActivities, type FieldActivity, type InsertFieldActivity,
  inventoryTransactions, type InventoryTransaction, type InsertInventoryTransaction,
  companies, type Company, type InsertCompany,
  companyMembers, type CompanyMember, type InsertCompanyMember,
  invitationCodes, type InvitationCode, type InsertInvitationCode,
  productionRecords, type ProductionRecord, type InsertProductionRecord,
  economicRecords, type EconomicRecord, type InsertEconomicRecord,
  environmentalRecords, type EnvironmentalRecord, type InsertEnvironmentalRecord,
  operationalRecords, type OperationalRecord, type InsertOperationalRecord
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, lte, gte, like } from "drizzle-orm";
import session from "express-session";
import { Pool } from "@neondatabase/serverless";

const ConnectPgSimple = require("connect-pg-simple")(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  
  // Task operations
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, data: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  listTasks(filters?: Partial<Task>): Promise<Task[]>;
  
  // Field operations
  getField(id: number): Promise<Field | undefined>;
  createField(field: InsertField): Promise<Field>;
  updateField(id: number, data: Partial<Field>): Promise<Field | undefined>;
  deleteField(id: number): Promise<boolean>;
  listFields(filters?: Partial<Field>): Promise<Field[]>;
  
  // Inventory operations
  getInventoryItem(id: number): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: number, data: Partial<Inventory>): Promise<Inventory | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;
  listInventory(filters?: Partial<Inventory>): Promise<Inventory[]>;
  
  // Weather operations
  getWeather(id: number): Promise<Weather | undefined>;
  createWeather(weather: InsertWeather): Promise<Weather>;
  updateWeather(id: number, data: Partial<Weather>): Promise<Weather | undefined>;
  getLatestWeather(location: string): Promise<Weather | undefined>;
  
  // Field activity operations
  getFieldActivity(id: number): Promise<FieldActivity | undefined>;
  createFieldActivity(activity: InsertFieldActivity): Promise<FieldActivity>;
  updateFieldActivity(id: number, data: Partial<FieldActivity>): Promise<FieldActivity | undefined>;
  deleteFieldActivity(id: number): Promise<boolean>;
  listFieldActivities(fieldId?: number): Promise<FieldActivity[]>;
  
  // Inventory transaction operations
  getInventoryTransaction(id: number): Promise<InventoryTransaction | undefined>;
  createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction>;
  updateInventoryTransaction(id: number, data: Partial<InventoryTransaction>): Promise<InventoryTransaction | undefined>;
  deleteInventoryTransaction(id: number): Promise<boolean>;
  listInventoryTransactions(inventoryId?: number): Promise<InventoryTransaction[]>;
  
  // Company operations
  getCompany(id: number): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, data: Partial<Company>): Promise<Company | undefined>;
  listCompanies(): Promise<Company[]>;
  
  // Company member operations
  createCompanyMember(member: InsertCompanyMember): Promise<CompanyMember>;
  getCompanyMembers(companyId: number): Promise<CompanyMember[]>;
  getUserCompanies(userId: number): Promise<Company[]>;
  updateCompanyMember(id: number, data: Partial<CompanyMember>): Promise<CompanyMember | undefined>;
  
  // Invitation code operations
  createInvitationCode(invitation: InsertInvitationCode): Promise<InvitationCode>;
  getInvitationByCode(code: string): Promise<InvitationCode | undefined>;
  updateInvitationCode(id: number, data: Partial<InvitationCode>): Promise<InvitationCode | undefined>;
  listInvitationCodes(companyId: number): Promise<InvitationCode[]>;
  
  // Agricultural analytics operations
  getProductionRecord(id: number): Promise<ProductionRecord | undefined>;
  createProductionRecord(record: InsertProductionRecord): Promise<ProductionRecord>;
  updateProductionRecord(id: number, data: Partial<ProductionRecord>): Promise<ProductionRecord | undefined>;
  deleteProductionRecord(id: number): Promise<boolean>;
  listProductionRecords(filters?: Partial<ProductionRecord>): Promise<ProductionRecord[]>;
  
  getEconomicRecord(id: number): Promise<EconomicRecord | undefined>;
  createEconomicRecord(record: InsertEconomicRecord): Promise<EconomicRecord>;
  updateEconomicRecord(id: number, data: Partial<EconomicRecord>): Promise<EconomicRecord | undefined>;
  deleteEconomicRecord(id: number): Promise<boolean>;
  listEconomicRecords(filters?: Partial<EconomicRecord>): Promise<EconomicRecord[]>;
  
  getEnvironmentalRecord(id: number): Promise<EnvironmentalRecord | undefined>;
  createEnvironmentalRecord(record: InsertEnvironmentalRecord): Promise<EnvironmentalRecord>;
  updateEnvironmentalRecord(id: number, data: Partial<EnvironmentalRecord>): Promise<EnvironmentalRecord | undefined>;
  deleteEnvironmentalRecord(id: number): Promise<boolean>;
  listEnvironmentalRecords(filters?: Partial<EnvironmentalRecord>): Promise<EnvironmentalRecord[]>;
  
  getOperationalRecord(id: number): Promise<OperationalRecord | undefined>;
  createOperationalRecord(record: InsertOperationalRecord): Promise<OperationalRecord>;
  updateOperationalRecord(id: number, data: Partial<OperationalRecord>): Promise<OperationalRecord | undefined>;
  deleteOperationalRecord(id: number): Promise<boolean>;
  listOperationalRecords(filters?: Partial<OperationalRecord>): Promise<OperationalRecord[]>;

  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.sessionStore = new ConnectPgSimple({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true
    });
  }

  // Agricultural analytics implementations with simplified type handling
  async getProductionRecord(id: number): Promise<ProductionRecord | undefined> {
    const [record] = await db.select().from(productionRecords).where(eq(productionRecords.id, id));
    return record;
  }

  async createProductionRecord(record: InsertProductionRecord): Promise<ProductionRecord> {
    const [newRecord] = await db.insert(productionRecords).values(record as any).returning();
    return newRecord;
  }

  async updateProductionRecord(id: number, data: Partial<ProductionRecord>): Promise<ProductionRecord | undefined> {
    const [updated] = await db.update(productionRecords)
      .set(data as any)
      .where(eq(productionRecords.id, id))
      .returning();
    return updated;
  }

  async deleteProductionRecord(id: number): Promise<boolean> {
    const result = await db.delete(productionRecords).where(eq(productionRecords.id, id));
    return result.rowCount > 0;
  }

  async listProductionRecords(filters?: Partial<ProductionRecord>): Promise<ProductionRecord[]> {
    let query = db.select().from(productionRecords);
    if (filters?.companyId) {
      query = query.where(eq(productionRecords.companyId, filters.companyId));
    }
    return await query;
  }

  async getEconomicRecord(id: number): Promise<EconomicRecord | undefined> {
    const [record] = await db.select().from(economicRecords).where(eq(economicRecords.id, id));
    return record;
  }

  async createEconomicRecord(record: InsertEconomicRecord): Promise<EconomicRecord> {
    const [newRecord] = await db.insert(economicRecords).values(record as any).returning();
    return newRecord;
  }

  async updateEconomicRecord(id: number, data: Partial<EconomicRecord>): Promise<EconomicRecord | undefined> {
    const [updated] = await db.update(economicRecords)
      .set(data as any)
      .where(eq(economicRecords.id, id))
      .returning();
    return updated;
  }

  async deleteEconomicRecord(id: number): Promise<boolean> {
    const result = await db.delete(economicRecords).where(eq(economicRecords.id, id));
    return result.rowCount > 0;
  }

  async listEconomicRecords(filters?: Partial<EconomicRecord>): Promise<EconomicRecord[]> {
    let query = db.select().from(economicRecords);
    if (filters?.companyId) {
      query = query.where(eq(economicRecords.companyId, filters.companyId));
    }
    return await query;
  }

  async getEnvironmentalRecord(id: number): Promise<EnvironmentalRecord | undefined> {
    const [record] = await db.select().from(environmentalRecords).where(eq(environmentalRecords.id, id));
    return record;
  }

  async createEnvironmentalRecord(record: InsertEnvironmentalRecord): Promise<EnvironmentalRecord> {
    const [newRecord] = await db.insert(environmentalRecords).values(record as any).returning();
    return newRecord;
  }

  async updateEnvironmentalRecord(id: number, data: Partial<EnvironmentalRecord>): Promise<EnvironmentalRecord | undefined> {
    const [updated] = await db.update(environmentalRecords)
      .set(data as any)
      .where(eq(environmentalRecords.id, id))
      .returning();
    return updated;
  }

  async deleteEnvironmentalRecord(id: number): Promise<boolean> {
    const result = await db.delete(environmentalRecords).where(eq(environmentalRecords.id, id));
    return result.rowCount > 0;
  }

  async listEnvironmentalRecords(filters?: Partial<EnvironmentalRecord>): Promise<EnvironmentalRecord[]> {
    let query = db.select().from(environmentalRecords);
    if (filters?.companyId) {
      query = query.where(eq(environmentalRecords.companyId, filters.companyId));
    }
    return await query;
  }

  async getOperationalRecord(id: number): Promise<OperationalRecord | undefined> {
    const [record] = await db.select().from(operationalRecords).where(eq(operationalRecords.id, id));
    return record;
  }

  async createOperationalRecord(record: InsertOperationalRecord): Promise<OperationalRecord> {
    const [newRecord] = await db.insert(operationalRecords).values(record as any).returning();
    return newRecord;
  }

  async updateOperationalRecord(id: number, data: Partial<OperationalRecord>): Promise<OperationalRecord | undefined> {
    const [updated] = await db.update(operationalRecords)
      .set(data as any)
      .where(eq(operationalRecords.id, id))
      .returning();
    return updated;
  }

  async deleteOperationalRecord(id: number): Promise<boolean> {
    const result = await db.delete(operationalRecords).where(eq(operationalRecords.id, id));
    return result.rowCount > 0;
  }

  async listOperationalRecords(filters?: Partial<OperationalRecord>): Promise<OperationalRecord[]> {
    let query = db.select().from(operationalRecords);
    if (filters?.companyId) {
      query = query.where(eq(operationalRecords.companyId, filters.companyId));
    }
    return await query;
  }

  // Stub implementations for other methods (keeping existing functionality)
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user as any).returning();
    return newUser;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set(data as any)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task as any).returning();
    return newTask;
  }

  async updateTask(id: number, data: Partial<Task>): Promise<Task | undefined> {
    const [updated] = await db.update(tasks)
      .set(data as any)
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount > 0;
  }

  async listTasks(filters?: Partial<Task>): Promise<Task[]> {
    let query = db.select().from(tasks);
    if (filters?.companyId) {
      query = query.where(eq(tasks.companyId, filters.companyId));
    }
    return await query;
  }

  async getField(id: number): Promise<Field | undefined> {
    const [field] = await db.select().from(fields).where(eq(fields.id, id));
    return field;
  }

  async createField(field: InsertField): Promise<Field> {
    const [newField] = await db.insert(fields).values(field as any).returning();
    return newField;
  }

  async updateField(id: number, data: Partial<Field>): Promise<Field | undefined> {
    const [updated] = await db.update(fields)
      .set(data as any)
      .where(eq(fields.id, id))
      .returning();
    return updated;
  }

  async deleteField(id: number): Promise<boolean> {
    const result = await db.delete(fields).where(eq(fields.id, id));
    return result.rowCount > 0;
  }

  async listFields(filters?: Partial<Field>): Promise<Field[]> {
    let query = db.select().from(fields);
    if (filters?.companyId) {
      query = query.where(eq(fields.companyId, filters.companyId));
    }
    return await query;
  }

  async getInventoryItem(id: number): Promise<Inventory | undefined> {
    const [item] = await db.select().from(inventory).where(eq(inventory.id, id));
    return item;
  }

  async createInventoryItem(item: InsertInventory): Promise<Inventory> {
    const [newItem] = await db.insert(inventory).values(item as any).returning();
    return newItem;
  }

  async updateInventoryItem(id: number, data: Partial<Inventory>): Promise<Inventory | undefined> {
    const [updated] = await db.update(inventory)
      .set(data as any)
      .where(eq(inventory.id, id))
      .returning();
    return updated;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    const result = await db.delete(inventory).where(eq(inventory.id, id));
    return result.rowCount > 0;
  }

  async listInventory(filters?: Partial<Inventory>): Promise<Inventory[]> {
    let query = db.select().from(inventory);
    if (filters?.companyId) {
      query = query.where(eq(inventory.companyId, filters.companyId));
    }
    return await query;
  }

  async getWeather(id: number): Promise<Weather | undefined> {
    const [weather] = await db.select().from(weather).where(eq(weather.id, id));
    return weather;
  }

  async createWeather(weatherData: InsertWeather): Promise<Weather> {
    const [newWeather] = await db.insert(weather).values(weatherData as any).returning();
    return newWeather;
  }

  async updateWeather(id: number, data: Partial<Weather>): Promise<Weather | undefined> {
    const [updated] = await db.update(weather)
      .set(data as any)
      .where(eq(weather.id, id))
      .returning();
    return updated;
  }

  async getLatestWeather(location: string): Promise<Weather | undefined> {
    const [latest] = await db.select().from(weather)
      .where(eq(weather.location, location))
      .orderBy(desc(weather.timestamp))
      .limit(1);
    return latest;
  }

  async getFieldActivity(id: number): Promise<FieldActivity | undefined> {
    const [activity] = await db.select().from(fieldActivities).where(eq(fieldActivities.id, id));
    return activity;
  }

  async createFieldActivity(activity: InsertFieldActivity): Promise<FieldActivity> {
    const [newActivity] = await db.insert(fieldActivities).values(activity as any).returning();
    return newActivity;
  }

  async updateFieldActivity(id: number, data: Partial<FieldActivity>): Promise<FieldActivity | undefined> {
    const [updated] = await db.update(fieldActivities)
      .set(data as any)
      .where(eq(fieldActivities.id, id))
      .returning();
    return updated;
  }

  async deleteFieldActivity(id: number): Promise<boolean> {
    const result = await db.delete(fieldActivities).where(eq(fieldActivities.id, id));
    return result.rowCount > 0;
  }

  async listFieldActivities(fieldId?: number): Promise<FieldActivity[]> {
    let query = db.select().from(fieldActivities);
    if (fieldId) {
      query = query.where(eq(fieldActivities.fieldId, fieldId));
    }
    return await query;
  }

  async getInventoryTransaction(id: number): Promise<InventoryTransaction | undefined> {
    const [transaction] = await db.select().from(inventoryTransactions).where(eq(inventoryTransactions.id, id));
    return transaction;
  }

  async createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction> {
    const [newTransaction] = await db.insert(inventoryTransactions).values(transaction as any).returning();
    return newTransaction;
  }

  async updateInventoryTransaction(id: number, data: Partial<InventoryTransaction>): Promise<InventoryTransaction | undefined> {
    const [updated] = await db.update(inventoryTransactions)
      .set(data as any)
      .where(eq(inventoryTransactions.id, id))
      .returning();
    return updated;
  }

  async deleteInventoryTransaction(id: number): Promise<boolean> {
    const result = await db.delete(inventoryTransactions).where(eq(inventoryTransactions.id, id));
    return result.rowCount > 0;
  }

  async listInventoryTransactions(inventoryId?: number): Promise<InventoryTransaction[]> {
    let query = db.select().from(inventoryTransactions);
    if (inventoryId) {
      query = query.where(eq(inventoryTransactions.inventoryId, inventoryId));
    }
    return await query;
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company as any).returning();
    return newCompany;
  }

  async updateCompany(id: number, data: Partial<Company>): Promise<Company | undefined> {
    const [updated] = await db.update(companies)
      .set(data as any)
      .where(eq(companies.id, id))
      .returning();
    return updated;
  }

  async listCompanies(): Promise<Company[]> {
    return await db.select().from(companies);
  }

  async createCompanyMember(member: InsertCompanyMember): Promise<CompanyMember> {
    const [newMember] = await db.insert(companyMembers).values(member as any).returning();
    return newMember;
  }

  async getCompanyMembers(companyId: number): Promise<CompanyMember[]> {
    return await db.select().from(companyMembers).where(eq(companyMembers.companyId, companyId));
  }

  async getUserCompanies(userId: number): Promise<Company[]> {
    return await db.select().from(companies)
      .innerJoin(companyMembers, eq(companies.id, companyMembers.companyId))
      .where(eq(companyMembers.userId, userId))
      .then(rows => rows.map(row => row.companies));
  }

  async updateCompanyMember(id: number, data: Partial<CompanyMember>): Promise<CompanyMember | undefined> {
    const [updated] = await db.update(companyMembers)
      .set(data as any)
      .where(eq(companyMembers.id, id))
      .returning();
    return updated;
  }

  async createInvitationCode(invitation: InsertInvitationCode): Promise<InvitationCode> {
    const [newInvitation] = await db.insert(invitationCodes).values(invitation as any).returning();
    return newInvitation;
  }

  async getInvitationByCode(code: string): Promise<InvitationCode | undefined> {
    const [invitation] = await db.select().from(invitationCodes).where(eq(invitationCodes.code, code));
    return invitation;
  }

  async updateInvitationCode(id: number, data: Partial<InvitationCode>): Promise<InvitationCode | undefined> {
    const [updated] = await db.update(invitationCodes)
      .set(data as any)
      .where(eq(invitationCodes.id, id))
      .returning();
    return updated;
  }

  async listInvitationCodes(companyId: number): Promise<InvitationCode[]> {
    return await db.select().from(invitationCodes).where(eq(invitationCodes.companyId, companyId));
  }
}

export const storage = new DatabaseStorage();