import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";

export const ROUTER_PROGRAM_ID = new PublicKey("ArcRtr1111111111111111111111111111111111111");

export function findAgentPDA(authority: PublicKey, name: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("agent"), authority.toBuffer(), Buffer.from(name)],
    ROUTER_PROGRAM_ID,
  );
}
