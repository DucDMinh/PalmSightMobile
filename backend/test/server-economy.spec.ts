import "reflect-metadata";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Types } from "mongoose";
import {
  CreditTransactionType,
  MONETIZATION_CONFIG,
} from "@palmsight/shared";
import { createTestApp, closeTestApp, TestAppInstance } from "./test-helper";
import { CreditLedgerService } from "../src/credits/credit-ledger.service";
import type { GoogleProfile } from "../src/auth/google-auth.verifier";

const googleProfile: GoogleProfile = {
  sub: "google-sub-economy",
  email: "economy.user@example.com",
  emailVerified: true,
  name: "Economy User",
  picture: null,
};

describe("Monetization Phase 1: Server Economy Spec (§12)", () => {
  let testApp: TestAppInstance;
  let creditLedgerService: CreditLedgerService;
  let accessToken: string;
  let testUserId: Types.ObjectId;

  beforeAll(async () => {
    testApp = await createTestApp({
      googleVerifier: { verify: async () => googleProfile },
    });
    creditLedgerService = testApp.app.get(CreditLedgerService);

    // Create a base user for HTTP endpoint tests
    const res = await fetch(`${testApp.baseUrl}/api/v1/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: "test-google-token" }),
    });
    const body = (await res.json()) as any;
    accessToken = body.accessToken;
    testUserId = new Types.ObjectId(body.user.id);
  }, 60000);

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  describe("1. Ledger, Credit/Debit, and Balance Invariant", () => {
    it("satisfies: Balance always equals ledger sum across credit, debit, and refund", async () => {
      const userDoc = await testApp.connection.collection("users").insertOne({
        displayName: "Ledger User",
        creditBalance: 0,
        referralCode: "LEDGER01",
        identities: [],
        referralBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const userId = userDoc.insertedId;

      // 1. Initial state: balance = 0, sum = 0
      let recon = await creditLedgerService.reconcileBalance(userId);
      expect(recon.matches).toBe(true);
      expect(recon.balance).toBe(0);
      expect(recon.ledgerSum).toBe(0);

      // 2. Credit starter +5
      const credit1 = await creditLedgerService.credit(
        userId,
        5,
        CreditTransactionType.STARTER,
        { note: "Initial starter" }
      );
      expect(credit1.balance).toBe(5);
      expect(credit1.transaction.amount).toBe(5);
      expect(credit1.transaction.balanceAfter).toBe(5);

      recon = await creditLedgerService.reconcileBalance(userId);
      expect(recon.matches).toBe(true);
      expect(recon.balance).toBe(5);
      expect(recon.ledgerSum).toBe(5);

      // 3. Credit admin/operator +20
      const credit2 = await creditLedgerService.credit(
        userId,
        20,
        CreditTransactionType.OPERATOR,
        { note: "Admin adjustment" }
      );
      expect(credit2.balance).toBe(25);
      recon = await creditLedgerService.reconcileBalance(userId);
      expect(recon.matches).toBe(true);
      expect(recon.balance).toBe(25);
      expect(recon.ledgerSum).toBe(25);

      // 4. Debit single reading -5
      const readingId = new Types.ObjectId();
      const debit1 = await creditLedgerService.debit(
        userId,
        5,
        CreditTransactionType.SINGLE,
        { readingId, note: "Core action reading" }
      );
      expect(debit1.balance).toBe(20);
      expect(debit1.transaction.amount).toBe(-5);
      expect(debit1.transaction.balanceAfter).toBe(20);

      recon = await creditLedgerService.reconcileBalance(userId);
      expect(recon.matches).toBe(true);
      expect(recon.balance).toBe(20);
      expect(recon.ledgerSum).toBe(20);

      // 5. Refund reading +5
      const refund1 = await creditLedgerService.refund(
        userId,
        5,
        CreditTransactionType.REFUND,
        { readingId, note: "Reading failure refund" }
      );
      expect(refund1.balance).toBe(25);
      expect(refund1.transaction.amount).toBe(5);
      expect(refund1.transaction.balanceAfter).toBe(25);

      recon = await creditLedgerService.reconcileBalance(userId);
      expect(recon.matches).toBe(true);
      expect(recon.balance).toBe(25);
      expect(recon.ledgerSum).toBe(25);
    });

    it("satisfies: Concurrent debits never go negative", async () => {
      // Create user with exactly 5 currency
      const userDoc = await testApp.connection.collection("users").insertOne({
        displayName: "Concurrency User",
        creditBalance: 5,
        referralCode: "CONCUR01",
        identities: [],
        referralBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const userId = userDoc.insertedId;

      // Seed initial ledger transaction so balance matches ledger sum
      await testApp.connection.collection("credit_transactions").insertOne({
        userId,
        amount: 5,
        type: CreditTransactionType.STARTER,
        balanceAfter: 5,
        createdAt: new Date(),
      });

      // Fire 20 simultaneous, concurrent debits of 1 currency each
      const concurrentTasks = Array.from({ length: 20 }, (_, i) =>
        creditLedgerService.debit(userId, 1, CreditTransactionType.SINGLE, {
          note: `Concurrent debit #${i}`,
        })
      );

      const results = await Promise.allSettled(concurrentTasks);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      // Exactly 5 debits must succeed, exactly 15 must be rejected
      expect(fulfilled.length).toBe(5);
      expect(rejected.length).toBe(15);

      // Verify final user balance is strictly 0 (never negative!)
      const finalUser = await testApp.connection
        .collection("users")
        .findOne({ _id: userId });
      expect(finalUser?.creditBalance).toBe(0);

      // Verify all ledger entries match
      const recon = await creditLedgerService.reconcileBalance(userId);
      expect(recon.matches).toBe(true);
      expect(recon.balance).toBe(0);
      expect(recon.ledgerSum).toBe(0);
    });

    it("rejects debit with 402 INSUFFICIENT_CREDITS when balance is 0 and does not write ledger", async () => {
      const brokeUserDoc = await testApp.connection
        .collection("users")
        .insertOne({
          displayName: "Zero Balance User",
          creditBalance: 0,
          referralCode: "ZEROBAL1",
          identities: [],
          referralBlocked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      const userId = brokeUserDoc.insertedId;

      await expect(
        creditLedgerService.debit(userId, 1, CreditTransactionType.SINGLE)
      ).rejects.toThrow();

      // Check no transactions written
      const txCount = await testApp.connection
        .collection("credit_transactions")
        .countDocuments({ userId });
      expect(txCount).toBe(0);

      const recon = await creditLedgerService.reconcileBalance(userId);
      expect(recon.matches).toBe(true);
      expect(recon.balance).toBe(0);
      expect(recon.ledgerSum).toBe(0);
    });
  });

  describe("2. Starter Grant & Physical Device Rules (§7.1, §10)", () => {
    it("grants starter grant once per account and per physical device", async () => {
      const user1Doc = await testApp.connection.collection("users").insertOne({
        displayName: "Starter User 1",
        creditBalance: 0,
        referralCode: "START001",
        identities: [],
        referralBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const user1Id = user1Doc.insertedId;
      const deviceId = "unique_device_uuid_001";
      const ip = "192.168.1.100";

      // First claim on device -> succeeds
      const claim1 = await creditLedgerService.claimStarterGrant(user1Id, {
        deviceId,
        ip,
      });
      expect(claim1.granted).toBe(true);
      expect(claim1.amount).toBe(MONETIZATION_CONFIG.STARTER_GRANT);

      const user1 = await testApp.connection
        .collection("users")
        .findOne({ _id: user1Id });
      expect(user1?.creditBalance).toBe(MONETIZATION_CONFIG.STARTER_GRANT);
      expect(user1?.starterGrantedAt).toBeDefined();

      // Second claim on same user -> rejected (already granted to user)
      const claim1Repeat = await creditLedgerService.claimStarterGrant(user1Id, {
        deviceId: "another_device_uuid",
        ip,
      });
      expect(claim1Repeat.granted).toBe(false);
      expect(claim1Repeat.reason).toBe("ALREADY_GRANTED_TO_USER");

      // Second user on SAME device -> rejected (device already claimed)
      const user2Doc = await testApp.connection.collection("users").insertOne({
        displayName: "Starter User 2",
        creditBalance: 0,
        referralCode: "START002",
        identities: [],
        referralBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const user2Id = user2Doc.insertedId;

      const claim2 = await creditLedgerService.claimStarterGrant(user2Id, {
        deviceId,
        ip,
      });
      expect(claim2.granted).toBe(false);
      expect(claim2.reason).toBe("DEVICE_ALREADY_CLAIMED");

      const user2 = await testApp.connection
        .collection("users")
        .findOne({ _id: user2Id });
      expect(user2?.creditBalance).toBe(0);
    });

    it("enforces network daily cap (max 5 starter grants per network per day)", async () => {
      const sharedIp = "10.0.0.99";

      // Register and claim 5 devices on same network
      for (let i = 1; i <= 5; i++) {
        const uDoc = await testApp.connection.collection("users").insertOne({
          displayName: `Network User ${i}`,
          creditBalance: 0,
          referralCode: `NETW000${i}`,
          identities: [],
          referralBlocked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        const claim = await creditLedgerService.claimStarterGrant(
          uDoc.insertedId,
          {
            deviceId: `network_device_${i}`,
            ip: sharedIp,
          }
        );
        expect(claim.granted).toBe(true);
      }

      // 6th device on same network must be rejected
      const u6Doc = await testApp.connection.collection("users").insertOne({
        displayName: "Network User 6",
        creditBalance: 0,
        referralCode: "NETW0006",
        identities: [],
        referralBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const claim6 = await creditLedgerService.claimStarterGrant(
        u6Doc.insertedId,
        {
          deviceId: "network_device_6",
          ip: sharedIp,
        }
      );
      expect(claim6.granted).toBe(false);
      expect(claim6.reason).toBe("NETWORK_DAILY_LIMIT_EXCEEDED");
    });
  });

  describe("3. GET /api/v1/config and GET /v1/config (§2.2)", () => {
    it("returns public config with prices, earn ladder, wheel prizes, and legal urls via /api/v1/config", async () => {
      const res = await fetch(`${testApp.baseUrl}/api/v1/config`);
      expect(res.status).toBe(200);

      const config = (await res.json()) as any;
      expect(config.currency).toBe("GEM");
      expect(config.pricePerAction).toBe(5);
      expect(config.maxActionsPerTap).toBe(5);
      expect(config.starterGrant).toBe(5);
      expect(config.vipDaily).toBe(50);
      expect(config.earnLadder).toEqual([3, 3, 5, 3, 3, 8, 10]);
      expect(config.streakLength).toBe(365);
      expect(config.wheelPrizes).toEqual([2, 3, 5, 10, 20, 50]);
      expect(config.currencySpinCost).toBe(3);
      expect(config.legal).toHaveProperty("privacyUrl");
      expect(config.legal).toHaveProperty("termsUrl");
    });

    it("supports rewritten path /v1/config as specified in playbook", async () => {
      const res = await fetch(`${testApp.baseUrl}/v1/config`);
      expect(res.status).toBe(200);

      const config = (await res.json()) as any;
      expect(config.currency).toBe("GEM");
      expect(config.pricePerAction).toBe(5);
    });
  });

  describe("4. GET /api/v1/me and GET /v1/me (§2.2, §6.1, §6.6)", () => {
    it("returns balance, billingRef, and vip status for non-VIP user", async () => {
      const res = await fetch(`${testApp.baseUrl}/api/v1/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(res.status).toBe(200);

      const body = (await res.json()) as any;
      expect(body).toHaveProperty("balance");
      expect(body).toHaveProperty("creditBalance");
      expect(body.balance).toBe(body.creditBalance);
      expect(body.billingRef).toBeDefined();
      expect(body.billingRef).toHaveLength(64); // SHA-256 hex string

      expect(body.vip).toEqual({
        active: false,
        productId: null,
        expiresAt: null,
        willRenew: false,
      });
      expect(body.grantedNow).toBe(0);
    });

    it("supports rewritten path /v1/me as specified in playbook", async () => {
      const res = await fetch(`${testApp.baseUrl}/v1/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(res.status).toBe(200);

      const body = (await res.json()) as any;
      expect(body.id).toBe(testUserId.toString());
      expect(body.billingRef).toBeDefined();
    });

    it("grants VIP daily currency (+50) on the first /v1/me of the reward day and reports grantedNow", async () => {
      // Make test user VIP
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await testApp.connection.collection("users").updateOne(
        { _id: testUserId },
        {
          $set: {
            vipExpiresAt: futureDate,
            vipProductId: "yearlyid",
            vipWillRenew: true,
            vipDailyDay: null, // never granted today
          },
        }
      );

      const userBefore = await testApp.connection
        .collection("users")
        .findOne({ _id: testUserId });
      const balanceBefore = userBefore?.creditBalance ?? 0;

      // 1. First call today -> grantedNow: 50, balance increased by 50
      const res1 = await fetch(`${testApp.baseUrl}/api/v1/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(res1.status).toBe(200);
      const body1 = (await res1.json()) as any;

      expect(body1.vip.active).toBe(true);
      expect(body1.vip.productId).toBe("yearlyid");
      expect(body1.vip.willRenew).toBe(true);
      expect(body1.grantedNow).toBe(50);
      expect(body1.balance).toBe(balanceBefore + 50);

      // Verify ledger transaction was written
      const tx = await testApp.connection
        .collection("credit_transactions")
        .findOne({
          userId: testUserId,
          type: CreditTransactionType.VIP_DAILY,
        });
      expect(tx).toBeDefined();
      expect(tx?.amount).toBe(50);

      // 2. Second call today -> already granted, grantedNow: 0, balance not changed
      const res2 = await fetch(`${testApp.baseUrl}/api/v1/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(res2.status).toBe(200);
      const body2 = (await res2.json()) as any;
      expect(body2.grantedNow).toBe(0);
      expect(body2.balance).toBe(body1.balance);
    });
  });
});
