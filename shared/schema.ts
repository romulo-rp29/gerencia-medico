import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, boolean, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["doctor", "receptionist"]);
export const appointmentTypeEnum = pgEnum("appointment_type", ["consultation", "endoscopy"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["scheduled", "confirmed", "checked_in", "in_progress", "completed", "cancelled", "no_show"]);
export const procedureStatusEnum = pgEnum("procedure_status", ["scheduled", "in_progress", "completed", "cancelled"]);
export const billingStatusEnum = pgEnum("billing_status", ["pending", "paid", "overdue", "cancelled"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull().default("receptionist"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Patients table
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(), // Store as ISO date string
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  insurancePrimary: text("insurance_primary"),
  insurancePolicyNumber: text("insurance_policy_number"),
  insuranceGroupNumber: text("insurance_group_number"),
  medicalHistory: jsonb("medical_history").$type<string[]>().default([]),
  allergies: jsonb("allergies").$type<string[]>().default([]),
  medications: jsonb("medications").$type<string[]>().default([]),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  doctorId: varchar("doctor_id").notNull().references(() => users.id),
  appointmentDate: timestamp("appointment_date").notNull(),
  duration: integer("duration").notNull().default(30), // in minutes
  type: appointmentTypeEnum("type").notNull(),
  status: appointmentStatusEnum("status").notNull().default("scheduled"),
  reason: text("reason").notNull(),
  notes: text("notes"),
  checkedInAt: timestamp("checked_in_at"),
  completedAt: timestamp("completed_at"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Procedures table
export const procedures = pgTable("procedures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  appointmentId: varchar("appointment_id").notNull().references(() => appointments.id),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  doctorId: varchar("doctor_id").notNull().references(() => users.id),
  procedureType: text("procedure_type").notNull(), // "Upper Endoscopy", "Colonoscopy", etc.
  status: procedureStatusEnum("status").notNull().default("scheduled"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  findings: text("findings"),
  recommendations: text("recommendations"),
  complications: text("complications"),
  medications: jsonb("medications").$type<{ name: string; dosage: string; instructions: string }[]>().default([]),
  followUpRequired: boolean("follow_up_required").notNull().default(false),
  followUpInstructions: text("follow_up_instructions"),
  pathologyOrdered: boolean("pathology_ordered").notNull().default(false),
  pathologyResults: text("pathology_results"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Billing table
export const billing = pgTable("billing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  appointmentId: varchar("appointment_id").references(() => appointments.id),
  procedureId: varchar("procedure_id").references(() => procedures.id),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  insuranceCovered: decimal("insurance_covered", { precision: 10, scale: 2 }).default("0"),
  patientResponsibility: decimal("patient_responsibility", { precision: 10, scale: 2 }).notNull(),
  status: billingStatusEnum("status").notNull().default("pending"),
  billingDate: timestamp("billing_date").notNull().default(sql`now()`),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Patient Evolution table for tracking consultation progress
export const patientEvolutions = pgTable("patient_evolutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  appointmentId: varchar("appointment_id").references(() => appointments.id),
  doctorId: varchar("doctor_id").notNull().references(() => users.id),
  evolutionDate: timestamp("evolution_date").notNull().default(sql`now()`),
  chiefComplaint: text("chief_complaint"),
  historyOfPresentIllness: text("history_of_present_illness"),
  physicalExamination: text("physical_examination"),
  assessment: text("assessment"),
  plan: text("plan"),
  prescriptions: jsonb("prescriptions").$type<{ medication: string; dosage: string; frequency: string; duration: string }[]>().default([]),
  nextAppointment: text("next_appointment"),
  observations: text("observations"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProcedureSchema = createInsertSchema(procedures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBillingSchema = createInsertSchema(billing).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPatientEvolutionSchema = createInsertSchema(patientEvolutions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

export type InsertProcedure = z.infer<typeof insertProcedureSchema>;
export type Procedure = typeof procedures.$inferSelect;

export type InsertBilling = z.infer<typeof insertBillingSchema>;
export type Billing = typeof billing.$inferSelect;

export type InsertPatientEvolution = z.infer<typeof insertPatientEvolutionSchema>;
export type PatientEvolution = typeof patientEvolutions.$inferSelect;
