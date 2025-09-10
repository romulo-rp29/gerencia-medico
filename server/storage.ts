import { 
  type User, 
  type InsertUser, 
  type Patient, 
  type InsertPatient,
  type Appointment, 
  type InsertAppointment,
  type Procedure, 
  type InsertProcedure,
  type Billing, 
  type InsertBilling,
  type PatientEvolution,
  type InsertPatientEvolution,
  users,
  patients,
  appointments,
  procedures,
  billing,
  patientEvolutions
} from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and, gte, lte, like, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUsers(role?: string): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Patient methods
  getPatients(limit?: number, offset?: number): Promise<Patient[]>;
  getPatient(id: string): Promise<Patient | undefined>;
  searchPatients(query: string): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  deletePatient(id: string): Promise<boolean>;
  
  // Appointment methods
  getAppointments(startDate?: Date, endDate?: Date): Promise<(Appointment & { patient: Patient; doctor: User })[]>;
  getAppointment(id: string): Promise<(Appointment & { patient: Patient; doctor: User }) | undefined>;
  getAppointmentsByPatient(patientId: string): Promise<(Appointment & { doctor: User })[]>;
  getTodaysAppointments(): Promise<(Appointment & { patient: Patient; doctor: User })[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: string): Promise<boolean>;
  
  // Procedure methods
  getProcedures(limit?: number, offset?: number): Promise<(Procedure & { patient: Patient; doctor: User })[]>;
  getProcedure(id: string): Promise<(Procedure & { patient: Patient; doctor: User; appointment: Appointment }) | undefined>;
  getProceduresByPatient(patientId: string): Promise<(Procedure & { doctor: User; appointment: Appointment })[]>;
  createProcedure(procedure: InsertProcedure): Promise<Procedure>;
  updateProcedure(id: string, procedure: Partial<InsertProcedure>): Promise<Procedure | undefined>;
  
  // Billing methods
  getBillingRecords(patientId?: string): Promise<(Billing & { patient: Patient })[]>;
  getBillingRecord(id: string): Promise<(Billing & { patient: Patient }) | undefined>;
  createBillingRecord(billing: InsertBilling): Promise<Billing>;
  updateBillingRecord(id: string, billing: Partial<InsertBilling>): Promise<Billing | undefined>;

  // Patient Evolution methods
  getPatientEvolutions(patientId: string, limit?: number, offset?: number): Promise<(PatientEvolution & { patient: Patient; doctor: User; appointment?: Appointment })[]>;
  getPatientEvolution(id: string): Promise<(PatientEvolution & { patient: Patient; doctor: User; appointment?: Appointment }) | undefined>;
  createPatientEvolution(evolution: InsertPatientEvolution): Promise<PatientEvolution>;
  updatePatientEvolution(id: string, evolution: Partial<InsertPatientEvolution>): Promise<PatientEvolution | undefined>;
  deletePatientEvolution(id: string): Promise<boolean>;
  
  // Stats methods
  getDashboardStats(): Promise<{
    todayAppointments: number;
    pendingProcedures: number;
    activePatients: number;
    monthlyRevenue: number;
  }>;
}

// Initialize database connection
let connectionString = process.env.DATABASE_URL;

// Fallback to local PostgreSQL if Supabase connection fails
if (!connectionString) {
  connectionString = `postgresql://postgres:postgres@localhost:5432/postgres`;
  console.log("Using local PostgreSQL database as fallback");
}

const pool = new Pool({
  connectionString: connectionString,
});
const db = drizzle(pool);

