import { eq, and, or, desc, ilike, inArray, sql, avg } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  users, properties, units, leases, contractors, maintenanceRequests,
  quotes, payments, comments, attachments, notifications, activityLogs,
  systemSettings, failedLogins, systemMessages, ratings,
  type User, type InsertUser, type Property, type InsertProperty,
  type Unit, type InsertUnit, type Lease, type InsertLease,
  type Contractor, type InsertContractor, type MaintenanceRequest, type InsertMaintenanceRequest,
  type Quote, type InsertQuote, type Payment, type InsertPayment,
  type Comment, type InsertComment, type Attachment, type InsertAttachment,
  type Notification, type InsertNotification, type ActivityLog, type InsertActivityLog,
  type SystemSetting, type InsertSystemSetting, type FailedLogin, type InsertFailedLogin,
  type SystemMessage, type InsertSystemMessage,
  type Rating, type InsertRating
} from "../../../shared/schema.js";

// ── Users ────────────────────────────────────────────────────────────────────

export async function getUser(id: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user ?? null;
}

export async function createUser(data: InsertUser): Promise<User> {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

export async function updateUser(id: string, data: Partial<InsertUser>): Promise<User | null> {
  const [user] = await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id)).returning();
  return user ?? null;
}

export async function getAllUsers(filters?: { role?: string; active?: boolean; search?: string }): Promise<User[]> {
  let query = db.select().from(users).$dynamic();
  const conditions = [];
  if (filters?.role) conditions.push(eq(users.role, filters.role as any));
  if (filters?.active !== undefined) conditions.push(eq(users.active, filters.active));
  if (filters?.search) conditions.push(or(ilike(users.name, `%${filters.search}%`), ilike(users.email, `%${filters.search}%`))!);
  if (conditions.length > 0) query = query.where(and(...conditions));
  return query.orderBy(desc(users.createdAt));
}

export async function activateUser(id: string): Promise<void> {
  await db.update(users).set({ active: true, updatedAt: new Date() }).where(eq(users.id, id));
}

export async function deactivateUser(id: string): Promise<void> {
  await db.update(users).set({ active: false, updatedAt: new Date() }).where(eq(users.id, id));
}

export async function deleteUser(id: string): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}

// ── Properties ───────────────────────────────────────────────────────────────

export async function getProperties(ownerId?: string): Promise<Property[]> {
  if (ownerId) {
    return db.select().from(properties).where(eq(properties.ownerId, ownerId)).orderBy(desc(properties.createdAt));
  }
  return db.select().from(properties).orderBy(desc(properties.createdAt));
}

export async function getProperty(id: string): Promise<Property | null> {
  const [prop] = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
  return prop ?? null;
}

export async function createProperty(data: InsertProperty): Promise<Property> {
  const [prop] = await db.insert(properties).values(data).returning();
  return prop;
}

export async function updateProperty(id: string, data: Partial<InsertProperty>): Promise<Property | null> {
  const [prop] = await db.update(properties).set({ ...data, updatedAt: new Date() }).where(eq(properties.id, id)).returning();
  return prop ?? null;
}

export async function deleteProperty(id: string): Promise<void> {
  await db.delete(properties).where(eq(properties.id, id));
}

// ── Units ────────────────────────────────────────────────────────────────────

export async function getUnits(propertyId?: string): Promise<Unit[]> {
  if (propertyId) {
    return db.select().from(units).where(eq(units.propertyId, propertyId)).orderBy(units.unitNumber);
  }
  return db.select().from(units).orderBy(units.unitNumber);
}

export async function getUnit(id: string): Promise<Unit | null> {
  const [unit] = await db.select().from(units).where(eq(units.id, id)).limit(1);
  return unit ?? null;
}

export async function createUnit(data: InsertUnit): Promise<Unit> {
  const [unit] = await db.insert(units).values(data).returning();
  return unit;
}

export async function updateUnit(id: string, data: Partial<InsertUnit>): Promise<Unit | null> {
  const [unit] = await db.update(units).set({ ...data, updatedAt: new Date() }).where(eq(units.id, id)).returning();
  return unit ?? null;
}

export async function deleteUnit(id: string): Promise<void> {
  await db.delete(units).where(eq(units.id, id));
}

// ── Leases ───────────────────────────────────────────────────────────────────

