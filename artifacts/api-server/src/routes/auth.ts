import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  profilesTable,
  otpVerificationsTable,
  notificationsTable,
  referralsTable,
} from "@workspace/db";
import {
  generateToken,
  hashPassword,
  comparePassword,
  generateOTP,
  generateReferralCode,
  generateUUID,
  requireAuth,
  type AuthenticatedRequest,
} from "../lib/auth";
import { sendEmail, otpEmailHtml, passwordResetEmailHtml } from "../lib/email";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function formatUser(user: typeof profilesTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    balance: parseFloat(user.balance),
    total_earnings: parseFloat(user.total_earnings),
    total_deposits: parseFloat(user.total_deposits),
    total_withdrawals: parseFloat(user.total_withdrawals),
    referral_earnings: parseFloat(user.referral_earnings),
    referral_code: user.referral_code,
    role: user.role,
    is_active: user.is_active,
    email_verified: user.email_verified,
    avatar_url: user.avatar_url,
    created_at: user.created_at.toISOString(),
  };
}

router.post("/auth/register", async (req: Request, res: Response): Promise<void> => {
  const { full_name, email, password, referral_code } = req.body;
  if (!full_name || !email || !password) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  const existing = await db.select().from(profilesTable).where(eq(profilesTable.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await db.delete(otpVerificationsTable).where(
    and(eq(otpVerificationsTable.email, email.toLowerCase()), eq(otpVerificationsTable.type, "register"))
  );
  await db.insert(otpVerificationsTable).values({
    id: generateUUID(),
    email: email.toLowerCase(),
    otp,
    type: "register",
    expires_at: expiresAt,
    is_used: false,
    attempts: 0,
  });
  const stored = { full_name, email: email.toLowerCase(), password, referral_code: referral_code || "" };
  await db.delete(otpVerificationsTable).where(
    and(eq(otpVerificationsTable.email, email.toLowerCase()), eq(otpVerificationsTable.type, "register_pending"))
  );
  await db.insert(otpVerificationsTable).values({
    id: generateUUID(),
    email: email.toLowerCase(),
    otp: JSON.stringify(stored),
    type: "register_pending",
    expires_at: new Date(Date.now() + 30 * 60 * 1000),
    is_used: false,
    attempts: 0,
  });
  await sendEmail({ to: email, subject: "Verify your Tesla Invest account", html: otpEmailHtml(full_name, otp, 5) });
  res.json({ message: "OTP sent to your email" });
});

router.post("/auth/verify-otp", async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    res.status(400).json({ error: "Email and OTP required" });
    return;
  }
  const [otpRecord] = await db.select().from(otpVerificationsTable).where(
    and(
      eq(otpVerificationsTable.email, email.toLowerCase()),
      eq(otpVerificationsTable.type, "register"),
      eq(otpVerificationsTable.is_used, false),
      gt(otpVerificationsTable.expires_at, new Date())
    )
  ).limit(1);
  if (!otpRecord || otpRecord.otp !== otp.trim()) {
    res.status(400).json({ error: "Invalid or expired OTP" });
    return;
  }
  const [pendingRecord] = await db.select().from(otpVerificationsTable).where(
    and(eq(otpVerificationsTable.email, email.toLowerCase()), eq(otpVerificationsTable.type, "register_pending"))
  ).limit(1);
  if (!pendingRecord) {
    res.status(400).json({ error: "Registration session expired" });
    return;
  }
  const stored = JSON.parse(pendingRecord.otp) as { full_name: string; email: string; password: string; referral_code: string };
  const passwordHash = await hashPassword(stored.password);
  const referralCode = generateReferralCode();
  const userId = generateUUID();
  let referredBy: string | null = null;
  if (stored.referral_code) {
    const [referrer] = await db.select().from(profilesTable).where(eq(profilesTable.referral_code, stored.referral_code)).limit(1);
    if (referrer) referredBy = referrer.id;
  }
  await db.insert(profilesTable).values({
    id: userId,
    email: stored.email,
    password_hash: passwordHash,
    full_name: stored.full_name,
    referral_code: referralCode,
    referred_by: referredBy,
    role: "user",
    balance: "0",
    total_earnings: "0",
    total_deposits: "0",
    total_withdrawals: "0",
    referral_earnings: "0",
    is_active: true,
    email_verified: true,
    verified_at: new Date(),
    otp_resend_count: 0,
  });
  if (referredBy) {
    await db.insert(referralsTable).values({ id: generateUUID(), referrer_id: referredBy, referred_id: userId, level: 1, commission_rate: "5.00", total_earned: "0" });
    const [l1Referrer] = await db.select().from(profilesTable).where(eq(profilesTable.id, referredBy)).limit(1);
    if (l1Referrer?.referred_by) {
      await db.insert(referralsTable).values({ id: generateUUID(), referrer_id: l1Referrer.referred_by, referred_id: userId, level: 2, commission_rate: "2.00", total_earned: "0" });
      const [l2Referrer] = await db.select().from(profilesTable).where(eq(profilesTable.id, l1Referrer.referred_by)).limit(1);
      if (l2Referrer?.referred_by) {
        await db.insert(referralsTable).values({ id: generateUUID(), referrer_id: l2Referrer.referred_by, referred_id: userId, level: 3, commission_rate: "1.00", total_earned: "0" });
      }
    }
  }
  await db.update(otpVerificationsTable).set({ is_used: true }).where(eq(otpVerificationsTable.id, otpRecord.id));
  await db.delete(otpVerificationsTable).where(eq(otpVerificationsTable.id, pendingRecord.id));
  await db.insert(notificationsTable).values({ id: generateUUID(), user_id: userId, type: "welcome", title: "Welcome to Tesla Invest!", message: "Your account has been created successfully. Start investing today.", is_read: false });
  const [user] = await db.select().from(profilesTable).where(eq(profilesTable.id, userId)).limit(1);
  const token = generateToken({ userId, email: stored.email, role: "user" });
  res.json({ token, user: formatUser(user) });
});

