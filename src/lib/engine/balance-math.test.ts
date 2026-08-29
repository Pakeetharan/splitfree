import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { computeBalancesFromDocs } from "./balance-math";

function member(name: string) {
  return { _id: new ObjectId(), name };
}

describe("computeBalancesFromDocs", () => {
  it("splits an equal expense so the payer is owed and others owe their share", () => {
    const alice = member("Alice");
    const bob = member("Bob");

    const expense = {
      paidBy: alice._id,
      splitAmong: [alice._id, bob._id],
      amount: 1000,
      splitDetails: [],
    };

    const balances = computeBalancesFromDocs([alice, bob], [expense], []);

    const aliceBalance = balances.find((b) => b.memberId === alice._id.toHexString());
    const bobBalance = balances.find((b) => b.memberId === bob._id.toHexString());

    expect(aliceBalance?.netBalance).toBe(500);
    expect(bobBalance?.netBalance).toBe(-500);
    expect(aliceBalance?.totalSpent).toBe(500);
    expect(bobBalance?.totalSpent).toBe(500);
  });

  it("uses materialized splitDetails for non-equal splits instead of re-deriving equal shares", () => {
    const alice = member("Alice");
    const bob = member("Bob");

    const expense = {
      paidBy: alice._id,
      splitAmong: [alice._id, bob._id],
      amount: 1000,
      // 70/30 split, not equal — balance math must use this, not splitAmong.length
      splitDetails: [
        { memberId: alice._id, amount: 700 },
        { memberId: bob._id, amount: 300 },
      ],
    };

    const balances = computeBalancesFromDocs([alice, bob], [expense], []);

    const aliceBalance = balances.find((b) => b.memberId === alice._id.toHexString());
    const bobBalance = balances.find((b) => b.memberId === bob._id.toHexString());

    // Alice paid 1000, owes 700 of it -> net +300
    expect(aliceBalance?.netBalance).toBe(300);
    // Bob paid 0, owes 300 -> net -300
    expect(bobBalance?.netBalance).toBe(-300);
  });

  it("nets out a settlement between two members", () => {
    const alice = member("Alice");
    const bob = member("Bob");

    const expense = {
      paidBy: alice._id,
      splitAmong: [alice._id, bob._id],
      amount: 1000,
      splitDetails: [],
    };
    const settlement = { payer: bob._id, payee: alice._id, amount: 500 };

    const balances = computeBalancesFromDocs(
      [alice, bob],
      [expense],
      [settlement],
    );

    const aliceBalance = balances.find((b) => b.memberId === alice._id.toHexString());
    const bobBalance = balances.find((b) => b.memberId === bob._id.toHexString());

    expect(aliceBalance?.netBalance).toBe(0);
    expect(bobBalance?.netBalance).toBe(0);
  });

  it("returns zero balances for a group with no expenses or settlements", () => {
    const alice = member("Alice");
    const balances = computeBalancesFromDocs([alice], [], []);
    expect(balances).toEqual([
      { memberId: alice._id.toHexString(), name: "Alice", netBalance: 0, totalSpent: 0 },
    ]);
  });
});
