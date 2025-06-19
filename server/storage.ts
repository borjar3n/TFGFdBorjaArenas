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
  operationalRecords, type OperationalRecord, type InsertOperationalRecord,
  TaskStatus, TaskPriority, FieldStatus, InventoryType, ActivityType, TransactionType, UserRole
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, lte, gte, like } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

// Interface for storage operations
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

// Database implementation of the storage interface
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values([{
      ...user,
      role: user.role as any
    }]).returning();
    return newUser;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }
  
  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }
  
  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values([{
      ...task,
      status: task.status as TaskStatus,
      priority: task.priority as TaskPriority,
    }]).returning();
    return newTask;
  }
  
  async updateTask(id: number, data: Partial<Task>): Promise<Task | undefined> {
    const [updated] = await db.update(tasks)
      .set(data)
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }
  
  async listTasks(filters?: Partial<Task>): Promise<Task[]> {
    if (!filters) {
      return db.select().from(tasks);
    }
    
    const conditions = [];
    
    if (filters.id !== undefined) {
      conditions.push(eq(tasks.id, filters.id));
    }
    
    if (filters.status !== undefined) {
      conditions.push(eq(tasks.status, filters.status));
    }
    
    if (filters.priority !== undefined) {
      conditions.push(eq(tasks.priority, filters.priority));
    }
    
    if (filters.assignedTo !== undefined) {
      conditions.push(eq(tasks.assignedTo, filters.assignedTo));
    }
    
    if (filters.createdBy !== undefined) {
      conditions.push(eq(tasks.createdBy, filters.createdBy));
    }
    
    if (filters.companyId !== undefined) {
      conditions.push(eq(tasks.companyId, filters.companyId));
    }
    
    if (conditions.length === 0) {
      return db.select().from(tasks);
    }
    
    return db.select().from(tasks).where(and(...conditions));
  }
  
  // Field operations
  async getField(id: number): Promise<Field | undefined> {
    const [field] = await db.select().from(fields).where(eq(fields.id, id));
    return field;
  }
  
  async createField(field: InsertField): Promise<Field> {
    const [newField] = await db.insert(fields).values([{
      ...field,
      status: field.status as FieldStatus,
    }]).returning();
    return newField;
  }
  
  async updateField(id: number, data: Partial<Field>): Promise<Field | undefined> {
    const [updated] = await db.update(fields)
      .set(data)
      .where(eq(fields.id, id))
      .returning();
    return updated;
  }
  
  async deleteField(id: number): Promise<boolean> {
    const result = await db.delete(fields).where(eq(fields.id, id)).returning();
    return result.length > 0;
  }
  
  async listFields(filters?: Partial<Field>): Promise<Field[]> {
    if (!filters) {
      return db.select().from(fields);
    }
    
    const conditions = [];
    
    if (filters.id !== undefined) {
      conditions.push(eq(fields.id, filters.id));
    }
    
    if (filters.status !== undefined) {
      conditions.push(eq(fields.status, filters.status));
    }
    
    if (filters.crop !== undefined) {
      conditions.push(like(fields.crop || '', `%${filters.crop}%`));
    }
    
    if (filters.companyId !== undefined) {
      conditions.push(eq(fields.companyId, filters.companyId));
    }
    
    if (conditions.length === 0) {
      return db.select().from(fields);
    }
    
    return db.select().from(fields).where(and(...conditions));
  }
  
  // Inventory operations
  async getInventoryItem(id: number): Promise<Inventory | undefined> {
    const [item] = await db.select().from(inventory).where(eq(inventory.id, id));
    return item;
  }
  
  async createInventoryItem(item: InsertInventory): Promise<Inventory> {
    const [newItem] = await db.insert(inventory).values([{
      ...item,
      type: item.type as InventoryType,
    }]).returning();
    return newItem;
  }
  
  async updateInventoryItem(id: number, data: Partial<Inventory>): Promise<Inventory | undefined> {
    const [updated] = await db.update(inventory)
      .set(data)
      .where(eq(inventory.id, id))
      .returning();
    return updated;
  }
  
  async deleteInventoryItem(id: number): Promise<boolean> {
    const result = await db.delete(inventory).where(eq(inventory.id, id)).returning();
    return result.length > 0;
  }
  
  async listInventory(filters?: Partial<Inventory>): Promise<Inventory[]> {
    if (!filters) {
      return db.select().from(inventory);
    }
    
    const conditions = [];
    
    if (filters.id !== undefined) {
      conditions.push(eq(inventory.id, filters.id));
    }
    
    if (filters.type !== undefined) {
      conditions.push(eq(inventory.type, filters.type));
    }
    
    if (filters.companyId !== undefined) {
      conditions.push(eq(inventory.companyId, filters.companyId));
    }
    
    if (conditions.length === 0) {
      return db.select().from(inventory);
    }
    
    return db.select().from(inventory).where(and(...conditions));
  }
  
  // Weather operations
  async getWeather(id: number): Promise<Weather | undefined> {
    const [weatherData] = await db.select().from(weather).where(eq(weather.id, id));
    return weatherData;
  }
  
  async createWeather(weatherData: InsertWeather): Promise<Weather> {
    const [newWeather] = await db.insert(weather).values([weatherData]).returning();
    return newWeather;
  }
  
  async updateWeather(id: number, data: Partial<Weather>): Promise<Weather | undefined> {
    const [updated] = await db.update(weather)
      .set(data)
      .where(eq(weather.id, id))
      .returning();
    return updated;
  }
  
  async getLatestWeather(location: string): Promise<Weather | undefined> {
    const [latest] = await db.select()
      .from(weather)
      .where(eq(weather.location, location))
      .orderBy(desc(weather.date))
      .limit(1);
    
    return latest;
  }
  
  // Field activity operations
  async getFieldActivity(id: number): Promise<FieldActivity | undefined> {
    const [activity] = await db.select().from(fieldActivities).where(eq(fieldActivities.id, id));
    return activity;
  }
  
  async createFieldActivity(activity: InsertFieldActivity): Promise<FieldActivity> {
    const [newActivity] = await db.insert(fieldActivities).values([{
      ...activity,
      type: activity.type as ActivityType,
    }]).returning();
    return newActivity;
  }
  
  async updateFieldActivity(id: number, data: Partial<FieldActivity>): Promise<FieldActivity | undefined> {
    const [updated] = await db.update(fieldActivities)
      .set(data)
      .where(eq(fieldActivities.id, id))
      .returning();
    return updated;
  }
  
  async deleteFieldActivity(id: number): Promise<boolean> {
    const result = await db.delete(fieldActivities).where(eq(fieldActivities.id, id)).returning();
    return result.length > 0;
  }
  
  async listFieldActivities(fieldId?: number): Promise<FieldActivity[]> {
    if (fieldId) {
      return await db.select()
        .from(fieldActivities)
        .where(eq(fieldActivities.fieldId, fieldId))
        .orderBy(desc(fieldActivities.date));
    }
    
    return await db.select().from(fieldActivities).orderBy(desc(fieldActivities.date));
  }
  
  // Inventory transaction operations
  async getInventoryTransaction(id: number): Promise<InventoryTransaction | undefined> {
    const [transaction] = await db.select().from(inventoryTransactions).where(eq(inventoryTransactions.id, id));
    return transaction;
  }
  
  async createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction> {
    const [newTransaction] = await db.insert(inventoryTransactions).values([transaction]).returning();
    
    // Update the inventory item quantity based on the transaction
    const [inventoryItem] = await db.select().from(inventory).where(eq(inventory.id, transaction.inventoryId));
    
    if (inventoryItem) {
      let newQuantity = inventoryItem.quantity;
      
      if (transaction.type === 'purchase') {
        newQuantity += transaction.quantity;
      } else if (transaction.type === 'usage') {
        newQuantity -= transaction.quantity;
      } else if (transaction.type === 'adjustment') {
        newQuantity = transaction.quantity; // Direct adjustment
      }
      
      // Ensure quantity doesn't go below zero
      newQuantity = Math.max(0, newQuantity);
      
      await db.update(inventory)
        .set({ quantity: newQuantity })
        .where(eq(inventory.id, transaction.inventoryId));
    }
    
    return newTransaction;
  }
  
  async updateInventoryTransaction(id: number, data: Partial<InventoryTransaction>): Promise<InventoryTransaction | undefined> {
    // For simplicity, we're not adjusting inventory quantities when updating transactions
    // In a real system, this would need careful handling
    const [updated] = await db.update(inventoryTransactions)
      .set(data)
      .where(eq(inventoryTransactions.id, id))
      .returning();
    return updated;
  }
  
  async deleteInventoryTransaction(id: number): Promise<boolean> {
    // For simplicity, we're not adjusting inventory quantities when deleting transactions
    // In a real system, this would need careful handling
    const result = await db.delete(inventoryTransactions).where(eq(inventoryTransactions.id, id)).returning();
    return result.length > 0;
  }
  
  async listInventoryTransactions(inventoryId?: number): Promise<InventoryTransaction[]> {
    if (inventoryId) {
      return await db.select()
        .from(inventoryTransactions)
        .where(eq(inventoryTransactions.inventoryId, inventoryId))
        .orderBy(desc(inventoryTransactions.date));
    }
    
    return await db.select().from(inventoryTransactions).orderBy(desc(inventoryTransactions.date));
  }

  // Company operations
  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values([company]).returning();
    return newCompany;
  }

  async updateCompany(id: number, data: Partial<Company>): Promise<Company | undefined> {
    const [updated] = await db.update(companies)
      .set(data)
      .where(eq(companies.id, id))
      .returning();
    return updated;
  }

  async listCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(companies.name);
  }

  // Company member operations
  async createCompanyMember(member: InsertCompanyMember): Promise<CompanyMember> {
    const [newMember] = await db.insert(companyMembers).values([member]).returning();
    return newMember;
  }

  async getCompanyMembers(companyId: number): Promise<CompanyMember[]> {
    return await db.select().from(companyMembers)
      .where(eq(companyMembers.companyId, companyId))
      .orderBy(companyMembers.joinedAt);
  }

  async getUserCompanies(userId: number): Promise<Company[]> {
    const userMemberships = await db.select().from(companyMembers)
      .where(eq(companyMembers.userId, userId));
    
    const companiesResults = [];
    for (const membership of userMemberships) {
      const [company] = await db.select().from(companies)
        .where(eq(companies.id, membership.companyId));
      if (company) {
        companiesResults.push(company);
      }
    }
    
    return companiesResults;
  }

  async updateCompanyMember(id: number, data: Partial<CompanyMember>): Promise<CompanyMember | undefined> {
    const [updated] = await db.update(companyMembers)
      .set(data)
      .where(eq(companyMembers.id, id))
      .returning();
    return updated;
  }

  // Invitation code operations
  async createInvitationCode(invitation: InsertInvitationCode): Promise<InvitationCode> {
    const [newInvitation] = await db.insert(invitationCodes).values([invitation]).returning();
    return newInvitation;
  }

  async getInvitationByCode(code: string): Promise<InvitationCode | undefined> {
    const [invitation] = await db.select().from(invitationCodes)
      .where(eq(invitationCodes.code, code));
    return invitation;
  }

  async updateInvitationCode(id: number, data: Partial<InvitationCode>): Promise<InvitationCode | undefined> {
    // Increment current_uses for the invitation code
    if (data.currentUses !== undefined) {
      const [updated] = await db.execute(`
        UPDATE invitation_codes 
        SET current_uses = $1 
        WHERE id = $2 
        RETURNING *
      `, [data.currentUses, id]);
      
      return updated.rows[0] as InvitationCode;
    }
    
    return undefined;
  }

  async listInvitationCodes(companyId: number): Promise<InvitationCode[]> {
    return await db.select().from(invitationCodes)
      .where(eq(invitationCodes.companyId, companyId))
      .orderBy(desc(invitationCodes.createdAt));
  }

  // Agricultural analytics operations
  async getProductionRecord(id: number): Promise<ProductionRecord | undefined> {
    const [record] = await db.select().from(productionRecords).where(eq(productionRecords.id, id));
    return record;
  }

  async createProductionRecord(record: InsertProductionRecord): Promise<ProductionRecord> {
    const [newRecord] = await db.insert(productionRecords).values(record as any).returning();
    return newRecord;
  }

  async updateProductionRecord(id: number, data: Partial<ProductionRecord>): Promise<ProductionRecord | undefined> {
    const [updatedRecord] = await db.update(productionRecords)
      .set(data)
      .where(eq(productionRecords.id, id))
      .returning();
    return updatedRecord;
  }

  async deleteProductionRecord(id: number): Promise<boolean> {
    const result = await db.delete(productionRecords).where(eq(productionRecords.id, id)).returning();
    return result.length > 0;
  }

  async listProductionRecords(filters?: Partial<ProductionRecord>): Promise<ProductionRecord[]> {
    let query = db.select().from(productionRecords);
    
    if (filters?.companyId) {
      query = query.where(eq(productionRecords.companyId, filters.companyId));
    }
    if (filters?.fieldId) {
      query = query.where(eq(productionRecords.fieldId, filters.fieldId));
    }
    
    return await query.orderBy(desc(productionRecords.createdAt));
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
    const [updatedRecord] = await db.update(economicRecords)
      .set(data)
      .where(eq(economicRecords.id, id))
      .returning();
    return updatedRecord;
  }

  async deleteEconomicRecord(id: number): Promise<boolean> {
    const result = await db.delete(economicRecords).where(eq(economicRecords.id, id)).returning();
    return result.length > 0;
  }

  async listEconomicRecords(filters?: Partial<EconomicRecord>): Promise<EconomicRecord[]> {
    let query = db.select().from(economicRecords);
    
    if (filters?.companyId) {
      query = query.where(eq(economicRecords.companyId, filters.companyId));
    }
    if (filters?.fieldId) {
      query = query.where(eq(economicRecords.fieldId, filters.fieldId));
    }
    if (filters?.type) {
      query = query.where(eq(economicRecords.type, filters.type));
    }
    
    return await query.orderBy(desc(economicRecords.createdAt));
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
    const [updatedRecord] = await db.update(environmentalRecords)
      .set(data)
      .where(eq(environmentalRecords.id, id))
      .returning();
    return updatedRecord;
  }

  async deleteEnvironmentalRecord(id: number): Promise<boolean> {
    const result = await db.delete(environmentalRecords).where(eq(environmentalRecords.id, id)).returning();
    return result.length > 0;
  }

  async listEnvironmentalRecords(filters?: Partial<EnvironmentalRecord>): Promise<EnvironmentalRecord[]> {
    let query = db.select().from(environmentalRecords);
    
    if (filters?.companyId) {
      query = query.where(eq(environmentalRecords.companyId, filters.companyId));
    }
    if (filters?.fieldId) {
      query = query.where(eq(environmentalRecords.fieldId, filters.fieldId));
    }
    
    return await query.orderBy(desc(environmentalRecords.createdAt));
  }

  async getOperationalRecord(id: number): Promise<OperationalRecord | undefined> {
    const [record] = await db.select().from(operationalRecords).where(eq(operationalRecords.id, id));
    return record;
  }

  async createOperationalRecord(record: InsertOperationalRecord): Promise<OperationalRecord> {
    const [newRecord] = await db.insert(operationalRecords).values([record]).returning();
    return newRecord;
  }

  async updateOperationalRecord(id: number, data: Partial<OperationalRecord>): Promise<OperationalRecord | undefined> {
    const [updatedRecord] = await db.update(operationalRecords)
      .set(data)
      .where(eq(operationalRecords.id, id))
      .returning();
    return updatedRecord;
  }

  async deleteOperationalRecord(id: number): Promise<boolean> {
    const result = await db.delete(operationalRecords).where(eq(operationalRecords.id, id)).returning();
    return result.length > 0;
  }

  async listOperationalRecords(filters?: Partial<OperationalRecord>): Promise<OperationalRecord[]> {
    let query = db.select().from(operationalRecords);
    
    if (filters?.companyId) {
      query = query.where(eq(operationalRecords.companyId, filters.companyId));
    }
    if (filters?.fieldId) {
      query = query.where(eq(operationalRecords.fieldId, filters.fieldId));
    }
    
    return await query.orderBy(desc(operationalRecords.createdAt));
  }
}

export const storage = new DatabaseStorage();
