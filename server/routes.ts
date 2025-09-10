import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPatientSchema, 
  insertAppointmentSchema, 
  insertProcedureSchema, 
  insertBillingSchema,
  insertPatientEvolutionSchema 
} from "@shared/schema";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login request body:", req.body);
      console.log("Login request body type:", typeof req.body);
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, you would create a session or JWT token here
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid request data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Users routes
  app.get("/api/users", async (req, res) => {
    try {
      const role = req.query.role as string;
      const users = await storage.getUsers(role);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Patient routes
  app.get("/api/patients", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const patients = await storage.getPatients(limit, offset);
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.get("/api/patients/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const patients = await storage.searchPatients(query);
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Failed to search patients" });
    }
  });

  app.get("/api/patients/:id", async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  app.post("/api/patients", async (req, res) => {
    try {
      const patientData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(patientData);
      res.status(201).json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create patient" });
    }
  });

  app.patch("/api/patients/:id", async (req, res) => {
    try {
      const patientData = insertPatientSchema.partial().parse(req.body);
      const patient = await storage.updatePatient(req.params.id, patientData);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update patient" });
    }
  });

  app.delete("/api/patients/:id", async (req, res) => {
    try {
      const success = await storage.deletePatient(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json({ message: "Patient deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete patient" });
    }
  });

  // Appointment routes
  app.get("/api/appointments", async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const appointments = await storage.getAppointments(startDate, endDate);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/today", async (req, res) => {
    try {
      const appointments = await storage.getTodaysAppointments();
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's appointments" });
    }
  });

  app.get("/api/appointments/:id", async (req, res) => {
    try {
      const appointment = await storage.getAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointment" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      console.log("Appointment request body:", req.body);
      
      // Transform string dates to Date objects before validation
      const transformedData = {
        ...req.body,
        appointmentDate: new Date(req.body.appointmentDate),
        checkedInAt: req.body.checkedInAt ? new Date(req.body.checkedInAt) : undefined,
        completedAt: req.body.completedAt ? new Date(req.body.completedAt) : undefined,
      };
      
      const appointmentData = insertAppointmentSchema.parse(transformedData);
      const appointment = await storage.createAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Appointment creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.patch("/api/appointments/:id", async (req, res) => {
    try {
      // Transform string dates to Date objects before validation
      const transformedData = {
        ...req.body,
        ...(req.body.appointmentDate && { appointmentDate: new Date(req.body.appointmentDate) }),
        ...(req.body.checkedInAt && { checkedInAt: new Date(req.body.checkedInAt) }),
        ...(req.body.completedAt && { completedAt: new Date(req.body.completedAt) }),
      };
      
      const appointmentData = insertAppointmentSchema.partial().parse(transformedData);
      const appointment = await storage.updateAppointment(req.params.id, appointmentData);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.delete("/api/appointments/:id", async (req, res) => {
    try {
      const success = await storage.deleteAppointment(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.json({ message: "Appointment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  // Procedure routes
  app.get("/api/procedures", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const procedures = await storage.getProcedures(limit, offset);
      res.json(procedures);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch procedures" });
    }
  });

  app.get("/api/procedures/:id", async (req, res) => {
    try {
      const procedure = await storage.getProcedure(req.params.id);
      if (!procedure) {
        return res.status(404).json({ message: "Procedure not found" });
      }
      res.json(procedure);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch procedure" });
    }
  });

  app.post("/api/procedures", async (req, res) => {
    try {
      console.log("Procedure request body:", req.body);
      
      // Transform string dates to Date objects before validation
      const transformedData = {
        ...req.body,
        scheduledDate: new Date(req.body.scheduledDate),
        startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
        endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
      };
      
      const procedureData = insertProcedureSchema.parse(transformedData);
      const procedure = await storage.createProcedure(procedureData);
      res.status(201).json(procedure);
    } catch (error) {
      console.error("Procedure creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid procedure data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create procedure" });
    }
  });

  app.patch("/api/procedures/:id", async (req, res) => {
    try {
      // Transform string dates to Date objects before validation
      const transformedData = {
        ...req.body,
        ...(req.body.scheduledDate && { scheduledDate: new Date(req.body.scheduledDate) }),
        ...(req.body.startTime && { startTime: new Date(req.body.startTime) }),
        ...(req.body.endTime && { endTime: new Date(req.body.endTime) }),
      };
      
      const procedureData = insertProcedureSchema.partial().parse(transformedData);
      const procedure = await storage.updateProcedure(req.params.id, procedureData);
      if (!procedure) {
        return res.status(404).json({ message: "Procedure not found" });
      }
      res.json(procedure);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid procedure data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update procedure" });
    }
  });

  // Billing routes
  app.get("/api/billing", async (req, res) => {
    try {
      const patientId = req.query.patientId as string;
      const billingRecords = await storage.getBillingRecords(patientId);
      res.json(billingRecords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch billing records" });
    }
  });

  app.get("/api/billing/:id", async (req, res) => {
    try {
      const billingRecord = await storage.getBillingRecord(req.params.id);
      if (!billingRecord) {
        return res.status(404).json({ message: "Billing record not found" });
      }
      res.json(billingRecord);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch billing record" });
    }
  });

  app.post("/api/billing", async (req, res) => {
    try {
      // Transform string dates to Date objects before validation
      const transformedData = {
        ...req.body,
        billingDate: req.body.billingDate ? new Date(req.body.billingDate) : new Date(),
        dueDate: new Date(req.body.dueDate),
        paidDate: req.body.paidDate ? new Date(req.body.paidDate) : undefined,
      };
      
      const billingData = insertBillingSchema.parse(transformedData);
      const billingRecord = await storage.createBillingRecord(billingData);
      res.status(201).json(billingRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid billing data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create billing record" });
    }
  });

  app.patch("/api/billing/:id", async (req, res) => {
    try {
      const billingData = insertBillingSchema.partial().parse(req.body);
      const billingRecord = await storage.updateBillingRecord(req.params.id, billingData);
      if (!billingRecord) {
        return res.status(404).json({ message: "Billing record not found" });
      }
      res.json(billingRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid billing data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update billing record" });
    }
  });

  // Patient Evolution routes
  app.get("/api/patient-evolutions/:patientId", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const evolutions = await storage.getPatientEvolutions(req.params.patientId, limit, offset);
      res.json(evolutions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient evolutions" });
    }
  });

  app.get("/api/patient-evolution/:id", async (req, res) => {
    try {
      const evolution = await storage.getPatientEvolution(req.params.id);
      if (!evolution) {
        return res.status(404).json({ message: "Patient evolution not found" });
      }
      res.json(evolution);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient evolution" });
    }
  });

  app.post("/api/patient-evolutions", async (req, res) => {
    try {
      console.log("Patient evolution request body:", req.body);
      
      // Transform string dates to Date objects before validation
      const transformedData = {
        ...req.body,
        evolutionDate: req.body.evolutionDate ? new Date(req.body.evolutionDate) : new Date(),
      };
      
      const evolutionData = insertPatientEvolutionSchema.parse(transformedData);
      const evolution = await storage.createPatientEvolution(evolutionData);
      res.status(201).json(evolution);
    } catch (error) {
      console.error("Patient evolution creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid evolution data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create patient evolution" });
    }
  });

  app.patch("/api/patient-evolutions/:id", async (req, res) => {
    try {
      // Transform string dates to Date objects before validation
      const transformedData = {
        ...req.body,
        ...(req.body.evolutionDate && { evolutionDate: new Date(req.body.evolutionDate) }),
      };
      
      const evolutionData = insertPatientEvolutionSchema.partial().parse(transformedData);
      const evolution = await storage.updatePatientEvolution(req.params.id, evolutionData);
      if (!evolution) {
        return res.status(404).json({ message: "Patient evolution not found" });
      }
      res.json(evolution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid evolution data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update patient evolution" });
    }
  });

  app.delete("/api/patient-evolutions/:id", async (req, res) => {
    try {
      const success = await storage.deletePatientEvolution(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Patient evolution not found" });
      }
      res.json({ message: "Patient evolution deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete patient evolution" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