export async function getLeases(tenantId?: string, unitId?: string): Promise<Lease[]> {
  const conditions = [];
  if (tenantId) conditions.push(eq(leases.tenantId, tenantId));
  if (unitId) conditions.push(eq(leases.unitId, unitId));
  let query = db.select().from(leases).$dynamic();
  if (conditions.length > 0) query = query.where(and(...conditions));
  return query.orderBy(desc(leases.createdAt));
}

export async function getLease(id: string): Promise<Lease | null> {
  const [lease] = await db.select().from(leases).where(eq(leases.id, id)).limit(1);
  return lease ?? null;
}

export async function createLease(data: InsertLease): Promise<Lease> {
  const [lease] = await db.insert(leases).values(data).returning();
  return lease;
}

export async function updateLease(id: string, data: Partial<InsertLease>): Promise<Lease | null> {
  const [lease] = await db.update(leases).set({ ...data, updatedAt: new Date() }).where(eq(leases.id, id)).returning();
  return lease ?? null;
}

// ── Contractors ───────────────────────────────────────────────────────────────

export async function getContractors(specialty?: string): Promise<(Contractor & { user: User })[]> {
  const rows = await db
    .select()
    .from(contractors)
    .innerJoin(users, eq(contractors.userId, users.id))
    .orderBy(desc(contractors.rating));

  const result = rows.map(r => ({ ...r.contractors, user: r.users }));
  if (specialty) {
    return result.filter(c => c.specialties?.includes(specialty));
  }
  return result;
}

export async function getContractor(id: string): Promise<(Contractor & { user: User }) | null> {
  const [row] = await db
    .select()
    .from(contractors)
    .innerJoin(users, eq(contractors.userId, users.id))
    .where(eq(contractors.id, id))
    .limit(1);
  if (!row) return null;
  return { ...row.contractors, user: row.users };
}

export async function getContractorByUserId(userId: string): Promise<Contractor | null> {
  const [contractor] = await db.select().from(contractors).where(eq(contractors.userId, userId)).limit(1);
  return contractor ?? null;
}

export async function createContractor(data: InsertContractor): Promise<Contractor> {
  const [contractor] = await db.insert(contractors).values(data).returning();
  return contractor;
}

export async function updateContractor(id: string, data: Partial<InsertContractor>): Promise<Contractor | null> {
  const [contractor] = await db.update(contractors).set({ ...data, updatedAt: new Date() }).where(eq(contractors.id, id)).returning();
  return contractor ?? null;
}

// ── Maintenance Requests ──────────────────────────────────────────────────────

export async function getMaintenanceRequests(filters?: {
  createdById?: string;
  assignedToContractorId?: string;
  unitIds?: string[];
  status?: string;
}): Promise<MaintenanceRequest[]> {
  let query = db.select().from(maintenanceRequests).$dynamic();
  const conditions = [];
  if (filters?.createdById) conditions.push(eq(maintenanceRequests.createdById, filters.createdById));
  if (filters?.assignedToContractorId) conditions.push(eq(maintenanceRequests.assignedToId, filters.assignedToContractorId));
  if (filters?.unitIds?.length) conditions.push(inArray(maintenanceRequests.unitId, filters.unitIds));
  if (filters?.status) conditions.push(eq(maintenanceRequests.status, filters.status as any));
  if (conditions.length > 0) query = query.where(and(...conditions));
  return query.orderBy(desc(maintenanceRequests.createdAt));
}

export async function getMaintenanceRequest(id: string): Promise<MaintenanceRequest | null> {
  const [req] = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.id, id)).limit(1);
  return req ?? null;
}

export async function createMaintenanceRequest(data: InsertMaintenanceRequest): Promise<MaintenanceRequest> {
  const [req] = await db.insert(maintenanceRequests).values(data).returning();
  return req;
}

export async function updateMaintenanceRequest(id: string, data: Partial<InsertMaintenanceRequest>): Promise<MaintenanceRequest | null> {
  const [req] = await db.update(maintenanceRequests).set({ ...data, updatedAt: new Date() }).where(eq(maintenanceRequests.id, id)).returning();
  return req ?? null;
}