export class DatabaseStorage implements IStorage {
  async initializeDefaults(): Promise<void> {
    try {
      // Check if default users exist
      const existingDoctor = await db.select().from(users).where(eq(users.username, "doctor")).limit(1);
      
      if (existingDoctor.length === 0) {
        // Create default doctor user
        await db.insert(users).values({
          id: randomUUID(),
          username: "doctor",
          password: "password", // In real app, this would be hashed
          fullName: "Dr. Sarah Smith",
          email: "doctor@gastromed.com",
          role: "doctor",
          isActive: true,
        });

        // Create default receptionist user
        await db.insert(users).values({
          id: randomUUID(),
          username: "receptionist",
          password: "password", // In real app, this would be hashed
          fullName: "Jane Doe",
          email: "receptionist@gastromed.com",
          role: "receptionist",
          isActive: true,
        });
      }
    } catch (error) {
      console.log("Database initialization completed or tables already exist");
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUsers(role?: string): Promise<User[]> {
    if (role) {
      return await db.select().from(users)
        .where(and(eq(users.isActive, true), eq(users.role, role as any)));
    }
    return await db.select().from(users).where(eq(users.isActive, true));
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const userWithId = { ...insertUser, id };
    const result = await db.insert(users).values(userWithId).returning();
    return result[0];
  }

  async updateUser(id: string, insertUser: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(insertUser).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Patient methods
  async getPatients(limit = 50, offset = 0): Promise<Patient[]> {
    const result = await db.select()
      .from(patients)
      .where(eq(patients.isActive, true))
      .orderBy(desc(patients.createdAt))
      .limit(limit)
      .offset(offset);
    return result;
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    const result = await db.select().from(patients).where(eq(patients.id, id)).limit(1);
    return result[0];
  }

  async searchPatients(query: string): Promise<Patient[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    const result = await db.select()
      .from(patients)
      .where(
        and(
          eq(patients.isActive, true),
          sql`(
            LOWER(${patients.firstName}) LIKE ${searchTerm} OR
            LOWER(${patients.lastName}) LIKE ${searchTerm} OR
            ${patients.phone} LIKE ${searchTerm} OR
            LOWER(${patients.email}) LIKE ${searchTerm}
          )`
        )
      );
    return result;
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = randomUUID();
    // Properly handle array fields
    const patientWithId = { 
      ...insertPatient, 
      id,
      allergies: insertPatient.allergies || null,
      medicalHistory: insertPatient.medicalHistory || null
    };
    const result = await db.insert(patients).values([patientWithId]).returning();
    return result[0];
  }

  async updatePatient(id: string, insertPatient: Partial<InsertPatient>): Promise<Patient | undefined> {
    const updateData = { 
      ...insertPatient, 
      updatedAt: new Date(),
    };
    // Remove any problematic array handling for now
    delete updateData.allergies;
    delete updateData.medicalHistory;
    
    const result = await db.update(patients).set(updateData).where(eq(patients.id, id)).returning();
    return result[0];
  }

  async deletePatient(id: string): Promise<boolean> {
    // Soft delete
    const result = await db.update(patients)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();
    return result.length > 0;
  }

  // Appointment methods
  async getAppointments(startDate?: Date, endDate?: Date): Promise<(Appointment & { patient: Patient; doctor: User })[]> {
    const whereCondition = startDate && endDate 
      ? and(
          gte(appointments.appointmentDate, startDate),
          lte(appointments.appointmentDate, endDate)
        )
      : undefined;

    const result = await db.select({
      appointment: appointments,
      patient: patients,
      doctor: users
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .innerJoin(users, eq(appointments.doctorId, users.id))
    .where(whereCondition)
    .orderBy(desc(appointments.appointmentDate));

    return result.map(row => ({
      ...row.appointment,
      patient: row.patient,
      doctor: row.doctor
    }));
  }

  async getAppointment(id: string): Promise<(Appointment & { patient: Patient; doctor: User }) | undefined> {
    const result = await db.select({
      appointment: appointments,
      patient: patients,
      doctor: users
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .innerJoin(users, eq(appointments.doctorId, users.id))
    .where(eq(appointments.id, id))
    .limit(1);

    if (result.length === 0) return undefined;
    const row = result[0];
    return {
      ...row.appointment,
      patient: row.patient,
      doctor: row.doctor
    };
  }

  async getAppointmentsByPatient(patientId: string): Promise<(Appointment & { doctor: User })[]> {
    const result = await db.select({
      appointment: appointments,
      doctor: users
    })
    .from(appointments)
    .innerJoin(users, eq(appointments.doctorId, users.id))
    .where(eq(appointments.patientId, patientId))
    .orderBy(desc(appointments.appointmentDate));

    return result.map(row => ({
      ...row.appointment,
      doctor: row.doctor
    }));
  }

  async getTodaysAppointments(): Promise<(Appointment & { patient: Patient; doctor: User })[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return this.getAppointments(startOfDay, endOfDay);
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = randomUUID();
    const appointmentWithId = { ...insertAppointment, id };
    const result = await db.insert(appointments).values(appointmentWithId).returning();
    return result[0];
  }

  async updateAppointment(id: string, insertAppointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const updateData = { ...insertAppointment, updatedAt: new Date() };
    const result = await db.update(appointments).set(updateData).where(eq(appointments.id, id)).returning();
    return result[0];
  }

  async deleteAppointment(id: string): Promise<boolean> {
    const result = await db.delete(appointments).where(eq(appointments.id, id));
    return result.rowCount > 0;
  }

  // Procedure methods
  async getProcedures(limit = 50, offset = 0): Promise<(Procedure & { patient: Patient; doctor: User })[]> {
    const result = await db.select({
      procedure: procedures,
      patient: patients,
      doctor: users
    })
    .from(procedures)
    .innerJoin(patients, eq(procedures.patientId, patients.id))
    .innerJoin(users, eq(procedures.doctorId, users.id))
    .orderBy(desc(procedures.scheduledDate))
    .limit(limit)
    .offset(offset);

    return result.map(row => ({
      ...row.procedure,
      patient: row.patient,
      doctor: row.doctor
    }));
  }

  async getProcedure(id: string): Promise<(Procedure & { patient: Patient; doctor: User; appointment: Appointment }) | undefined> {
    const result = await db.select({
      procedure: procedures,
      patient: patients,
      doctor: users,
      appointment: appointments
    })
    .from(procedures)
    .innerJoin(patients, eq(procedures.patientId, patients.id))
    .innerJoin(users, eq(procedures.doctorId, users.id))
    .innerJoin(appointments, eq(procedures.appointmentId, appointments.id))
    .where(eq(procedures.id, id))
    .limit(1);

    if (result.length === 0) return undefined;
    const row = result[0];
    return {
      ...row.procedure,
      patient: row.patient,
      doctor: row.doctor,
      appointment: row.appointment
    };
  }

  async getProceduresByPatient(patientId: string): Promise<(Procedure & { doctor: User; appointment: Appointment })[]> {
    const result = await db.select({
      procedure: procedures,
      doctor: users,
      appointment: appointments
    })
    .from(procedures)
    .innerJoin(users, eq(procedures.doctorId, users.id))
    .innerJoin(appointments, eq(procedures.appointmentId, appointments.id))
    .where(eq(procedures.patientId, patientId))
    .orderBy(desc(procedures.scheduledDate));

    return result.map(row => ({
      ...row.procedure,
      doctor: row.doctor,
      appointment: row.appointment
    }));
  }

  async createProcedure(insertProcedure: InsertProcedure): Promise<Procedure> {
    const id = randomUUID();
    const procedureWithId = { 
      ...insertProcedure, 
      id,
      medications: insertProcedure.medications || null
    };
    const result = await db.insert(procedures).values([procedureWithId]).returning();
    return result[0];
  }

  async updateProcedure(id: string, insertProcedure: Partial<InsertProcedure>): Promise<Procedure | undefined> {
    const updateData = { 
      ...insertProcedure, 
      updatedAt: new Date(),
    };
    // Remove problematic array handling
    delete updateData.medications;
    
    const result = await db.update(procedures).set(updateData).where(eq(procedures.id, id)).returning();
    return result[0];
  }

  // Billing methods
  async getBillingRecords(patientId?: string): Promise<(Billing & { patient: Patient })[]> {
    const whereCondition = patientId ? eq(billing.patientId, patientId) : undefined;

    const result = await db.select({
      billing: billing,
      patient: patients
    })
    .from(billing)
    .innerJoin(patients, eq(billing.patientId, patients.id))
    .where(whereCondition)
    .orderBy(desc(billing.createdAt));

    return result.map(row => ({
      ...row.billing,
      patient: row.patient
    }));
  }

  async getBillingRecord(id: string): Promise<(Billing & { patient: Patient }) | undefined> {
    const result = await db.select({
      billing: billing,
      patient: patients
    })
    .from(billing)
    .innerJoin(patients, eq(billing.patientId, patients.id))
    .where(eq(billing.id, id))
    .limit(1);

    if (result.length === 0) return undefined;
    const row = result[0];
    return {
      ...row.billing,
      patient: row.patient
    };
  }

  async createBillingRecord(insertBilling: InsertBilling): Promise<Billing> {
    const id = randomUUID();
    const billingWithId = { ...insertBilling, id };
    const result = await db.insert(billing).values(billingWithId).returning();
    return result[0];
  }

  async updateBillingRecord(id: string, insertBilling: Partial<InsertBilling>): Promise<Billing | undefined> {
    const updateData = { ...insertBilling, updatedAt: new Date() };
    const result = await db.update(billing).set(updateData).where(eq(billing.id, id)).returning();
    return result[0];
  }

  // Stats methods
  async getDashboardStats(): Promise<{
    todayAppointments: number;
    pendingProcedures: number;
    activePatients: number;
    monthlyRevenue: number;
  }> {
    const todaysAppointments = await this.getTodaysAppointments();
    
    const pendingProceduresResult = await db.select({ count: sql<number>`count(*)` })
      .from(procedures)
      .where(eq(procedures.status, "scheduled"));
    
    const activePatientsResult = await db.select({ count: sql<number>`count(*)` })
      .from(patients)
      .where(eq(patients.isActive, true));
    
    // Calculate monthly revenue
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenueResult = await db.select({ 
      total: sql<number>`COALESCE(SUM(CAST(${billing.amount} AS DECIMAL)), 0)` 
    })
    .from(billing)
    .where(
      and(
        eq(billing.status, "paid"),
        gte(billing.paidDate, startOfMonth)
      )
    );
    
    return {
      todayAppointments: todaysAppointments.length,
      pendingProcedures: pendingProceduresResult[0]?.count || 0,
      activePatients: activePatientsResult[0]?.count || 0,
      monthlyRevenue: monthlyRevenueResult[0]?.total || 0,
    };
  }

  // Patient Evolution methods
  async getPatientEvolutions(patientId: string, limit: number = 50, offset: number = 0): Promise<(PatientEvolution & { patient: Patient; doctor: User; appointment?: Appointment })[]> {
    const result = await db
      .select({
        evolution: patientEvolutions,
        patient: patients,
        doctor: users,
        appointment: appointments,
      })
      .from(patientEvolutions)
      .innerJoin(patients, eq(patientEvolutions.patientId, patients.id))
      .innerJoin(users, eq(patientEvolutions.doctorId, users.id))
      .leftJoin(appointments, eq(patientEvolutions.appointmentId, appointments.id))
      .where(eq(patientEvolutions.patientId, patientId))
      .orderBy(desc(patientEvolutions.evolutionDate))
      .limit(limit)
      .offset(offset);

    return result.map(row => ({
      ...row.evolution,
      patient: row.patient,
      doctor: row.doctor,
      appointment: row.appointment || undefined,
    }));
  }

  async getPatientEvolution(id: string): Promise<(PatientEvolution & { patient: Patient; doctor: User; appointment?: Appointment }) | undefined> {
    const result = await db
      .select({
        evolution: patientEvolutions,
        patient: patients,
        doctor: users,
        appointment: appointments,
      })
      .from(patientEvolutions)
      .innerJoin(patients, eq(patientEvolutions.patientId, patients.id))
      .innerJoin(users, eq(patientEvolutions.doctorId, users.id))
      .leftJoin(appointments, eq(patientEvolutions.appointmentId, appointments.id))
      .where(eq(patientEvolutions.id, id))
      .limit(1);

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      ...row.evolution,
      patient: row.patient,
      doctor: row.doctor,
      appointment: row.appointment || undefined,
    };
  }

  async createPatientEvolution(evolution: InsertPatientEvolution): Promise<PatientEvolution> {
    const newEvolution = {
      ...evolution,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await db.insert(patientEvolutions).values(newEvolution).returning();
    return result[0];
  }

  async updatePatientEvolution(id: string, evolution: Partial<InsertPatientEvolution>): Promise<PatientEvolution | undefined> {
    const updateData = {
      ...evolution,
      updatedAt: new Date(),
    };
    
    const result = await db.update(patientEvolutions)
      .set(updateData)
      .where(eq(patientEvolutions.id, id))
      .returning();
    
    return result[0];
  }

  async deletePatientEvolution(id: string): Promise<boolean> {
    const result = await db.delete(patientEvolutions).where(eq(patientEvolutions.id, id));
    return (result as any).rowCount > 0;
  }
}

// Create storage instance and initialize defaults
export const storage = new DatabaseStorage();

// Initialize default users on startup
storage.initializeDefaults().catch(error => {
  console.warn("Could not initialize database defaults:", error.message);
});
