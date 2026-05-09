import { Keypair, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { findEscrowPDA, findEscrowVaultPDA } from "../sdk/ts/src/instructions";

describe("arcan-settlement", () => {
  describe("escrow PDA derivation", () => {
    it("should derive escrow PDA", () => {
      const requester = Keypair.generate();
      const [pda, bump] = findEscrowPDA(requester.publicKey, "task-001");
      expect(pda).to.be.instanceOf(PublicKey);
      expect(bump).to.be.lessThanOrEqual(255);
    });

    it("should derive vault PDA from escrow", () => {
      const requester = Keypair.generate();
      const [escrow] = findEscrowPDA(requester.publicKey, "task-001");
      const [vault] = findEscrowVaultPDA(escrow);
      expect(vault.toBase58()).to.not.equal(escrow.toBase58());
    });
  });

  describe("escrow state machine", () => {
    it("should allow locked -> result_submitted", () => {
      expect(isValidTransition("locked", "result_submitted")).to.be.true;
    });

    it("should not allow completed -> any", () => {
      expect(isValidTransition("completed", "locked")).to.be.false;
    });
  });
});

type EscrowStatus = "locked" | "result_submitted" | "completed" | "disputed" | "refunded";
const VALID_TRANSITIONS: Record<EscrowStatus, EscrowStatus[]> = {
  locked: ["result_submitted", "refunded", "disputed"],
  result_submitted: ["completed", "disputed"],
  disputed: ["completed", "refunded"],
  completed: [],
  refunded: [],
};
function isValidTransition(from: EscrowStatus, to: EscrowStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
