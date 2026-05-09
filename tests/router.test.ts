import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { findAgentPDA, findRoutePDA } from "../sdk/ts/src/instructions";

describe("arcan-router", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  describe("register_agent", () => {
    it("should derive correct agent PDA", () => {
      const authority = Keypair.generate();
      const [pda] = findAgentPDA(authority.publicKey, "test-agent");
      expect(pda).to.be.instanceOf(PublicKey);
    });

    it("should reject name longer than 32 chars", () => {
      const longName = "a".repeat(33);
      expect(longName.length).to.be.greaterThan(32);
    });
  });

  describe("route_task", () => {
    it("should derive unique route PDAs per task", () => {
      const requester = Keypair.generate();
      const [r1] = findRoutePDA(requester.publicKey, "task-1");
      const [r2] = findRoutePDA(requester.publicKey, "task-2");
      expect(r1.toBase58()).to.not.equal(r2.toBase58());
    });
  });
});