router.post("/auth/resend-otp", async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email) { res.status(400).json({ error: "Email required" }); return; }
  const [pending] = await db.select().from(otpVerificationsTable).where(
    and(eq(otpVerificationsTable.email, email.toLowerCase()), eq(otpVerificationsTable.type, "register_pending"))
  ).limit(1);
  if (!pending) { res.status(400).json({ error: "No pending registration found" }); return; }
  const stored = JSON.parse(pending.otp) as { full_name: string };
  if (pending.attempts >= 3) { res.status(400).json({ error: "Max resend attempts reached" }); return; }
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await db.delete(otpVerificationsTable).where(
    and(eq(otpVerificationsTable.email, email.toLowerCase()), eq(otpVerificationsTable.type, "register"))
  );
  await db.insert(otpVerificationsTable).values({ id: generateUUID(), email: email.toLowerCase(), otp, type: "register", expires_at: expiresAt, is_used: false, attempts: 0 });
  await db.update(otpVerificationsTable).set({ attempts: pending.attempts + 1 }).where(eq(otpVerificationsTable.id, pending.id));
  await sendEmail({ to: email, subject: "Your Tesla Invest verification code", html: otpEmailHtml(stored.full_name, otp, 5) });
  res.json({ message: "OTP resent" });
});

router.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400).json({ error: "Email and password required" }); return; }
  const [user] = await db.select().from(profilesTable).where(eq(profilesTable.email, email.toLowerCase())).limit(1);
  if (!user) { res.status(401).json({ error: "Invalid email or password" }); return; }
  if (!user.email_verified) { res.status(401).json({ error: "Please verify your email first" }); return; }
  if (!user.is_active) { res.status(401).json({ error: "Account suspended. Contact support." }); return; }
  const valid = await comparePassword(password, user.password_hash);
  if (!valid) { res.status(401).json({ error: "Invalid email or password" }); return; }
  const token = generateToken({ userId: user.id, email: user.email, role: user.role });
  req.log.info({ userId: user.id }, "User logged in");
  res.json({ token, user: formatUser(user) });
});

router.post("/auth/logout", async (_req: Request, res: Response): Promise<void> => {
  res.json({ message: "Logged out successfully" });
});

router.post("/auth/forgot-password", async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email) { res.status(400).json({ error: "Email required" }); return; }
  const [user] = await db.select().from(profilesTable).where(eq(profilesTable.email, email.toLowerCase())).limit(1);
  if (!user) { res.json({ message: "If this email exists, a reset code was sent" }); return; }
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await db.delete(otpVerificationsTable).where(and(eq(otpVerificationsTable.email, email.toLowerCase()), eq(otpVerificationsTable.type, "reset")));
  await db.insert(otpVerificationsTable).values({ id: generateUUID(), email: email.toLowerCase(), otp, type: "reset", expires_at: expiresAt, is_used: false, attempts: 0 });
  await sendEmail({ to: email, subject: "Tesla Invest Password Reset", html: passwordResetEmailHtml(user.full_name, otp) });
  res.json({ message: "Reset code sent to your email" });
});

router.post("/auth/reset-password", async (req: Request, res: Response): Promise<void> => {
  const { email, otp, new_password } = req.body;
  if (!email || !otp || !new_password) { res.status(400).json({ error: "All fields required" }); return; }
  if (new_password.length < 8) { res.status(400).json({ error: "Password must be at least 8 characters" }); return; }
  const [otpRecord] = await db.select().from(otpVerificationsTable).where(
    and(eq(otpVerificationsTable.email, email.toLowerCase()), eq(otpVerificationsTable.type, "reset"), eq(otpVerificationsTable.is_used, false), gt(otpVerificationsTable.expires_at, new Date()))
  ).limit(1);
  if (!otpRecord || otpRecord.otp !== otp.trim()) { res.status(400).json({ error: "Invalid or expired reset code" }); return; }
  const passwordHash = await hashPassword(new_password);
  await db.update(profilesTable).set({ password_hash: passwordHash, updated_at: new Date() }).where(eq(profilesTable.email, email.toLowerCase()));
  await db.update(otpVerificationsTable).set({ is_used: true }).where(eq(otpVerificationsTable.id, otpRecord.id));
  res.json({ message: "Password reset successfully" });
});

router.get("/auth/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const [user] = await db.select().from(profilesTable).where(eq(profilesTable.id, authReq.user!.userId)).limit(1);
  if (!user) { res.status(401).json({ error: "User not found" }); return; }
  res.json(formatUser(user));
});

export { formatUser };
export default router;