export async function getMaintenanceStats(filters?: {
  createdById?: string;
  assignedToContractorId?: string;
  unitIds?: string[];
}): Promise<{ total: number; open: number; submitted: number; assigned: number; in_progress: number; completed: number; closed: number }> {
  const reqs = await getMaintenanceRequests(filters);
  const total = reqs.length;
  const submitted = reqs.filter(r => r.status === "submitted").length;
  const assigned = reqs.filter(r => r.status === "assigned").length;
  const in_progress = reqs.filter(r => r.status === "in_progress").length;
  const completed = reqs.filter(r => r.status === "completed").length;
  const closed = reqs.filter(r => r.status === "closed").length;
  const open = submitted + assigned + in_progress;
  return { total, open, submitted, assigned, in_progress, completed, closed };
}

// ── Quotes ───────────────────────────────────────────────────────────────────

export async function getQuotes(maintenanceRequestId?: string, contractorId?: string): Promise<Quote[]> {
  const conditions = [];
  if (maintenanceRequestId) conditions.push(eq(quotes.maintenanceRequestId, maintenanceRequestId));
  if (contractorId) conditions.push(eq(quotes.contractorId, contractorId));
  let query = db.select().from(quotes).$dynamic();
  if (conditions.length > 0) query = query.where(and(...conditions));
  return query.orderBy(desc(quotes.createdAt));
}

export async function getQuote(id: string): Promise<Quote | null> {
  const [quote] = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  return quote ?? null;
}

export async function createQuote(data: InsertQuote): Promise<Quote> {
  const [quote] = await db.insert(quotes).values(data).returning();
  return quote;
}

export async function updateQuote(id: string, data: Partial<InsertQuote>): Promise<Quote | null> {
  const [quote] = await db.update(quotes).set({ ...data, updatedAt: new Date() }).where(eq(quotes.id, id)).returning();
  return quote ?? null;
}

// ── Payments ─────────────────────────────────────────────────────────────────

export async function getPayments(filters?: { payerId?: string; payeeId?: string; maintenanceRequestId?: string }): Promise<Payment[]> {
  const conditions = [];
  if (filters?.payerId) conditions.push(eq(payments.payerId, filters.payerId));
  if (filters?.payeeId) conditions.push(eq(payments.payeeId, filters.payeeId));
  if (filters?.maintenanceRequestId) conditions.push(eq(payments.maintenanceRequestId, filters.maintenanceRequestId));
  let query = db.select().from(payments).$dynamic();
  if (conditions.length > 0) query = query.where(and(...conditions));
  return query.orderBy(desc(payments.createdAt));
}

export async function getPayment(id: string): Promise<Payment | null> {
  const [payment] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  return payment ?? null;
}

export async function getPaymentByStripeId(stripePaymentId: string): Promise<Payment | null> {
  const [payment] = await db.select().from(payments).where(eq(payments.stripePaymentId, stripePaymentId)).limit(1);
  return payment ?? null;
}

export async function createPayment(data: InsertPayment): Promise<Payment> {
  const [payment] = await db.insert(payments).values(data).returning();
  return payment;
}

export async function updatePayment(id: string, data: Partial<InsertPayment>): Promise<Payment | null> {
  const [payment] = await db.update(payments).set({ ...data, updatedAt: new Date() }).where(eq(payments.id, id)).returning();
  return payment ?? null;
}

// ── Comments ─────────────────────────────────────────────────────────────────

export async function getComments(maintenanceRequestId: string): Promise<(Comment & { user: User })[]> {
  const rows = await db
    .select()
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.maintenanceRequestId, maintenanceRequestId))
    .orderBy(comments.createdAt);
  return rows.map(r => ({ ...r.comments, user: r.users }));
}

export async function createComment(data: InsertComment): Promise<Comment> {
  const [comment] = await db.insert(comments).values(data).returning();
  return comment;
}

// ── Attachments ───────────────────────────────────────────────────────────────

export async function getAttachments(parentType: string, parentId: string): Promise<Attachment[]> {
  return db.select().from(attachments).where(and(eq(attachments.parentType, parentType), eq(attachments.parentId, parentId)));
}

export async function createAttachment(data: InsertAttachment): Promise<Attachment> {
  const [attachment] = await db.insert(attachments).values(data).returning();
  return attachment;
}

