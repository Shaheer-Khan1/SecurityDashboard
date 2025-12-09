import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table (existing)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Camera Types
export const CameraStatusEnum = z.enum(["online", "offline", "recording", "error"]);
export type CameraStatus = z.infer<typeof CameraStatusEnum>;

export const cameraSchema = z.object({
  name: z.string(),
  active: z.boolean(),
  model: z.string().optional(),
  deviceType: z.string().optional(),
  connectionAddress: z.string().optional(),
  connectionPort: z.number().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  memo: z.string().optional(),
  group: z.string().optional(),
  status: CameraStatusEnum.optional(),
  working: z.boolean().optional(),
  recordingHours: z.number().optional(),
});

export type Camera = z.infer<typeof cameraSchema>;

export const cameraGroupSchema = z.object({
  name: z.string(),
  cameras: z.array(z.string()),
  active: z.boolean(),
});

export type CameraGroup = z.infer<typeof cameraGroupSchema>;

// Analytics Types
export const EventTypeEnum = z.enum([
  "PRESENCE", "ENTER", "EXIT", "APPEAR", "DISAPPEAR", "STOPPED", "LOITERING",
  "DIRECTION", "SPEED", "TAILGATING", "COUNTING_LINE_A", "COUNTING_LINE_B",
  "TAMPERING", "ABANDONED_OBJECT", "REMOVED_OBJECT", "SMOKE", "FIRE",
  "FACE_DETECTION", "FACE_RECOGNITION", "VEHICLE_DETECTION", "MOTION",
  "INTRUSION", "LINE_CROSSING", "OBJECT_LEFT", "OBJECT_REMOVED"
]);
export type EventType = z.infer<typeof EventTypeEnum>;

export const analyticsEventSchema = z.object({
  id: z.string(),
  recordCode: z.string(),
  camera: z.string(),
  zone: z.string().optional(),
  eventType: EventTypeEnum,
  objectClass: z.string().optional(),
  ruleName: z.string().optional(),
  timestamp: z.string(),
  confidence: z.number().optional(),
});

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;

export const analyticsConfigSchema = z.object({
  name: z.string(),
  active: z.boolean(),
  camera: z.string(),
  events: z.array(EventTypeEnum),
  working: z.boolean().optional(),
  status: z.string().optional(),
  statusMessage: z.string().optional(),
});

export type AnalyticsConfig = z.infer<typeof analyticsConfigSchema>;

export const analyticsCounterSchema = z.object({
  id: z.string(),
  name: z.string(),
  configuration: z.string(),
  value: z.number(),
  lastReset: z.string().optional(),
});

export type AnalyticsCounter = z.infer<typeof analyticsCounterSchema>;

// Audit Types
export const AuditCategoryEnum = z.enum(["USER_ACTION", "SERVER_CONNECTION", "SYSTEM", "SECURITY"]);
export type AuditCategory = z.infer<typeof AuditCategoryEnum>;

export const auditLogSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  category: AuditCategoryEnum,
  action: z.string(),
  user: z.string().optional(),
  details: z.string().optional(),
  ipAddress: z.string().optional(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;

// Bookmark Types
export const BookmarkColorEnum = z.enum(["red", "orange", "yellow", "green", "blue", "purple", "gray"]);
export type BookmarkColor = z.infer<typeof BookmarkColorEnum>;

export const bookmarkSchema = z.object({
  id: z.string(),
  title: z.string(),
  color: BookmarkColorEnum,
  startDate: z.string(),
  startTime: z.string(),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  cameras: z.array(z.string()),
  remarks: z.string().optional(),
  createdAt: z.string(),
});

export type Bookmark = z.infer<typeof bookmarkSchema>;

export const insertBookmarkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  color: BookmarkColorEnum,
  startDate: z.string(),
  startTime: z.string(),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  cameras: z.array(z.string()).min(1, "At least one camera is required"),
  remarks: z.string().optional(),
});

export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;

// Search Params Types
export const analyticsSearchParamsSchema = z.object({
  startDate: z.string(),
  startTime: z.string().optional(),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  cameras: z.array(z.string()).optional(),
  eventTypes: z.array(EventTypeEnum).optional(),
  zones: z.array(z.string()).optional(),
  objectClasses: z.array(z.string()).optional(),
  ruleNames: z.array(z.string()).optional(),
  orderBy: z.string().optional(),
});

export type AnalyticsSearchParams = z.infer<typeof analyticsSearchParamsSchema>;

export const auditSearchParamsSchema = z.object({
  startDate: z.string(),
  startTime: z.string().optional(),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  category: AuditCategoryEnum.optional(),
  keyword: z.string().optional(),
  exactKeyword: z.boolean().optional(),
});

export type AuditSearchParams = z.infer<typeof auditSearchParamsSchema>;

export const bookmarkSearchParamsSchema = z.object({
  keyword: z.string().optional(),
  keywordExact: z.boolean().optional(),
  searchRemarks: z.boolean().optional(),
  colors: z.array(BookmarkColorEnum).optional(),
  startDate: z.string().optional(),
  startTime: z.string().optional(),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  cameras: z.array(z.string()).optional(),
});

export type BookmarkSearchParams = z.infer<typeof bookmarkSearchParamsSchema>;

// Dashboard Stats
export const dashboardStatsSchema = z.object({
  totalCameras: z.number(),
  activeCameras: z.number(),
  recordingCameras: z.number(),
  offlineCameras: z.number(),
  totalEvents: z.number(),
  criticalEvents: z.number(),
  totalStorage: z.string(),
  usedStorage: z.string(),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

// System Status
export const systemStatusSchema = z.object({
  serverStatus: z.enum(["online", "offline", "degraded"]),
  cpuUsage: z.number(),
  memoryUsage: z.number(),
  diskUsage: z.number(),
  uptime: z.string(),
  lastSync: z.string(),
});

export type SystemStatus = z.infer<typeof systemStatusSchema>;
