import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, decimal, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "owner",
  "tenant",
  "contractor",
  "union_admin"
]);

export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "submitted",
  "assigned",
  "in_progress",
  "completed",
  "under_review",
  "closed"
]);

export const maintenancePriorityEnum = pgEnum("maintenance_priority", [
  "low",
  "medium",
  "high",
  "urgent"
]);

export const maintenanceCategoryEnum = pgEnum("maintenance_category", [
  "plumbing",
  "electrical",
  "hvac",
  "carpentry",
  "painting",
  "cleaning",
  "general",
  "other"
]);

export const quoteStatusEnum = pgEnum("quote_status", [
  "pending",
  "accepted",
  "rejected"
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "refunded"
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "maintenance_created",
  "maintenance_assigned",
  "maintenance_updated",
  "maintenance_completed",
  "quote_received",
  "quote_accepted",
  "payment_received",
  "payment_failed",
  "system"
]);

export const activityActionEnum = pgEnum("activity_action", [
  "user_created",
  "user_updated",
  "user_deleted",
  "user_activated",
  "user_deactivated",
  "property_created",
  "property_updated",
  "property_deleted",
  "unit_created",
  "unit_updated",
  "unit_deleted",
  "maintenance_created",
  "maintenance_updated",
  "maintenance_assigned",
  "maintenance_completed",
  "payment_created",
  "payment_completed",
  "settings_updated",
  "login_success",
  "login_failed",
  "password_changed"
]);

