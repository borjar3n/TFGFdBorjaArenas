import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertTaskSchema, 
  insertFieldSchema, 
  insertInventorySchema, 
  insertFieldActivitySchema,
  insertInventoryTransactionSchema,
  insertCompanySchema,
  insertInvitationCodeSchema,
  TaskStatus, 
  TaskPriority,
  FieldStatus, 
  InventoryType,
  ActivityType,
  TransactionType
} from "@shared/schema";
import { ZodError } from "zod";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Middleware to check authentication
  const ensureAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "No autenticado" });
  };

  // Error handling middleware for validation
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Error de validación",
        errors: err.errors,
      });
    }
    next(err);
  });

  // === Tasks API ===
  app.get("/api/tasks", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.currentCompanyId) {
        return res.status(400).json({ message: "Usuario no asociado a ninguna empresa" });
      }
      
      const tasks = await storage.listTasks({ companyId: user.currentCompanyId });
      res.status(200).json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener tareas" });
    }
  });

  app.post("/api/tasks", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      console.log("Creating task - User:", { id: user?.id, currentCompanyId: user?.currentCompanyId });
      console.log("Creating task - Request body:", req.body);
      
      if (!user?.currentCompanyId) {
        return res.status(400).json({ message: "Usuario no asociado a ninguna empresa" });
      }
      
      const taskData = insertTaskSchema.parse({
        ...req.body,
        companyId: user.currentCompanyId,
        createdBy: user.id
      });
      console.log("Parsed task data:", taskData);
      
      const task = await storage.createTask(taskData);
      console.log("Created task:", task);
      res.status(201).json(task);
    } catch (error) {
      console.error("Task creation error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Error de validación",
          errors: error.errors,
        });
      }
      res.status(500).json({ message: "Error al crear tarea" });
    }
  });

  app.get("/api/tasks/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Tarea no encontrada" });
      }
      res.status(200).json(task);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener tarea" });
    }
  });

  app.put("/api/tasks/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const taskUpdate = req.body;
      console.log("Backend - Updating task with ID:", id);
      console.log("Backend - Task update data:", taskUpdate);
      
      // Convert string dates to Date objects
      if (taskUpdate.dueDate && typeof taskUpdate.dueDate === 'string') {
        taskUpdate.dueDate = new Date(taskUpdate.dueDate);
        console.log("Backend - Converted dueDate to Date object:", taskUpdate.dueDate);
      }
      
      const task = await storage.updateTask(id, taskUpdate);
      console.log("Backend - Updated task result:", task);
      
      if (!task) {
        console.log("Backend - Task not found for ID:", id);
        return res.status(404).json({ message: "Tarea no encontrada" });
      }
      res.status(200).json(task);
    } catch (error) {
      console.error("Backend - Error updating task:", error);
      res.status(500).json({ message: "Error al actualizar tarea" });
    }
  });

  app.delete("/api/tasks/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteTask(id);
      if (!success) {
        return res.status(404).json({ message: "Tarea no encontrada" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar tarea" });
    }
  });

  // === Fields API ===
  app.get("/api/fields", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.currentCompanyId) {
        return res.status(400).json({ message: "Usuario no asociado a ninguna empresa" });
      }
      
      const fields = await storage.listFields({ companyId: user.currentCompanyId });
      res.status(200).json(fields);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener parcelas" });
    }
  });

  // Función auxiliar para geocodificación inversa usando Nominatim
  async function getLocationInfo(lat: number, lon: number) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=es`,
        {
          headers: {
            'User-Agent': 'Sistema-Gestion-Agricola/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Error en la API de geocodificación');
      }
      
      const data = await response.json();
      
      if (data && data.address) {
        const address = data.address;
        return {
          provincia: address.state || address.province || null,
          municipio: address.city || address.town || address.village || address.municipality || null
        };
      }
      
      return { provincia: null, municipio: null };
    } catch (error) {
      console.warn('Error obteniendo información geográfica:', error);
      return { provincia: null, municipio: null };
    }
  }

  app.post("/api/fields", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.currentCompanyId) {
        return res.status(400).json({ message: "Usuario no asociado a ninguna empresa" });
      }
      
      let fieldData = insertFieldSchema.parse({
        ...req.body,
        companyId: user.currentCompanyId
      });

      // Solo usar coordenadas tal como las envía el usuario
      
      const field = await storage.createField(fieldData);
      res.status(201).json(field);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Error de validación",
          errors: error.errors,
        });
      }
      res.status(500).json({ message: "Error al crear parcela" });
    }
  });

  app.get("/api/fields/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const field = await storage.getField(id);
      if (!field) {
        return res.status(404).json({ message: "Parcela no encontrada" });
      }
      res.status(200).json(field);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener parcela" });
    }
  });

  app.put("/api/fields/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      let fieldUpdate = req.body;

      // Solo actualizar con los datos enviados por el usuario

      const field = await storage.updateField(id, fieldUpdate);
      if (!field) {
        return res.status(404).json({ message: "Parcela no encontrada" });
      }
      res.status(200).json(field);
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar parcela" });
    }
  });

  app.delete("/api/fields/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteField(id);
      if (!success) {
        return res.status(404).json({ message: "Parcela no encontrada" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar parcela" });
    }
  });

  // === Inventory API ===
  app.get("/api/inventory", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.currentCompanyId) {
        return res.status(400).json({ message: "Usuario no asociado a ninguna empresa" });
      }
      
      const inventory = await storage.listInventory({ companyId: user.currentCompanyId });
      res.status(200).json(inventory);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener inventario" });
    }
  });

  app.post("/api/inventory", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      console.log("Backend - Creating inventory item for user:", { id: user?.id, currentCompanyId: user?.currentCompanyId });
      console.log("Backend - Raw request body:", req.body);
      
      if (!user?.currentCompanyId) {
        return res.status(400).json({ message: "Usuario no asociado a ninguna empresa" });
      }
      
      // Transform string numbers to integers
      const transformedBody = {
        ...req.body,
        quantity: parseInt(req.body.quantity, 10),
        minQuantity: req.body.minQuantity ? parseInt(req.body.minQuantity, 10) : 0,
        companyId: user.currentCompanyId
      };
      
      console.log("Backend - Transformed body:", transformedBody);
      
      const itemData = insertInventorySchema.parse(transformedBody);
      console.log("Backend - Parsed item data:", itemData);
      
      const item = await storage.createInventoryItem(itemData);
      console.log("Backend - Created inventory item:", item);
      res.status(201).json(item);
    } catch (error) {
      console.error("Backend - Error creating inventory item:", error);
      if (error instanceof ZodError) {
        console.error("Backend - Validation errors:", error.errors);
        return res.status(400).json({
          message: "Error de validación",
          errors: error.errors,
        });
      }
      res.status(500).json({ message: "Error al crear elemento de inventario" });
    }
  });

  app.get("/api/inventory/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const item = await storage.getInventoryItem(id);
      if (!item) {
        return res.status(404).json({ message: "Elemento no encontrado" });
      }
      res.status(200).json(item);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener elemento de inventario" });
    }
  });

  app.put("/api/inventory/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const itemUpdate = req.body;
      console.log("Backend - Updating inventory item with ID:", id);
      console.log("Backend - Inventory update data:", itemUpdate);
      
      const item = await storage.updateInventoryItem(id, itemUpdate);
      console.log("Backend - Updated inventory item result:", item);
      
      if (!item) {
        console.log("Backend - Inventory item not found for ID:", id);
        return res.status(404).json({ message: "Elemento no encontrado" });
      }
      res.status(200).json(item);
    } catch (error) {
      console.error("Backend - Error updating inventory item:", error);
      res.status(500).json({ message: "Error al actualizar elemento de inventario" });
    }
  });

  app.delete("/api/inventory/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteInventoryItem(id);
      if (!success) {
        return res.status(404).json({ message: "Elemento no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar elemento de inventario" });
    }
  });

  // === Users API ===
  app.get("/api/users", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.currentCompanyId) {
        return res.status(400).json({ message: "Usuario no asociado a ninguna empresa" });
      }
      
      // Get only users from the same company
      const companyMembers = await storage.getCompanyMembers(user.currentCompanyId);
      const userIds = companyMembers.map(member => member.userId);
      const allUsers = await storage.listUsers();
      const companyUsers = allUsers.filter(u => userIds.includes(u.id));
      
      // Remove password from response
      const sanitizedUsers = companyUsers.map(({ password, ...user }) => user);
      res.status(200).json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener usuarios" });
    }
  });
  
  // === Field Activities API ===
  app.get("/api/field-activities", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.currentCompanyId) {
        return res.status(400).json({ message: "Usuario no asociado a ninguna empresa" });
      }
      
      const fieldId = req.query.fieldId ? Number(req.query.fieldId) : undefined;
      
      // If fieldId is provided, verify it belongs to the user's company
      if (fieldId) {
        const field = await storage.getField(fieldId);
        if (!field || field.companyId !== user.currentCompanyId) {
          return res.status(403).json({ message: "Acceso denegado a esta parcela" });
        }
      }
      
      const activities = await storage.listFieldActivities(fieldId);
      // Filter activities to only include those from fields owned by the user's company
      const companyFields = await storage.listFields({ companyId: user.currentCompanyId });
      const companyFieldIds = companyFields.map(f => f.id);
      const filteredActivities = activities.filter(activity => companyFieldIds.includes(activity.fieldId));
      
      res.status(200).json(filteredActivities);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener actividades de parcela" });
    }
  });

  app.post("/api/field-activities", ensureAuthenticated, async (req, res) => {
    try {
      // Manejar específicamente la fecha para convertirla a un objeto Date
      const data = { ...req.body };
      if (typeof data.date === 'string') {
        data.date = new Date(data.date);
      }

      const activityData = insertFieldActivitySchema.parse(data);
      const activity = await storage.createFieldActivity(activityData);
      res.status(201).json(activity);
    } catch (error) {
      console.error("Error creando actividad:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Error de validación",
          errors: error.errors,
        });
      }
      res.status(500).json({ message: "Error al crear actividad de parcela" });
    }
  });

  app.get("/api/field-activities/:id", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.currentCompanyId) {
        return res.status(400).json({ message: "Usuario no asociado a ninguna empresa" });
      }
      
      const id = Number(req.params.id);
      const activity = await storage.getFieldActivity(id);
      if (!activity) {
        return res.status(404).json({ message: "Actividad no encontrada" });
      }
      
      // Verify the field belongs to the user's company
      const field = await storage.getField(activity.fieldId);
      if (!field || field.companyId !== user.currentCompanyId) {
        return res.status(403).json({ message: "Acceso denegado a esta actividad" });
      }
      
      res.status(200).json(activity);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener actividad de parcela" });
    }
  });

  app.put("/api/field-activities/:id", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.currentCompanyId) {
        return res.status(400).json({ message: "Usuario no asociado a ninguna empresa" });
      }
      
      const id = Number(req.params.id);
      const existingActivity = await storage.getFieldActivity(id);
      if (!existingActivity) {
        return res.status(404).json({ message: "Actividad no encontrada" });
      }
      
      // Verify the field belongs to the user's company
      const field = await storage.getField(existingActivity.fieldId);
      if (!field || field.companyId !== user.currentCompanyId) {
        return res.status(403).json({ message: "Acceso denegado a esta actividad" });
      }
      
      const activityUpdate = req.body;
      const activity = await storage.updateFieldActivity(id, activityUpdate);
      res.status(200).json(activity);
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar actividad de parcela" });
    }
  });

  app.delete("/api/field-activities/:id", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.currentCompanyId) {
        return res.status(400).json({ message: "Usuario no asociado a ninguna empresa" });
      }
      
      const id = Number(req.params.id);
      const activity = await storage.getFieldActivity(id);
      if (!activity) {
        return res.status(404).json({ message: "Actividad no encontrada" });
      }
      
      // Verify the field belongs to the user's company
      const field = await storage.getField(activity.fieldId);
      if (!field || field.companyId !== user.currentCompanyId) {
        return res.status(403).json({ message: "Acceso denegado a esta actividad" });
      }
      
      const success = await storage.deleteFieldActivity(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar actividad de parcela" });
    }
  });
  
  // === Inventory Transactions API ===
  app.get("/api/inventory-transactions", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.currentCompanyId) {
        return res.status(400).json({ message: "Usuario no asociado a ninguna empresa" });
      }
      
      const inventoryId = req.query.inventoryId ? Number(req.query.inventoryId) : undefined;
      
      // If inventoryId is provided, verify it belongs to the user's company
      if (inventoryId) {
        const inventory = await storage.getInventoryItem(inventoryId);
        if (!inventory || inventory.companyId !== user.currentCompanyId) {
          return res.status(403).json({ message: "Acceso denegado a este inventario" });
        }
      }
      
      const transactions = await storage.listInventoryTransactions(inventoryId);
      // Filter transactions to only include those from inventory items owned by the user's company
      const companyInventory = await storage.listInventory({ companyId: user.currentCompanyId });
      const companyInventoryIds = companyInventory.map(i => i.id);
      const filteredTransactions = transactions.filter(transaction => companyInventoryIds.includes(transaction.inventoryId));
      
      res.status(200).json(filteredTransactions);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener transacciones de inventario" });
    }
  });

  app.post("/api/inventory-transactions", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.currentCompanyId) {
        return res.status(400).json({ message: "Usuario no asociado a ninguna empresa" });
      }
      
      // Verify the inventory item belongs to the user's company
      const inventory = await storage.getInventoryItem(req.body.inventoryId);
      if (!inventory || inventory.companyId !== user.currentCompanyId) {
        return res.status(403).json({ message: "Acceso denegado a este inventario" });
      }
      
      // Manejar específicamente la fecha para convertirla a un objeto Date
      const data = { ...req.body };
      if (typeof data.date === 'string') {
        data.date = new Date(data.date);
      }

      const transactionData = insertInventoryTransactionSchema.parse(data);
      const transaction = await storage.createInventoryTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creando transacción:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Error de validación",
          errors: error.errors,
        });
      }
      res.status(500).json({ message: "Error al crear transacción de inventario" });
    }
  });

  app.get("/api/inventory-transactions/:id", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.currentCompanyId) {
        return res.status(400).json({ message: "Usuario no asociado a ninguna empresa" });
      }
      
      const id = Number(req.params.id);
      const transaction = await storage.getInventoryTransaction(id);
      if (!transaction) {
        return res.status(404).json({ message: "Transacción no encontrada" });
      }
      
      // Verify the inventory item belongs to the user's company
      const inventory = await storage.getInventoryItem(transaction.inventoryId);
      if (!inventory || inventory.companyId !== user.currentCompanyId) {
        return res.status(403).json({ message: "Acceso denegado a esta transacción" });
      }
      
      res.status(200).json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener transacción de inventario" });
    }
  });

  app.put("/api/inventory-transactions/:id", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.currentCompanyId) {
        return res.status(400).json({ message: "Usuario no asociado a ninguna empresa" });
      }
      
      const id = Number(req.params.id);
      const existingTransaction = await storage.getInventoryTransaction(id);
      if (!existingTransaction) {
        return res.status(404).json({ message: "Transacción no encontrada" });
      }
      
      // Verify the inventory item belongs to the user's company
      const inventory = await storage.getInventoryItem(existingTransaction.inventoryId);
      if (!inventory || inventory.companyId !== user.currentCompanyId) {
        return res.status(403).json({ message: "Acceso denegado a esta transacción" });
      }
      
      const transactionUpdate = req.body;
      const transaction = await storage.updateInventoryTransaction(id, transactionUpdate);
      res.status(200).json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar transacción de inventario" });
    }
  });

  app.delete("/api/inventory-transactions/:id", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.currentCompanyId) {
        return res.status(400).json({ message: "Usuario no asociado a ninguna empresa" });
      }
      
      const id = Number(req.params.id);
      const transaction = await storage.getInventoryTransaction(id);
      if (!transaction) {
        return res.status(404).json({ message: "Transacción no encontrada" });
      }
      
      // Verify the inventory item belongs to the user's company
      const inventory = await storage.getInventoryItem(transaction.inventoryId);
      if (!inventory || inventory.companyId !== user.currentCompanyId) {
        return res.status(403).json({ message: "Acceso denegado a esta transacción" });
      }
      
      const success = await storage.deleteInventoryTransaction(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar transacción de inventario" });
    }
  });

  // === Companies API ===
  app.get("/api/companies", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.id) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      const companies = await storage.getUserCompanies(user.id);
      res.status(200).json(companies);
    } catch (error) {
      console.error("Error getting user companies:", error);
      res.status(500).json({ message: "Error al obtener empresas del usuario" });
    }
  });

  // === Export API ===
  app.get("/api/export/tasks/pdf", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.currentCompanyId) {
        return res.status(400).json({ message: "Usuario no asociado a ninguna empresa" });
      }
      
      const tasks = await storage.listTasks({ companyId: user.currentCompanyId });
      
      // Create a PDF document
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=tareas-${new Date().toISOString().split('T')[0]}.pdf`);
      
      doc.pipe(res);
      
      // Add content to PDF
      doc.fontSize(16).text('Informe de Tareas', { align: 'center' });
      doc.moveDown();
      
      tasks.forEach((task, index) => {
        doc.fontSize(12).text(`Tarea ${index + 1}: ${task.title}`);
        doc.fontSize(10).text(`Estado: ${task.status}`);
        doc.fontSize(10).text(`Prioridad: ${task.priority}`);
        if (task.dueDate) {
          doc.fontSize(10).text(`Fecha límite: ${new Date(task.dueDate).toLocaleDateString()}`);
        }
        if (task.description) {
          doc.fontSize(10).text(`Descripción: ${task.description}`);
        }
        doc.moveDown();
      });
      
      doc.end();
    } catch (error) {
      res.status(500).json({ message: "Error al generar PDF de tareas" });
    }
  });

  app.get("/api/export/tasks/excel", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.currentCompanyId) {
        return res.status(400).json({ message: "Usuario no asociado a ninguna empresa" });
      }
      
      const tasks = await storage.listTasks({ companyId: user.currentCompanyId });
      
      // Create Excel file
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Tareas');
      
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Título', key: 'title', width: 30 },
        { header: 'Descripción', key: 'description', width: 40 },
        { header: 'Estado', key: 'status', width: 15 },
        { header: 'Prioridad', key: 'priority', width: 15 },
        { header: 'Fecha límite', key: 'dueDate', width: 20 },
        { header: 'Asignado a', key: 'assignedTo', width: 15 },
      ];
      
      // Add rows
      tasks.forEach(task => {
        worksheet.addRow({
          id: task.id,
          title: task.title,
          description: task.description || '',
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
          assignedTo: task.assignedTo || '',
        });
      });
      
      // Set headers for Excel file
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=tareas-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      res.status(500).json({ message: "Error al generar Excel de tareas" });
    }
  });

  app.get("/api/export/inventory/pdf", ensureAuthenticated, async (req, res) => {
    try {
      const items = await storage.listInventory();
      
      // Create a PDF document
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=inventario-${new Date().toISOString().split('T')[0]}.pdf`);
      
      doc.pipe(res);
      
      // Add content to PDF
      doc.fontSize(16).text('Informe de Inventario', { align: 'center' });
      doc.moveDown();
      
      items.forEach((item, index) => {
        doc.fontSize(12).text(`Elemento ${index + 1}: ${item.name}`);
        doc.fontSize(10).text(`Tipo: ${item.type}`);
        doc.fontSize(10).text(`Cantidad: ${item.quantity} ${item.unit}`);
        doc.fontSize(10).text(`Cantidad mínima: ${item.minQuantity} ${item.unit}`);
        if (item.notes) {
          doc.fontSize(10).text(`Notas: ${item.notes}`);
        }
        doc.moveDown();
      });
      
      doc.end();
    } catch (error) {
      res.status(500).json({ message: "Error al generar PDF de inventario" });
    }
  });

  app.get("/api/export/inventory/excel", ensureAuthenticated, async (req, res) => {
    try {
      const items = await storage.listInventory();
      
      // Create Excel file
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Inventario');
      
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Nombre', key: 'name', width: 30 },
        { header: 'Tipo', key: 'type', width: 15 },
        { header: 'Cantidad', key: 'quantity', width: 15 },
        { header: 'Unidad', key: 'unit', width: 15 },
        { header: 'Cantidad mínima', key: 'minQuantity', width: 20 },
        { header: 'Notas', key: 'notes', width: 40 },
      ];
      
      // Add rows
      items.forEach(item => {
        worksheet.addRow({
          id: item.id,
          name: item.name,
          type: item.type,
          quantity: item.quantity,
          unit: item.unit,
          minQuantity: item.minQuantity,
          notes: item.notes || '',
        });
      });
      
      // Set headers for Excel file
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=inventario-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      res.status(500).json({ message: "Error al generar Excel de inventario" });
    }
  });

  app.get("/api/export/fields/pdf", ensureAuthenticated, async (req, res) => {
    try {
      const fields = await storage.listFields();
      
      // Create a PDF document
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=parcelas-${new Date().toISOString().split('T')[0]}.pdf`);
      
      doc.pipe(res);
      
      // Add content to PDF
      doc.fontSize(16).text('Informe de Parcelas', { align: 'center' });
      doc.moveDown();
      
      fields.forEach((field, index) => {
        doc.fontSize(12).text(`Parcela ${index + 1}: ${field.name}`);
        doc.fontSize(10).text(`Área: ${field.area} m²`);
        if (field.crop) {
          doc.fontSize(10).text(`Cultivo: ${field.crop}`);
        }
        doc.fontSize(10).text(`Estado: ${field.status}`);
        doc.fontSize(10).text(`Progreso: ${field.progress}%`);
        doc.fontSize(10).text(`Estado de salud: ${field.healthStatus}`);
        if (field.notes) {
          doc.fontSize(10).text(`Notas: ${field.notes}`);
        }
        doc.moveDown();
      });
      
      doc.end();
    } catch (error) {
      res.status(500).json({ message: "Error al generar PDF de parcelas" });
    }
  });

  app.get("/api/export/fields/excel", ensureAuthenticated, async (req, res) => {
    try {
      const fields = await storage.listFields();
      
      // Create Excel file
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Parcelas');
      
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Nombre', key: 'name', width: 30 },
        { header: 'Área (m²)', key: 'area', width: 15 },
        { header: 'Cultivo', key: 'crop', width: 20 },
        { header: 'Estado', key: 'status', width: 15 },
        { header: 'Progreso', key: 'progress', width: 15 },
        { header: 'Estado de salud', key: 'healthStatus', width: 20 },
        { header: 'Notas', key: 'notes', width: 40 },
      ];
      
      // Add rows
      fields.forEach(field => {
        worksheet.addRow({
          id: field.id,
          name: field.name,
          area: field.area,
          crop: field.crop || '',
          status: field.status,
          progress: `${field.progress}%`,
          healthStatus: field.healthStatus,
          notes: field.notes || '',
        });
      });
      
      // Set headers for Excel file
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=parcelas-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      res.status(500).json({ message: "Error al generar Excel de parcelas" });
    }
  });

  // === Agricultural Analytics API ===
  app.get("/api/production-records", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.currentCompanyId) {
        return res.status(400).json({ message: "Usuario no asociado a ninguna empresa" });
      }
      
      const records = await storage.listProductionRecords({ companyId: user.currentCompanyId });
      res.json(records);
    } catch (error) {
      console.error("Error fetching production records:", error);
      res.status(500).json({ message: "Error al obtener registros de producción" });
    }
  });

  app.post("/api/production-records", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.currentCompanyId) {
        return res.status(400).json({ message: "Usuario no asociado a ninguna empresa" });
      }

      const recordData = {
        ...req.body,
        companyId: user.currentCompanyId,
        harvestDate: req.body.harvestDate ? new Date(req.body.harvestDate) : null,
      };

      const record = await storage.createProductionRecord(recordData);
      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating production record:", error);
      res.status(500).json({ message: "Error al crear registro de producción" });
    }
  });

  app.get("/api/economic-records", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.currentCompanyId) {
        return res.status(400).json({ message: "Usuario no asociado a ninguna empresa" });
      }
      
      const records = await storage.listEconomicRecords({ companyId: user.currentCompanyId });
      res.json(records);
    } catch (error) {
      console.error("Error fetching economic records:", error);
      res.status(500).json({ message: "Error al obtener registros económicos" });
    }
  });

  app.post("/api/economic-records", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.currentCompanyId) {
        return res.status(400).json({ message: "Usuario no asociado a ninguna empresa" });
      }

      const recordData = {
        ...req.body,
        companyId: user.currentCompanyId,
        date: new Date(req.body.date),
      };

      const record = await storage.createEconomicRecord(recordData);
      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating economic record:", error);
      res.status(500).json({ message: "Error al crear registro económico" });
    }
  });

  app.get("/api/environmental-records", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.currentCompanyId) {
        return res.status(400).json({ message: "Usuario no asociado a ninguna empresa" });
      }
      
      const records = await storage.listEnvironmentalRecords({ companyId: user.currentCompanyId });
      res.json(records);
    } catch (error) {
      console.error("Error fetching environmental records:", error);
      res.status(500).json({ message: "Error al obtener registros ambientales" });
    }
  });

  app.post("/api/environmental-records", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.currentCompanyId) {
        return res.status(400).json({ message: "Usuario no asociado a ninguna empresa" });
      }

      const recordData = {
        ...req.body,
        companyId: user.currentCompanyId,
        recordDate: new Date(req.body.recordDate),
      };

      const record = await storage.createEnvironmentalRecord(recordData);
      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating environmental record:", error);
      res.status(500).json({ message: "Error al crear registro ambiental" });
    }
  });

  // === Companies API ===
  app.get("/api/companies", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const companies = await storage.getUserCompanies(userId);
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  app.post("/api/companies", ensureAuthenticated, async (req, res) => {
    try {
      const result = insertCompanySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid company data",
          details: result.error.issues 
        });
      }

      const company = await storage.createCompany(result.data);
      
      // Add the creator as company admin
      await storage.createCompanyMember({
        userId: req.user!.id,
        companyId: company.id,
        role: "company_admin",
        permissions: {
          users: true,
          fields: true,
          inventory: true,
          tasks: true,
          reports: true,
          weather: true
        }
      });

      res.status(201).json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ error: "Failed to create company" });
    }
  });

  app.put("/api/companies/:id", ensureAuthenticated, async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      
      // Verify user has permission to edit this company
      const userCompanies = await storage.getUserCompanies(req.user!.id);
      const hasAccess = userCompanies.some(company => company.id === companyId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: "No tienes permisos para editar esta explotación" });
      }

      const result = insertCompanySchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Datos de explotación inválidos",
          details: result.error.issues 
        });
      }

      const updatedCompany = await storage.updateCompany(companyId, result.data);
      if (!updatedCompany) {
        return res.status(404).json({ error: "Explotación no encontrada" });
      }

      res.json(updatedCompany);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ error: "Error al actualizar la explotación" });
    }
  });

  // === Invitation codes API ===
  app.get("/api/invitation-codes", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      // Obtener todas las empresas del usuario
      const userCompanies = await storage.getUserCompanies(user.id);
      const allCodes = [];
      
      // Obtener códigos de invitación para cada empresa
      for (const company of userCompanies) {
        const codes = await storage.listInvitationCodes(company.id);
        allCodes.push(...codes);
      }
      
      res.json(allCodes);
    } catch (error) {
      console.error("Error fetching invitation codes:", error);
      res.status(500).json({ error: "Failed to fetch invitation codes" });
    }
  });

  app.get("/api/invitation-codes/:companyId", ensureAuthenticated, async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const codes = await storage.listInvitationCodes(companyId);
      res.json(codes);
    } catch (error) {
      console.error("Error fetching invitation codes:", error);
      res.status(500).json({ error: "Failed to fetch invitation codes" });
    }
  });

  app.post("/api/invitation-codes", ensureAuthenticated, async (req, res) => {
    try {
      const inviteData = {
        ...req.body,
        createdBy: req.user!.id,
        code: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        permissions: req.body.permissions || {
          users: false,
          fields: true,
          inventory: true,
          tasks: true,
          reports: false,
          weather: true
        }
      };

      const result = insertInvitationCodeSchema.safeParse(inviteData);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid invitation data",
          details: result.error.issues 
        });
      }

      const invitation = await storage.createInvitationCode(result.data);
      res.status(201).json(invitation);
    } catch (error) {
      console.error("Error creating invitation code:", error);
      res.status(500).json({ error: "Failed to create invitation code" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
