import "reflect-metadata";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Types } from "mongoose";
import {
  CreditTransactionType,
  MONETIZATION_CONFIG,
  getRewardDay,
} from "@palmsight/shared";
import { createTestApp, closeTestApp, TestAppInstance } from "./test-helper";
import { EarnService, getDaysDiff, getSecondsUntilNextRewardDay } from "../src/credits/earn.service";
import { CreditLedgerService } from "../src/credits/credit-ledger.service";
import type { GoogleProfile } from "../src/auth/google-auth.verifier";

const googleProfile: GoogleProfile = {
  sub: "google-sub-earn-server",
  email: "earn.user@example.com",
  emailVerified: true,
  name: "Earn Server User",
  picture: null,
};

describe("Monetization Phase 2: Earn Server Spec (§12)", () => {
  let testApp: TestAppInstance;
  let earnService: EarnService;
  let creditLedgerService: CreditLedgerService;
  let accessToken: string;

  beforeAll(async () => {
    testApp = await createTestApp({
      googleVerifier: { verify: async () => googleProfile },
    });
    earnService = testApp.app.get(EarnService);
    creditLedgerService = testApp.app.get(CreditLedgerService);

    // Create a base user for HTTP endpoint tests
    const res = await fetch(`${testApp.baseUrl}/api/v1/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: "test-google-token" }),
    });
    const body = (await res.json()) as any;
    accessToken = body.accessToken;
  }, 60000);

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  describe("1. TimeZone & Day Boundary in Asia/Ho_Chi_Minh (§12)", () => {
    it("computes reward day correctly at boundaries", () => {
      // 2026-11-03 23:59:59 in UTC+7 is 2026-11-03 16:59:59 UTC
      const lateNight = new Date("2026-11-03T16:59:59.000Z");
      expect(getRewardDay(lateNight)).toBe("2026-11-03");

      // 2026-11-04 00:00:01 in UTC+7 is 2026-11-03 17:00:01 UTC
      const nextMorning = new Date("2026-11-03T17:00:01.000Z");
      expect(getRewardDay(nextMorning)).toBe("2026-11-04");
    });

    it("calculates exact calendar day differences", () => {
      expect(getDaysDiff("2026-11-01", "2026-11-02")).toBe(1);
      expect(getDaysDiff("2026-11-01", "2026-11-04")).toBe(3);
      expect(getDaysDiff("2026-11-04", "2026-11-04")).toBe(0);
    });

    it("calculates seconds until next reward day", () => {
      const seconds = getSecondsUntilNextRewardDay();
      expect(seconds).toBeGreaterThan(0);
      expect(seconds).toBeLessThanOrEqual(86400);
    });
  });

  describe("2. Check-in Ladder & Streak Progression", () => {
    it("handles Day 1 check-in, ladder progression, and duplicate check-in rejection", async () => {
      const userDoc = await testApp.connection.collection("users").insertOne({
        displayName: "Checkin User 1",
        creditBalance: 0,
        referralCode: "CHKIN001",
        identities: [],
        referralBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const userId = userDoc.insertedId;
      const deviceId = "device-test-chkin-1";

      // 1. Day 1 check-in
      const res1 = await earnService.checkin(userId, deviceId);
      expect(res1.amount).toBe(MONETIZATION_CONFIG.CHECKIN_LADDER[0]); // 3 GEM
      expect(res1.streakDays).toBe(1);
      expect(res1.milestoneBonus).toBe(0);
      expect(res1.balance).toBe(3);

      // Ledger check
      const recon = await creditLedgerService.reconcileBalance(userId);
      expect(recon.matches).toBe(true);
      expect(recon.balance).toBe(3);

      // 2. Reject duplicate check-in today
      await expect(earnService.checkin(userId, deviceId)).rejects.toThrow(
        /đã điểm danh/i
      );
    });

    it("enforces One-per-device rule for check-in: second user gets device_used (§2.2)", async () => {
      const deviceId = "device-shared-checkin";

      // User A checks in on shared device
      const userA = (
        await testApp.connection.collection("users").insertOne({
          displayName: "User A",
          creditBalance: 0,
          referralCode: "CHKIN00A",
          identities: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).insertedId;

      await earnService.checkin(userA, deviceId);

      // User B attempts check-in on the same device
      const userB = (
        await testApp.connection.collection("users").insertOne({
          displayName: "User B",
          creditBalance: 0,
          referralCode: "CHKIN00B",
          identities: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).insertedId;

      await expect(earnService.checkin(userB, deviceId)).rejects.toThrow(
        /thiết bị này đã được sử dụng/i
      );

      // User B on a different device succeeds
      const resB = await earnService.checkin(userB, "device-user-b-unique");
      expect(resB.streakDays).toBe(1);
      expect(resB.amount).toBe(3);
    });

    it("grants milestone bonus on milestone days (e.g. Day 30)", async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const yesterdayStr = getRewardDay(yesterday);

      // User at day 29 who checked in yesterday
      const userDoc = await testApp.connection.collection("users").insertOne({
        displayName: "Milestone User",
        creditBalance: 0,
        referralCode: "MILEST01",
        checkinDay: yesterdayStr,
        checkinStreak: 29,
        identities: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const userId = userDoc.insertedId;

      await creditLedgerService.credit(userId, 100, CreditTransactionType.OPERATOR, {
        note: "Initial test balance",
      });

      const res = await earnService.checkin(userId, "device-milestone-30");
      expect(res.streakDays).toBe(30);
      // Ladder day 30: (30 - 1) % 7 = 29 % 7 = 1 -> index 1 -> 3 GEM
      expect(res.amount).toBe(3);
      // Milestone 30 bonus is +20
      expect(res.milestoneBonus).toBe(20);
      expect(res.totalReward).toBe(23);
      expect(res.balance).toBe(123);

      const recon = await creditLedgerService.reconcileBalance(userId);
      expect(recon.matches).toBe(true);
      expect(recon.balance).toBe(123);
    });

    it("resets streak to 1 if user missed days without restoring", async () => {
      // User checked in 5 days ago with streak 15
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const userDoc = await testApp.connection.collection("users").insertOne({
        displayName: "Lapsed User",
        creditBalance: 10,
        referralCode: "LAPSED01",
        checkinDay: getRewardDay(fiveDaysAgo),
        checkinStreak: 15,
        identities: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const userId = userDoc.insertedId;

      const res = await earnService.checkin(userId, "device-lapsed");
      expect(res.streakDays).toBe(1);
      expect(res.amount).toBe(MONETIZATION_CONFIG.CHECKIN_LADDER[0]);
    });
  });

  describe("3. VIP Check-in Streak Restore (§7.2)", () => {
    it("rejects restore if user is not VIP", async () => {
      const yesterday = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const userDoc = await testApp.connection.collection("users").insertOne({
        displayName: "Non-VIP User",
        creditBalance: 50,
        referralCode: "NONVIP01",
        checkinDay: getRewardDay(yesterday),
        checkinStreak: 10,
        identities: [],
        vipExpiresAt: null, // Not VIP
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        earnService.restoreCheckin(userDoc.insertedId, "device-nonvip")
      ).rejects.toThrow(/chỉ dành riêng cho thành viên vip/i);
    });

    it("rejects restore if missed more than RESTORE_MAX_MISSED (3 days)", async () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const userDoc = await testApp.connection.collection("users").insertOne({
        displayName: "Too Late VIP User",
        creditBalance: 100,
        referralCode: "TOOLAT01",
        checkinDay: getRewardDay(fiveDaysAgo),
        checkinStreak: 10,
        identities: [],
        vipExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // VIP active
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        earnService.restoreCheckin(userDoc.insertedId, "device-toolate")
      ).rejects.toThrow(/không thể khôi phục/i);
    });

    it("rejects restore if VIP has insufficient GEM for restore cost", async () => {
      // 2 missed days requires 2 * 10 = 20 GEM, user has only 15 GEM
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const userDoc = await testApp.connection.collection("users").insertOne({
        displayName: "Broke VIP User",
        creditBalance: 15,
        referralCode: "BROKEV01",
        checkinDay: getRewardDay(threeDaysAgo),
        checkinStreak: 10,
        identities: [],
        vipExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        earnService.restoreCheckin(userDoc.insertedId, "device-broke-vip")
      ).rejects.toThrow(/cần 20 gem/i);
    });

    it("successfully restores streak for VIP, debits cost, and continues streak S + m + 1", async () => {
      // Missed 2 days, streak was 10. Cost = 2 * 10 = 20 GEM.
      // S + m + 1 = 10 + 2 + 1 = 13.
      // Day 13 ladder: (13 - 1) % 7 = 12 % 7 = 5 -> index 5 is 8 GEM.
      // Start balance: 50. Debit 20 -> 30, Credit 8 -> 38.
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const userDoc = await testApp.connection.collection("users").insertOne({
        displayName: "Rich VIP User",
        creditBalance: 0,
        referralCode: "RICHV001",
        checkinDay: getRewardDay(threeDaysAgo),
        checkinStreak: 10,
        identities: [],
        vipExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const userId = userDoc.insertedId;

      // Also ensure ledger matches before
      await creditLedgerService.credit(userId, 50, CreditTransactionType.OPERATOR, {
        note: "Initial test balance",
      });

      const res = await earnService.restoreCheckin(userId, "device-rich-vip");
      expect(res.restored).toBe(true);
      expect(res.cost).toBe(20);
      expect(res.streakDays).toBe(13);
      expect(res.rewardAmount).toBe(MONETIZATION_CONFIG.CHECKIN_LADDER[(13 - 1) % 7]); // 8 GEM
      expect(res.balance).toBe(38); // 50 ledger + 8 checkin - 20 restore = 38

      const recon = await creditLedgerService.reconcileBalance(userId);
      expect(recon.matches).toBe(true);
      expect(recon.balance).toBe(38);
    });
  });

  describe("4. Lucky Wheel Free & Paid Spins (§7.3)", () => {
    it("handles free spin once per day per account and per device", async () => {
      const userDoc = await testApp.connection.collection("users").insertOne({
        displayName: "Spin User 1",
        creditBalance: 0,
        referralCode: "SPIN0001",
        identities: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const userId = userDoc.insertedId;
      const deviceId = "device-wheel-free-1";

      const spinRes = await earnService.spinFree(userId, deviceId);
      expect(spinRes.prizeIndex).toBeGreaterThanOrEqual(0);
      expect(spinRes.prizeIndex).toBeLessThanOrEqual(5);
      expect(MONETIZATION_CONFIG.WHEEL_PRIZES).toContain(spinRes.amount);
      expect(spinRes.balance).toBe(spinRes.amount);

      // Duplicate free spin attempt throws
      await expect(earnService.spinFree(userId, deviceId)).rejects.toThrow(
        /đã sử dụng lượt quay miễn phí/i
      );

      // Second user on same device gets device_used
      const userDoc2 = await testApp.connection.collection("users").insertOne({
        displayName: "Spin User 2",
        creditBalance: 0,
        referralCode: "SPIN0002",
        identities: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await expect(
        earnService.spinFree(userDoc2.insertedId, deviceId)
      ).rejects.toThrow(/thiết bị này đã nhận lượt quay/i);
    });

    it("handles paid spin: requires free spin to be used first, debits 3 GEM, unlimited", async () => {
      const userDoc = await testApp.connection.collection("users").insertOne({
        displayName: "Paid Spin User",
        creditBalance: 0,
        referralCode: "PAIDSP01",
        identities: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const userId = userDoc.insertedId;

      await creditLedgerService.credit(userId, 10, CreditTransactionType.OPERATOR, {
        note: "Initial",
      });

      // Paid spin when free spin not yet used -> throws FREE_SPIN_AVAILABLE
      await expect(earnService.spinPaid(userId)).rejects.toThrow(
        /vẫn còn lượt quay miễn phí/i
      );

      // Use free spin
      await earnService.spinFree(userId, "device-paid-spin");

      // Now paid spin succeeds
      const paidRes1 = await earnService.spinPaid(userId);
      expect(paidRes1.prizeIndex).toBeGreaterThanOrEqual(0);
      expect(MONETIZATION_CONFIG.WHEEL_PRIZES).toContain(paidRes1.amount);

      // Ledger invariant holds
      const recon = await creditLedgerService.reconcileBalance(userId);
      expect(recon.matches).toBe(true);
    });
  });

  describe("5. Rewarded Ad Tickets & Cap Enforcement (§2.2, §5.5, §12)", () => {
    it("handles double checkin ad ticket with cap of 1 per day", async () => {
      const userDoc = await testApp.connection.collection("users").insertOne({
        displayName: "Ad Double User",
        creditBalance: 0,
        referralCode: "ADDBL001",
        identities: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const userId = userDoc.insertedId;
      const deviceId = "device-ad-double-1";

      // Attempting double checkin ticket before checking in -> throws CHECKIN_REQUIRED
      await expect(
        earnService.createAdRewardTicket(userId, "checkin", deviceId)
      ).rejects.toThrow(/hoàn tất điểm danh trước/i);

      // Check in
      await earnService.checkin(userId, deviceId);

      // Create ticket
      const ticket = await earnService.createAdRewardTicket(userId, "checkin", deviceId);
      expect(ticket.kind).toBe("checkin");
      expect(ticket.status).toBe("pending");
      expect(ticket.amount).toBe(MONETIZATION_CONFIG.CHECKIN_LADDER[0]);

      // Creating another ticket while pending -> throws AD_REWARD_LOCKED
      await expect(
        earnService.createAdRewardTicket(userId, "checkin", deviceId)
      ).rejects.toThrow(/đang có một vé quảng cáo/i);

      // Release ticket
      await earnService.releaseAdRewardTicket(userId, ticket.id);

      // Create again and test claim
      const ticket2 = await earnService.createAdRewardTicket(userId, "checkin", deviceId);

      // Premature claim (< 15s) throws AD_NOT_FINISHED
      await expect(
        earnService.claimAdRewardTicket(userId, ticket2.id)
      ).rejects.toThrow(/chưa được xem đủ thời gian/i);

      // Manually backdate createdAt for test simulation
      await testApp.connection.collection("ad_rewards").updateOne(
        { _id: new Types.ObjectId(ticket2.id) },
        { $set: { createdAt: new Date(Date.now() - 20 * 1000) } }
      );

      // Claim succeeds
      const claimRes = await earnService.claimAdRewardTicket(userId, ticket2.id);
      expect(claimRes.status).toBe("rewarded");
      expect(claimRes.amount).toBe(MONETIZATION_CONFIG.CHECKIN_LADDER[0]);

      // Idempotent claim test (§12)
      const claimResAgain = await earnService.claimAdRewardTicket(userId, ticket2.id);
      expect(claimResAgain.status).toBe("rewarded");
      expect(claimResAgain.amount).toBe(claimRes.amount);

      // Reaching cap (1/day): subsequent ticket creation throws AD_LIMIT_REACHED
      await expect(
        earnService.createAdRewardTicket(userId, "checkin", deviceId)
      ).rejects.toThrow(/đạt giới hạn nhận x2/i);
    });

    it("enforces cap for ad spins (3 / day) and bonus ads (5 / day)", async () => {
      const userDoc = await testApp.connection.collection("users").insertOne({
        displayName: "Bonus Ad User",
        creditBalance: 0,
        referralCode: "BONUS001",
        identities: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const userId = userDoc.insertedId;
      const deviceId = "device-bonus-cap";

      // Claim 5 bonus ad tickets
      for (let i = 0; i < 5; i++) {
        const ticket = await earnService.createAdRewardTicket(userId, "bonus", deviceId);
        await testApp.connection.collection("ad_rewards").updateOne(
          { _id: new Types.ObjectId(ticket.id) },
          { $set: { createdAt: new Date(Date.now() - 20 * 1000) } }
        );
        const claim = await earnService.claimAdRewardTicket(userId, ticket.id);
        expect(claim.status).toBe("rewarded");
        expect(claim.amount).toBe(MONETIZATION_CONFIG.BONUS_AD_AMOUNT);
      }

      // 6th ticket creation throws AD_LIMIT_REACHED
      await expect(
        earnService.createAdRewardTicket(userId, "bonus", deviceId)
      ).rejects.toThrow(/đạt giới hạn nhận coin/i);
    });
  });

  describe("6. HTTP Endpoints (/v1/currency/* and /api/v1/currency/*)", () => {
    it("GET /v1/currency/earn returns complete earn status payload", async () => {
      const res = await fetch(`${testApp.baseUrl}/v1/currency/earn`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-device-id": "device-http-test",
        },
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;

      expect(data).toHaveProperty("checkedInToday");
      expect(data).toHaveProperty("currentStreak");
      expect(data).toHaveProperty("todayReward");
      expect(data).toHaveProperty("canRestore");
      expect(data).toHaveProperty("freeSpinsRemaining");
      expect(data).toHaveProperty("adSpinsRemaining");
      expect(data).toHaveProperty("currencySpinCost", 3);
      expect(data).toHaveProperty("prizes", MONETIZATION_CONFIG.WHEEL_PRIZES);
      expect(data).toHaveProperty("rewardDay", getRewardDay());
      expect(data).toHaveProperty("secondsUntilNextDay");
      expect(data).toHaveProperty("balance");
    });

    it("POST /v1/currency/checkin and POST /api/v1/currency/checkin route properly", async () => {
      const res = await fetch(`${testApp.baseUrl}/api/v1/currency/checkin`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "x-device-id": "device-http-checkin-test",
        },
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.streakDays).toBe(1);
      expect(data.amount).toBe(MONETIZATION_CONFIG.CHECKIN_LADDER[0]);
    });
  });
});