export async function deleteAttachment(id: string): Promise<void> {
  await db.delete(attachments).where(eq(attachments.id, id));
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function getNotifications(userId: string): Promise<Notification[]> {
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
}

export async function createNotification(data: InsertNotification): Promise<Notification> {
  const [notification] = await db.insert(notifications).values(data).returning();
  return notification;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
}

// ── Activity Logs ─────────────────────────────────────────────────────────────

export async function createActivityLog(data: InsertActivityLog): Promise<ActivityLog> {
  const [log] = await db.insert(activityLogs).values(data).returning();
  return log;
}

export async function getActivityLogs(filters?: { userId?: string; action?: string; limit?: number }): Promise<ActivityLog[]> {
  let query = db.select().from(activityLogs).$dynamic();
  const conditions = [];
  if (filters?.userId) conditions.push(eq(activityLogs.userId, filters.userId));
  if (filters?.action) conditions.push(eq(activityLogs.action, filters.action as any));
  if (conditions.length > 0) query = query.where(and(...conditions));
  return query.orderBy(desc(activityLogs.createdAt)).limit(filters?.limit ?? 100);
}

// ── System Settings ───────────────────────────────────────────────────────────

export async function getSystemSettings(): Promise<SystemSetting[]> {
  return db.select().from(systemSettings).orderBy(systemSettings.key);
}

export async function getSystemSetting(key: string): Promise<SystemSetting | null> {
  const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
  return setting ?? null;
}

export async function upsertSystemSetting(data: InsertSystemSetting): Promise<SystemSetting> {
  const [setting] = await db
    .insert(systemSettings)
    .values(data)
    .onConflictDoUpdate({ target: systemSettings.key, set: { value: data.value, updatedAt: new Date() } })
    .returning();
  return setting;
}

// ── Failed Logins ─────────────────────────────────────────────────────────────

export async function getFailedLogins(resolved?: boolean): Promise<FailedLogin[]> {
  if (resolved !== undefined) {
    return db.select().from(failedLogins).where(eq(failedLogins.resolved, resolved)).orderBy(desc(failedLogins.createdAt));
  }
  return db.select().from(failedLogins).orderBy(desc(failedLogins.createdAt));
}

export async function createFailedLogin(data: InsertFailedLogin): Promise<FailedLogin> {
  const [fl] = await db.insert(failedLogins).values(data).returning();
  return fl;
}

export async function resolveFailedLogin(id: string): Promise<void> {
  await db.update(failedLogins).set({ resolved: true }).where(eq(failedLogins.id, id));
}

export async function resolveAllFailedLogins(email: string): Promise<void> {
  await db.update(failedLogins).set({ resolved: true }).where(eq(failedLogins.email, email));
}

// ── System Messages ───────────────────────────────────────────────────────────

export async function getSystemMessages(visibleOnly = false): Promise<SystemMessage[]> {
  let query = db.select().from(systemMessages).$dynamic();
  if (visibleOnly) query = query.where(eq(systemMessages.visible, true));
  return query.orderBy(desc(systemMessages.priority), desc(systemMessages.updatedAt));
}

export async function getSystemMessage(id: string): Promise<SystemMessage | null> {
  const [msg] = await db.select().from(systemMessages).where(eq(systemMessages.id, id)).limit(1);
  return msg ?? null;
}

export async function createSystemMessage(data: InsertSystemMessage): Promise<SystemMessage> {
  const [msg] = await db.insert(systemMessages).values(data).returning();
  return msg;
}

export async function updateSystemMessage(id: string, data: Partial<InsertSystemMessage>): Promise<SystemMessage | null> {
  const [msg] = await db.update(systemMessages).set({ ...data, updatedAt: new Date() }).where(eq(systemMessages.id, id)).returning();
  return msg ?? null;
}

export async function deleteSystemMessage(id: string): Promise<void> {
  await db.delete(systemMessages).where(eq(systemMessages.id, id));
}

// ── Admin Stats ───────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [activeUserCount] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.active, true));
  const [propertyCount] = await db.select({ count: sql<number>`count(*)` }).from(properties);
  const [reqCount] = await db.select({ count: sql<number>`count(*)` }).from(maintenanceRequests);
  const [openReqCount] = await db.select({ count: sql<number>`count(*)` }).from(maintenanceRequests)
    .where(sql`status IN ('submitted','assigned','in_progress')`);
  const [revenue] = await db.select({ total: sql<number>`COALESCE(SUM(amount::numeric),0)` }).from(payments).where(eq(payments.status, "completed"));

  return {
    totalUsers: Number(userCount.count),
    activeUsers: Number(activeUserCount.count),
    totalProperties: Number(propertyCount.count),
    totalMaintenanceRequests: Number(reqCount.count),
    openRequests: Number(openReqCount.count),
    totalRevenue: Number(revenue.total)
  };
}

