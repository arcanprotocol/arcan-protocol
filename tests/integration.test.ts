import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";
import { findAgentPDA, findRoutePDA, findEscrowPDA, findEscrowVaultPDA } from "../sdk/ts/src/instructions";

describe("arcan-protocol integration", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  it("should derive unique PDAs across the full lifecycle", () => {
    const owner = Keypair.generate();
    const requester = Keypair.generate();
    const [agent] = findAgentPDA(owner.publicKey, "test-agent");
    const [route] = findRoutePDA(requester.publicKey, "task-001");
    const [escrow] = findEscrowPDA(requester.publicKey, "task-001");
    const [vault] = findEscrowVaultPDA(escrow);
    const addrs = [agent, route, escrow, vault].map(p => p.toBase58());
    expect(new Set(addrs).size).to.equal(4);
  });

  it("should score agents correctly with varied parameters", () => {
    const agents = [
      { reputation: 900, cost: 500000, completed: 100, failed: 5 },
      { reputation: 700, cost: 200000, completed: 50, failed: 10 },
    ];
    const maxCost = 1000000;
    const scores = agents.map(a => {
      const rep = (a.reputation / 1000) * 40;
      const cost = (1 - a.cost / maxCost) * 30;
      const total = a.completed + a.failed;
      const completion = (total > 0 ? a.completed / total : 0.5) * 30;
      return rep + cost + completion;
    });
    expect(scores[0]).to.be.greaterThan(scores[1]);
  });
});