// Tables
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("tenant"),
  avatar: text("avatar"),
  verified: boolean("verified").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  image: text("image"),
  totalUnits: integer("total_units").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const units = pgTable("units", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  unitNumber: text("unit_number").notNull(),
  floor: integer("floor"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  size: decimal("size", { precision: 10, scale: 2 }),
  rentAmount: decimal("rent_amount", { precision: 10, scale: 2 }),
  isOccupied: boolean("is_occupied").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const leases = pgTable("leases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  unitId: varchar("unit_id").notNull().references(() => units.id, { onDelete: "cascade" }),
  tenantId: varchar("tenant_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  monthlyRent: decimal("monthly_rent", { precision: 10, scale: 2 }).notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const contractors = pgTable("contractors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  companyName: text("company_name").notNull(),
  description: text("description"),
  specialties: text("specialties").array(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalReviews: integer("total_reviews").notNull().default(0),
  verified: boolean("verified").notNull().default(false),
  licenseNumber: text("license_number"),
  insuranceInfo: text("insurance_info"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const maintenanceRequests = pgTable("maintenance_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  unitId: varchar("unit_id").notNull().references(() => units.id, { onDelete: "cascade" }),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  assignedToId: varchar("assigned_to_id").references(() => contractors.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: maintenanceCategoryEnum("category").notNull(),
  priority: maintenancePriorityEnum("priority").notNull().default("medium"),
  status: maintenanceStatusEnum("status").notNull().default("submitted"),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }),
  scheduledDate: timestamp("scheduled_date"),
  completedAt: timestamp("completed_at"),
  closedAt: timestamp("closed_at"),
  // Service workflow fields
  dispatchModel: text("dispatch_model").default("marketplace"),   // 'marketplace' | 'bidding'
  preferredTimeSlot: text("preferred_time_slot"),
  broadcastedAt: timestamp("broadcasted_at"),                    // when request was broadcast (bidding mode)
  platformCommission: decimal("platform_commission", { precision: 5, scale: 2 }).default("10.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  maintenanceRequestId: varchar("maintenance_request_id").notNull().references(() => maintenanceRequests.id, { onDelete: "cascade" }),
  contractorId: varchar("contractor_id").notNull().references(() => contractors.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  estimatedDuration: text("estimated_duration"),
  status: quoteStatusEnum("status").notNull().default("pending"),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  maintenanceRequestId: varchar("maintenance_request_id").references(() => maintenanceRequests.id),
  payerId: varchar("payer_id").notNull().references(() => users.id),
  payeeId: varchar("payee_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("SAR"),
  stripePaymentId: text("stripe_payment_id"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  maintenanceRequestId: varchar("maintenance_request_id").notNull().references(() => maintenanceRequests.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const attachments = pgTable("attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentType: text("parent_type").notNull(),
  parentId: varchar("parent_id").notNull(),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  uploadedById: varchar("uploaded_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  userEmail: text("user_email"),
  userRole: text("user_role"),
  action: activityActionEnum("action").notNull(),
  entityType: text("entity_type"),
  entityId: varchar("entity_id"),
  details: text("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedById: varchar("updated_by_id").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const failedLogins = pgTable("failed_logins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  reason: text("reason"),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const systemMessages = pgTable("system_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en").notNull(),
  messageAr: text("message_ar").notNull(),
  messageEn: text("message_en").notNull(),
  visible: boolean("visible").notNull().default(true),
  priority: integer("priority").notNull().default(0),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  createdById: varchar("created_by_id").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// ── Ratings ───────────────────────────────────────────────────────────────────
export const ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  maintenanceRequestId: varchar("maintenance_request_id").notNull().references(() => maintenanceRequests.id, { onDelete: "cascade" }),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id),
  toContractorId: varchar("to_contractor_id").notNull().references(() => contractors.id),
  score: integer("score").notNull(),                       // 1–5
  comment: text("comment"),
  flaggedAccessibility: boolean("flagged_accessibility").notNull().default(false),
  flagNote: text("flag_note"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedProperties: many(properties),
  leases: many(leases),
  contractor: many(contractors),
  maintenanceRequests: many(maintenanceRequests),
  comments: many(comments),
  notifications: many(notifications),
  paymentsMade: many(payments, { relationName: "payer" }),
  paymentsReceived: many(payments, { relationName: "payee" })
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, { fields: [properties.ownerId], references: [users.id] }),
  units: many(units)
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  property: one(properties, { fields: [units.propertyId], references: [properties.id] }),
  leases: many(leases),
  maintenanceRequests: many(maintenanceRequests)
}));

export const leasesRelations = relations(leases, ({ one }) => ({
  unit: one(units, { fields: [leases.unitId], references: [units.id] }),
  tenant: one(users, { fields: [leases.tenantId], references: [users.id] })
}));

export const contractorsRelations = relations(contractors, ({ one, many }) => ({
  user: one(users, { fields: [contractors.userId], references: [users.id] }),
  quotes: many(quotes),
  assignedRequests: many(maintenanceRequests)
}));

export const maintenanceRequestsRelations = relations(maintenanceRequests, ({ one, many }) => ({
  unit: one(units, { fields: [maintenanceRequests.unitId], references: [units.id] }),
  createdBy: one(users, { fields: [maintenanceRequests.createdById], references: [users.id] }),
  assignedTo: one(contractors, { fields: [maintenanceRequests.assignedToId], references: [contractors.id] }),
  quotes: many(quotes),
  comments: many(comments),
  payments: many(payments)
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  maintenanceRequest: one(maintenanceRequests, { fields: [quotes.maintenanceRequestId], references: [maintenanceRequests.id] }),
  contractor: one(contractors, { fields: [quotes.contractorId], references: [contractors.id] })
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  maintenanceRequest: one(maintenanceRequests, { fields: [payments.maintenanceRequestId], references: [maintenanceRequests.id] }),
  payer: one(users, { fields: [payments.payerId], references: [users.id], relationName: "payer" }),
  payee: one(users, { fields: [payments.payeeId], references: [users.id], relationName: "payee" })
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  maintenanceRequest: one(maintenanceRequests, { fields: [comments.maintenanceRequestId], references: [maintenanceRequests.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] })
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] })
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  maintenanceRequest: one(maintenanceRequests, { fields: [ratings.maintenanceRequestId], references: [maintenanceRequests.id] }),
  fromUser: one(users, { fields: [ratings.fromUserId], references: [users.id] }),
  toContractor: one(contractors, { fields: [ratings.toContractorId], references: [contractors.id] })
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPropertySchema = createInsertSchema(properties).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUnitSchema = createInsertSchema(units).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLeaseSchema = createInsertSchema(leases).omit({ id: true, createdAt: true, updatedAt: true });
export const insertContractorSchema = createInsertSchema(contractors).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMaintenanceRequestSchema = createInsertSchema(maintenanceRequests).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAttachmentSchema = createInsertSchema(attachments).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true });
export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({ id: true, updatedAt: true });
export const insertFailedLoginSchema = createInsertSchema(failedLogins).omit({ id: true, createdAt: true });
export const insertSystemMessageSchema = createInsertSchema(systemMessages).omit({ id: true, updatedAt: true });
export const insertRatingSchema = createInsertSchema(ratings).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Unit = typeof units.$inferSelect;
export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type Lease = typeof leases.$inferSelect;
export type InsertLease = z.infer<typeof insertLeaseSchema>;
export type Contractor = typeof contractors.$inferSelect;
export type InsertContractor = z.infer<typeof insertContractorSchema>;
export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type InsertMaintenanceRequest = z.infer<typeof insertMaintenanceRequestSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type FailedLogin = typeof failedLogins.$inferSelect;
export type InsertFailedLogin = z.infer<typeof insertFailedLoginSchema>;
export type SystemMessage = typeof systemMessages.$inferSelect;
export type InsertSystemMessage = z.infer<typeof insertSystemMessageSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