// ── Matching Logic ────────────────────────────────────────────────────────────

/**
 * Returns contractors whose specialties include the given category,
 * sorted by rating desc. Used by both dispatch models.
 */
export async function getMatchingContractors(category: string): Promise<(Contractor & { user: User })[]> {
  const all = await db
    .select()
    .from(contractors)
    .innerJoin(users, eq(contractors.userId, users.id))
    .where(eq(users.active, true));

  const matched = all.filter(row =>
    row.contractors.specialties?.some(s =>
      s.toLowerCase() === category.toLowerCase() ||
      s.toLowerCase().includes(category.toLowerCase())
    )
  );

  return matched
    .map(row => ({ ...row.contractors, user: row.users }))
    .sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0));
}

// ── Ratings ───────────────────────────────────────────────────────────────────

export async function createRating(data: InsertRating): Promise<Rating> {
  const [rating] = await db.insert(ratings).values(data).returning();
  return rating;
}

export async function getRatingsByContractor(contractorId: string): Promise<(Rating & { fromUser: User })[]> {
  const rows = await db
    .select()
    .from(ratings)
    .innerJoin(users, eq(ratings.fromUserId, users.id))
    .where(eq(ratings.toContractorId, contractorId))
    .orderBy(desc(ratings.createdAt));
  return rows.map(r => ({ ...r.ratings, fromUser: r.users }));
}

export async function getRatingByRequest(maintenanceRequestId: string, fromUserId: string): Promise<Rating | null> {
  const [r] = await db.select().from(ratings)
    .where(and(eq(ratings.maintenanceRequestId, maintenanceRequestId), eq(ratings.fromUserId, fromUserId)))
    .limit(1);
  return r ?? null;
}

/** Recalculates and updates contractor.rating and contractor.totalReviews */
export async function recalculateContractorRating(contractorId: string): Promise<void> {
  const [agg] = await db
    .select({ avg: avg(ratings.score), count: sql<number>`count(*)` })
    .from(ratings)
    .where(eq(ratings.toContractorId, contractorId));

  await db.update(contractors).set({
    rating: agg.avg ? String(Number(agg.avg).toFixed(2)) : "0",
    totalReviews: Number(agg.count),
    updatedAt: new Date()
  }).where(eq(contractors.id, contractorId));
}

export async function getDashboardStats(ownerId: string) {
  const ownerProperties = await getProperties(ownerId);
  const propertyCount = ownerProperties.length;
  const propertyIds = ownerProperties.map(p => p.id);

  let unitIds: string[] = [];
  if (propertyIds.length > 0) {
    const ownerUnits = await db.select({ id: units.id }).from(units).where(inArray(units.propertyId, propertyIds));
    unitIds = ownerUnits.map(u => u.id);
  }

  const [activeLeasesCount] = await db.select({ count: sql<number>`count(*)` }).from(leases)
    .where(and(eq(leases.active, true), unitIds.length > 0 ? inArray(leases.unitId, unitIds) : sql`false`));

  const reqs = unitIds.length > 0
    ? await db.select().from(maintenanceRequests).where(inArray(maintenanceRequests.unitId, unitIds))
    : [];
  const pendingRequests = reqs.filter(r => ["submitted", "assigned", "in_progress"].includes(r.status)).length;

  const completedPayments = await db.select({ amount: payments.amount }).from(payments)
    .where(and(eq(payments.payeeId, ownerId), eq(payments.status, "completed")));
  const monthlyRevenue = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  // Monthly data for last 6 months
  const now = new Date();
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.toLocaleString("en", { month: "short" }) + " " + d.getFullYear();
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const monthReqs = reqs.filter(r => r.createdAt >= monthStart && r.createdAt <= monthEnd);
    const monthCompleted = monthReqs.filter(r => r.status === "completed" || r.status === "closed").length;
    monthlyData.push({ month, requests: monthReqs.length, completed: monthCompleted, revenue: 0 });
  }

  const categoryBreakdown: Record<string, number> = {};
  for (const req of reqs) {
    categoryBreakdown[req.category] = (categoryBreakdown[req.category] || 0) + 1;
  }

  return {
    properties: propertyCount,
    activeLeases: Number(activeLeasesCount?.count ?? 0),
    pendingRequests,
    monthlyRevenue,
    monthlyData,
    categoryBreakdown
  };
}
