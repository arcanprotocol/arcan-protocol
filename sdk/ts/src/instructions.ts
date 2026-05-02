import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";

export const ROUTER_PROGRAM_ID = new PublicKey("ArcRtr1111111111111111111111111111111111111");
export const SETTLEMENT_PROGRAM_ID = new PublicKey("ArcStl1111111111111111111111111111111111111");

export function findAgentPDA(authority: PublicKey, name: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("agent"), authority.toBuffer(), Buffer.from(name)],
    ROUTER_PROGRAM_ID,
  );
}

export function findRoutePDA(requester: PublicKey, taskId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("route"), requester.toBuffer(), Buffer.from(taskId)],
    ROUTER_PROGRAM_ID,
  );
}

export function findEscrowPDA(requester: PublicKey, taskId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), requester.toBuffer(), Buffer.from(taskId)],
    SETTLEMENT_PROGRAM_ID,
  );
}

export function findEscrowVaultPDA(escrow: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), escrow.toBuffer()],
    SETTLEMENT_PROGRAM_ID,
  );
}

function encodeString(s: string): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32LE(s.length);
  return Buffer.concat([len, Buffer.from(s)]);
}

function encodeStringVec(arr: string[]): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32LE(arr.length);
  const encoded = arr.map((s) => encodeString(s));
  return Buffer.concat([len, ...encoded]);
}

export function buildRegisterAgentIx(
  authority: PublicKey,
  name: string,
  capabilities: string[],
  costPerTask: BN,
  endpoint: string,
): { instruction: TransactionInstruction; agentPDA: PublicKey } {
  const [agentPDA] = findAgentPDA(authority, name);
  const discriminator = Buffer.from([133, 70, 173, 169, 215, 24, 147, 53]);
  const data = Buffer.concat([
    discriminator,
    encodeString(name),
    encodeStringVec(capabilities),
    costPerTask.toArrayLike(Buffer, "le", 8),
    encodeString(endpoint),
  ]);
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: agentPDA, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: ROUTER_PROGRAM_ID,
    data,
  });
  return { instruction, agentPDA };
}
