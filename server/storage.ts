import {
  users, clients, measurements, dietPlans, appointments, activities, blogArticles,
  type User, type InsertUser,
  type Client, type InsertClient,
  type Measurement, type InsertMeasurement,
  type DietPlan, type InsertDietPlan,
  type Appointment, type InsertAppointment,
  type Activity, type InsertActivity,
  type BlogArticle, type InsertBlogArticle
} from "@shared/schema";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Client methods
  getClientsForUser(userId: number): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Measurement methods
  getMeasurementsForClient(clientId: number): Promise<Measurement[]>;
  getMeasurement(id: number): Promise<Measurement | undefined>;
  createMeasurement(measurement: InsertMeasurement): Promise<Measurement>;
  updateMeasurement(id: number, measurement: Partial<InsertMeasurement>): Promise<Measurement | undefined>;
  deleteMeasurement(id: number): Promise<boolean>;
  
  // DietPlan methods
  getDietPlansForUser(userId: number): Promise<DietPlan[]>;
  getDietPlansForClient(clientId: number): Promise<DietPlan[]>;
  getDietPlan(id: number): Promise<DietPlan | undefined>;
  createDietPlan(dietPlan: InsertDietPlan): Promise<DietPlan>;
  updateDietPlan(id: number, dietPlan: Partial<InsertDietPlan>): Promise<DietPlan | undefined>;
  deleteDietPlan(id: number): Promise<boolean>;
  
  // Appointment methods
  getAppointmentsForUser(userId: number): Promise<Appointment[]>;
  getAppointmentsForClient(clientId: number): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;
  
  // Activity methods
  getActivitiesForUser(userId: number, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Blog methods
  getBlogArticles(limit?: number): Promise<BlogArticle[]>;
  getBlogArticle(id: number): Promise<BlogArticle | undefined>;
  createBlogArticle(article: InsertBlogArticle): Promise<BlogArticle>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clients: Map<number, Client>;
  private measurements: Map<number, Measurement>;
  private dietPlans: Map<number, DietPlan>;
  private appointments: Map<number, Appointment>;
  private activities: Map<number, Activity>;
  private blogArticles: Map<number, BlogArticle>;
  
  private userIdCounter: number;
  private clientIdCounter: number;
  private measurementIdCounter: number;
  private dietPlanIdCounter: number;
  private appointmentIdCounter: number;
  private activityIdCounter: number;
  private blogArticleIdCounter: number;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.measurements = new Map();
    this.dietPlans = new Map();
    this.appointments = new Map();
    this.activities = new Map();
    this.blogArticles = new Map();
    
    this.userIdCounter = 1;
    this.clientIdCounter = 1;
    this.measurementIdCounter = 1;
    this.dietPlanIdCounter = 1;
    this.appointmentIdCounter = 1;
    this.activityIdCounter = 1;
    this.blogArticleIdCounter = 1;
    
    // Add some initial blog articles
    this.addInitialBlogArticles();
  }

  private addInitialBlogArticles() {
    const articles: InsertBlogArticle[] = [
      {
        title: "Kilo Vermede Sağlıklı Beslenmenin Önemi",
        summary: "Sağlıklı ve dengeli beslenme alışkanlıkları edinmek, kilo vermenin en önemli adımıdır...",
        content: "Detaylı içerik burada yer alacak",
        author: "Prof. Dr. Ayşe Yılmaz",
        imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        readTime: 8
      },
      {
        title: "Düzenli Egzersizin Metabolizma Üzerindeki Etkileri",
        summary: "Düzenli fiziksel aktivite, metabolizmayı hızlandırarak kalori yakımını artırır...",
        content: "Detaylı içerik burada yer alacak",
        author: "Uzm. Dyt. Mehmet Demir",
        imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        readTime: 6
      },
      {
        title: "Mevsimsel Besinlerin Sağlık Üzerindeki Olumlu Etkileri",
        summary: "Mevsiminde tüketilen sebze ve meyveler, hem besin değeri açısından daha zengindir...",
        content: "Detaylı içerik burada yer alacak",
        author: "Dyt. Zeynep Kaya",
        imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        readTime: 5
      }
    ];
    
    articles.forEach(article => {
      this.createBlogArticle(article);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const id = this.userIdCounter++;
    const user: User = {
      ...userData,
      id,
      password: hashedPassword,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Client methods
  async getClientsForUser(userId: number): Promise<Client[]> {
    const results: Client[] = [];
    for (const client of this.clients.values()) {
      if (client.userId === userId) {
        results.push(client);
      }
    }
    return results;
  }

  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(clientData: InsertClient): Promise<Client> {
    const id = this.clientIdCounter++;
    const client: Client = {
      ...clientData,
      id,
      createdAt: new Date()
    };
    this.clients.set(id, client);
    
    // Create activity for new client
    await this.createActivity({
      userId: clientData.userId,
      clientId: id,
      type: "client",
      description: `Yeni danışan eklendi: ${clientData.fullName}`
    });
    
    return client;
  }

  async updateClient(id: number, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updatedClient: Client = { ...client, ...clientData };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Measurement methods
  async getMeasurementsForClient(clientId: number): Promise<Measurement[]> {
    const results: Measurement[] = [];
    for (const measurement of this.measurements.values()) {
      if (measurement.clientId === clientId) {
        results.push(measurement);
      }
    }
    // Sort by date descending
    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getMeasurement(id: number): Promise<Measurement | undefined> {
    return this.measurements.get(id);
  }

  async createMeasurement(measurementData: InsertMeasurement): Promise<Measurement> {
    const id = this.measurementIdCounter++;
    const measurement: Measurement = {
      ...measurementData,
      id
    };
    this.measurements.set(id, measurement);
    
    // Get client to get userId for activity
    const client = this.clients.get(measurementData.clientId);
    if (client) {
      // Create activity for new measurement
      await this.createActivity({
        userId: client.userId,
        clientId: measurementData.clientId,
        type: "measurement",
        description: `Yeni ölçüm kaydedildi: ${client.fullName} için`
      });
    }
    
    return measurement;
  }

  async updateMeasurement(id: number, measurementData: Partial<InsertMeasurement>): Promise<Measurement | undefined> {
    const measurement = this.measurements.get(id);
    if (!measurement) return undefined;
    
    const updatedMeasurement: Measurement = { ...measurement, ...measurementData };
    this.measurements.set(id, updatedMeasurement);
    return updatedMeasurement;
  }

  async deleteMeasurement(id: number): Promise<boolean> {
    return this.measurements.delete(id);
  }

  // DietPlan methods
  async getDietPlansForUser(userId: number): Promise<DietPlan[]> {
    const results: DietPlan[] = [];
    for (const dietPlan of this.dietPlans.values()) {
      if (dietPlan.userId === userId) {
        results.push(dietPlan);
      }
    }
    return results;
  }

  async getDietPlansForClient(clientId: number): Promise<DietPlan[]> {
    const results: DietPlan[] = [];
    for (const dietPlan of this.dietPlans.values()) {
      if (dietPlan.clientId === clientId) {
        results.push(dietPlan);
      }
    }
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getDietPlan(id: number): Promise<DietPlan | undefined> {
    return this.dietPlans.get(id);
  }

  async createDietPlan(dietPlanData: InsertDietPlan): Promise<DietPlan> {
    const id = this.dietPlanIdCounter++;
    const dietPlan: DietPlan = {
      ...dietPlanData,
      id,
      createdAt: new Date()
    };
    this.dietPlans.set(id, dietPlan);
    
    // Get client info
    const client = this.clients.get(dietPlanData.clientId);
    const clientName = client ? client.fullName : 'Bilinmeyen Danışan';
    
    // Create activity for new diet plan
    await this.createActivity({
      userId: dietPlanData.userId,
      clientId: dietPlanData.clientId,
      type: "diet_plan",
      description: `Yeni diyet planı oluşturuldu: ${clientName} için ${dietPlanData.name}`
    });
    
    return dietPlan;
  }

  async updateDietPlan(id: number, dietPlanData: Partial<InsertDietPlan>): Promise<DietPlan | undefined> {
    const dietPlan = this.dietPlans.get(id);
    if (!dietPlan) return undefined;
    
    const updatedDietPlan: DietPlan = { ...dietPlan, ...dietPlanData };
    this.dietPlans.set(id, updatedDietPlan);
    return updatedDietPlan;
  }

  async deleteDietPlan(id: number): Promise<boolean> {
    return this.dietPlans.delete(id);
  }

  // Appointment methods
  async getAppointmentsForUser(userId: number): Promise<Appointment[]> {
    const results: Appointment[] = [];
    for (const appointment of this.appointments.values()) {
      if (appointment.userId === userId) {
        results.push(appointment);
      }
    }
    return results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getAppointmentsForClient(clientId: number): Promise<Appointment[]> {
    const results: Appointment[] = [];
    for (const appointment of this.appointments.values()) {
      if (appointment.clientId === clientId) {
        results.push(appointment);
      }
    }
    return results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentIdCounter++;
    const appointment: Appointment = {
      ...appointmentData,
      id,
      createdAt: new Date()
    };
    this.appointments.set(id, appointment);
    
    // Get client info
    const client = this.clients.get(appointmentData.clientId);
    const clientName = client ? client.fullName : 'Bilinmeyen Danışan';
    
    // Create activity for new appointment
    await this.createActivity({
      userId: appointmentData.userId,
      clientId: appointmentData.clientId,
      type: "appointment",
      description: `Yeni randevu oluşturuldu: ${clientName} ile ${new Date(appointmentData.date).toLocaleDateString('tr-TR')}`
    });
    
    return appointment;
  }

  async updateAppointment(id: number, appointmentData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    const updatedAppointment: Appointment = { ...appointment, ...appointmentData };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    return this.appointments.delete(id);
  }

  // Activity methods
  async getActivitiesForUser(userId: number, limit?: number): Promise<Activity[]> {
    const results: Activity[] = [];
    for (const activity of this.activities.values()) {
      if (activity.userId === userId) {
        results.push(activity);
      }
    }
    
    // Sort by creation date, newest first
    const sorted = results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Apply limit if provided
    if (limit && limit > 0) {
      return sorted.slice(0, limit);
    }
    
    return sorted;
  }

  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const activity: Activity = {
      ...activityData,
      id,
      createdAt: new Date()
    };
    this.activities.set(id, activity);
    return activity;
  }

  // Blog methods
  async getBlogArticles(limit?: number): Promise<BlogArticle[]> {
    const articles = Array.from(this.blogArticles.values());
    
    // Sort by publish date, newest first
    const sorted = articles.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    
    // Apply limit if provided
    if (limit && limit > 0) {
      return sorted.slice(0, limit);
    }
    
    return sorted;
  }

  async getBlogArticle(id: number): Promise<BlogArticle | undefined> {
    return this.blogArticles.get(id);
  }

  async createBlogArticle(articleData: InsertBlogArticle): Promise<BlogArticle> {
    const id = this.blogArticleIdCounter++;
    const article: BlogArticle = {
      ...articleData,
      id,
      publishedAt: new Date()
    };
    this.blogArticles.set(id, article);
    return article;
  }
}

export const storage = new MemStorage();
