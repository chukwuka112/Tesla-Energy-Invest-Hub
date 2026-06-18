import {
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { profilesTable } from "./profiles";

export const securityQuestionsTable = pgTable("security_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id").notNull().references(() => profilesTable.id, { onDelete: "cascade" }),
  question_text: text("question_text").notNull(),
  answer_hash: text("answer_hash").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSecurityQuestionSchema = createInsertSchema(securityQuestionsTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type InsertSecurityQuestion = z.infer<typeof insertSecurityQuestionSchema>;
export type SecurityQuestion = typeof securityQuestionsTable.$inferSelect;
