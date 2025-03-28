import { pgTable, text, serial, numeric, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users (Diyetisyenler)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  profileImage: text("profile_image"),
  telegramToken: text("telegram_token"),
  telegramChatId: text("telegram_chat_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Clients (Danışanlar)
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  birthDate: timestamp("birth_date"),
  gender: text("gender").notNull(),
  profileImage: text("profile_image"),
  height: numeric("height"),
  startingWeight: numeric("starting_weight"),
  targetWeight: numeric("target_weight"),
  activityLevel: text("activity_level"),
  medicalHistory: text("medical_history"),
  dietaryRestrictions: text("dietary_restrictions"),
  telegramChatId: text("telegram_chat_id"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Measurements (Ölçümler)
export const measurements = pgTable("measurements", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  date: timestamp("date").defaultNow(),
  weight: numeric("weight"),
  chest: numeric("chest"),
  waist: numeric("waist"),
  hip: numeric("hip"),
  arm: numeric("arm"),
  thigh: numeric("thigh"),
  bodyFatPercentage: numeric("body_fat_percentage"),
  notes: text("notes"),
});

// Diet Plans (Diyet Planları)
export const dietPlans = pgTable("diet_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  dailyCalories: numeric("daily_calories"),
  macroProtein: numeric("macro_protein"),
  macroCarbs: numeric("macro_carbs"),
  macroFat: numeric("macro_fat"),
  meals: jsonb("meals").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Appointments (Randevular)
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  date: timestamp("date").notNull(),
  duration: integer("duration").notNull(),
  type: text("type").notNull(), // "online", "in-person"
  notes: text("notes"),
  status: text("status").default("scheduled"), // "scheduled", "completed", "cancelled"
  createdAt: timestamp("created_at").defaultNow(),
});

// Activities (Aktiviteler)
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  type: text("type").notNull(), // "diet_plan", "measurement", "appointment", "telegram"
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Blog Articles (Blog Makaleleri)
export const blogArticles = pgTable("blog_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  author: text("author").notNull(),
  imageUrl: text("image_url"),
  readTime: integer("read_time"),
  publishedAt: timestamp("published_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertMeasurementSchema = createInsertSchema(measurements).omit({
  id: true,
});

export const insertDietPlanSchema = createInsertSchema(dietPlans).omit({
  id: true,
  createdAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertBlogArticleSchema = createInsertSchema(blogArticles).omit({
  id: true,
  publishedAt: true,
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Kullanıcı adı gerekli"),
  password: z.string().min(1, "Şifre gerekli"),
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Measurement = typeof measurements.$inferSelect;
export type InsertMeasurement = z.infer<typeof insertMeasurementSchema>;
export type DietPlan = typeof dietPlans.$inferSelect;
export type InsertDietPlan = z.infer<typeof insertDietPlanSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type BlogArticle = typeof blogArticles.$inferSelect;
export type InsertBlogArticle = z.infer<typeof insertBlogArticleSchema>;
export type Login = z.infer<typeof loginSchema>;
