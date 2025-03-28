import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { ZodError } from "zod";
import { fromError } from "zod-validation-error";
import { 
  insertUserSchema, loginSchema, insertClientSchema, insertMeasurementSchema, 
  insertDietPlanSchema, insertAppointmentSchema, insertActivitySchema, 
  insertBlogArticleSchema 
} from "@shared/schema";

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "dietcim-secret-key";
const TOKEN_EXPIRY = '24h';

// Authentication middleware
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Yetkilendirme hatası: Token bulunamadı" });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number, username: string };
    res.locals.userId = decoded.id;
    res.locals.username = decoded.username;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Yetkilendirme hatası: Geçersiz token" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handling middleware for zod validation errors
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ZodError) {
      const formattedError = fromError(err);
      return res.status(400).json({ message: formattedError.message });
    }
    next(err);
  });

  // AUTH ROUTES
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Bu kullanıcı adı zaten kullanılıyor" });
      }
      
      const user = await storage.createUser(userData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      // Generate token
      const token = jwt.sign(
        { id: user.id, username: user.username }, 
        JWT_SECRET, 
        { expiresIn: TOKEN_EXPIRY }
      );
      
      res.status(201).json({ user: userWithoutPassword, token });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromError(error).message });
      }
      res.status(500).json({ message: "Kayıt sırasında bir hata oluştu" });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Geçersiz kullanıcı adı veya şifre" });
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Geçersiz kullanıcı adı veya şifre" });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      // Generate token
      const token = jwt.sign(
        { id: user.id, username: user.username }, 
        JWT_SECRET, 
        { expiresIn: TOKEN_EXPIRY }
      );
      
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromError(error).message });
      }
      res.status(500).json({ message: "Giriş sırasında bir hata oluştu" });
    }
  });

  app.get('/api/auth/me', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = res.locals.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Kullanıcı bulunamadı" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Kullanıcı bilgileri alınırken bir hata oluştu" });
    }
  });

  // CLIENT ROUTES
  app.get('/api/clients', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = res.locals.userId;
      const clients = await storage.getClientsForUser(userId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Danışanlar alınırken bir hata oluştu" });
    }
  });

  app.get('/api/clients/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      
      if (!client) {
        return res.status(404).json({ message: "Danışan bulunamadı" });
      }
      
      // Check if client belongs to the authenticated user
      if (client.userId !== res.locals.userId) {
        return res.status(403).json({ message: "Bu danışana erişim izniniz yok" });
      }
      
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Danışan alınırken bir hata oluştu" });
    }
  });

  app.post('/api/clients', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = res.locals.userId;
      const clientData = insertClientSchema.parse({
        ...req.body,
        userId
      });
      
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromError(error).message });
      }
      res.status(500).json({ message: "Danışan eklenirken bir hata oluştu" });
    }
  });

  app.put('/api/clients/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      
      if (!client) {
        return res.status(404).json({ message: "Danışan bulunamadı" });
      }
      
      // Check if client belongs to the authenticated user
      if (client.userId !== res.locals.userId) {
        return res.status(403).json({ message: "Bu danışanı güncelleme izniniz yok" });
      }
      
      const updatedClient = await storage.updateClient(id, req.body);
      res.json(updatedClient);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromError(error).message });
      }
      res.status(500).json({ message: "Danışan güncellenirken bir hata oluştu" });
    }
  });

  app.delete('/api/clients/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      
      if (!client) {
        return res.status(404).json({ message: "Danışan bulunamadı" });
      }
      
      // Check if client belongs to the authenticated user
      if (client.userId !== res.locals.userId) {
        return res.status(403).json({ message: "Bu danışanı silme izniniz yok" });
      }
      
      await storage.deleteClient(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Danışan silinirken bir hata oluştu" });
    }
  });

  // MEASUREMENT ROUTES
  app.get('/api/clients/:clientId/measurements', authenticate, async (req: Request, res: Response) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Danışan bulunamadı" });
      }
      
      // Check if client belongs to the authenticated user
      if (client.userId !== res.locals.userId) {
        return res.status(403).json({ message: "Bu danışanın ölçümlerine erişim izniniz yok" });
      }
      
      const measurements = await storage.getMeasurementsForClient(clientId);
      res.json(measurements);
    } catch (error) {
      res.status(500).json({ message: "Ölçümler alınırken bir hata oluştu" });
    }
  });

  app.post('/api/clients/:clientId/measurements', authenticate, async (req: Request, res: Response) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Danışan bulunamadı" });
      }
      
      // Check if client belongs to the authenticated user
      if (client.userId !== res.locals.userId) {
        return res.status(403).json({ message: "Bu danışan için ölçüm ekleme izniniz yok" });
      }
      
      const measurementData = insertMeasurementSchema.parse({
        ...req.body,
        clientId
      });
      
      const measurement = await storage.createMeasurement(measurementData);
      res.status(201).json(measurement);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromError(error).message });
      }
      res.status(500).json({ message: "Ölçüm eklenirken bir hata oluştu" });
    }
  });

  // DIET PLAN ROUTES
  app.get('/api/diet-plans', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = res.locals.userId;
      const dietPlans = await storage.getDietPlansForUser(userId);
      res.json(dietPlans);
    } catch (error) {
      res.status(500).json({ message: "Diyet planları alınırken bir hata oluştu" });
    }
  });

  app.get('/api/clients/:clientId/diet-plans', authenticate, async (req: Request, res: Response) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Danışan bulunamadı" });
      }
      
      // Check if client belongs to the authenticated user
      if (client.userId !== res.locals.userId) {
        return res.status(403).json({ message: "Bu danışanın diyet planlarına erişim izniniz yok" });
      }
      
      const dietPlans = await storage.getDietPlansForClient(clientId);
      res.json(dietPlans);
    } catch (error) {
      res.status(500).json({ message: "Diyet planları alınırken bir hata oluştu" });
    }
  });

  app.post('/api/clients/:clientId/diet-plans', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = res.locals.userId;
      const clientId = parseInt(req.params.clientId);
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Danışan bulunamadı" });
      }
      
      // Check if client belongs to the authenticated user
      if (client.userId !== userId) {
        return res.status(403).json({ message: "Bu danışan için diyet planı oluşturma izniniz yok" });
      }
      
      const dietPlanData = insertDietPlanSchema.parse({
        ...req.body,
        userId,
        clientId
      });
      
      const dietPlan = await storage.createDietPlan(dietPlanData);
      res.status(201).json(dietPlan);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromError(error).message });
      }
      res.status(500).json({ message: "Diyet planı oluşturulurken bir hata oluştu" });
    }
  });

  app.put('/api/diet-plans/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const dietPlan = await storage.getDietPlan(id);
      
      if (!dietPlan) {
        return res.status(404).json({ message: "Diyet planı bulunamadı" });
      }
      
      // Check if diet plan belongs to the authenticated user
      if (dietPlan.userId !== res.locals.userId) {
        return res.status(403).json({ message: "Bu diyet planını güncelleme izniniz yok" });
      }
      
      const updatedDietPlan = await storage.updateDietPlan(id, req.body);
      res.json(updatedDietPlan);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromError(error).message });
      }
      res.status(500).json({ message: "Diyet planı güncellenirken bir hata oluştu" });
    }
  });

  // APPOINTMENT ROUTES
  app.get('/api/appointments', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = res.locals.userId;
      const appointments = await storage.getAppointmentsForUser(userId);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Randevular alınırken bir hata oluştu" });
    }
  });

  app.get('/api/clients/:clientId/appointments', authenticate, async (req: Request, res: Response) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Danışan bulunamadı" });
      }
      
      // Check if client belongs to the authenticated user
      if (client.userId !== res.locals.userId) {
        return res.status(403).json({ message: "Bu danışanın randevularına erişim izniniz yok" });
      }
      
      const appointments = await storage.getAppointmentsForClient(clientId);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Randevular alınırken bir hata oluştu" });
    }
  });

  app.post('/api/appointments', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = res.locals.userId;
      const appointmentData = insertAppointmentSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if client exists and belongs to the user
      const client = await storage.getClient(appointmentData.clientId);
      if (!client) {
        return res.status(404).json({ message: "Danışan bulunamadı" });
      }
      if (client.userId !== userId) {
        return res.status(403).json({ message: "Bu danışan için randevu oluşturma izniniz yok" });
      }
      
      const appointment = await storage.createAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromError(error).message });
      }
      res.status(500).json({ message: "Randevu oluşturulurken bir hata oluştu" });
    }
  });

  app.put('/api/appointments/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const appointment = await storage.getAppointment(id);
      
      if (!appointment) {
        return res.status(404).json({ message: "Randevu bulunamadı" });
      }
      
      // Check if appointment belongs to the authenticated user
      if (appointment.userId !== res.locals.userId) {
        return res.status(403).json({ message: "Bu randevuyu güncelleme izniniz yok" });
      }
      
      const updatedAppointment = await storage.updateAppointment(id, req.body);
      res.json(updatedAppointment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromError(error).message });
      }
      res.status(500).json({ message: "Randevu güncellenirken bir hata oluştu" });
    }
  });

  // ACTIVITY ROUTES
  app.get('/api/activities', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = res.locals.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const activities = await storage.getActivitiesForUser(userId, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Aktiviteler alınırken bir hata oluştu" });
    }
  });

  // BLOG ROUTES
  app.get('/api/blog', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const articles = await storage.getBlogArticles(limit);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: "Blog makaleleri alınırken bir hata oluştu" });
    }
  });

  app.get('/api/blog/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.getBlogArticle(id);
      
      if (!article) {
        return res.status(404).json({ message: "Makale bulunamadı" });
      }
      
      res.json(article);
    } catch (error) {
      res.status(500).json({ message: "Makale alınırken bir hata oluştu" });
    }
  });

  // DASHBOARD STATS
  app.get('/api/dashboard/stats', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = res.locals.userId;
      
      // Get all clients for this user
      const clients = await storage.getClientsForUser(userId);
      const activeClients = clients.filter(client => client.isActive).length;
      
      // Get all appointments for this user
      const allAppointments = await storage.getAppointmentsForUser(userId);
      
      // Filter appointments for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayAppointments = allAppointments.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate >= today && appointmentDate < tomorrow;
      }).length;
      
      // Get all diet plans for this user
      const dietPlans = await storage.getDietPlansForUser(userId);
      const activeDietPlans = dietPlans.filter(plan => plan.isActive).length;
      
      // For telegram messages, we're assuming a counter would be obtained from a real integration
      // For demo purposes, we'll use a placeholder value
      const telegramMessages = 12;
      
      res.json({
        activeClients,
        todayAppointments,
        activeDietPlans,
        telegramMessages
      });
    } catch (error) {
      res.status(500).json({ message: "İstatistikler alınırken bir hata oluştu" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
