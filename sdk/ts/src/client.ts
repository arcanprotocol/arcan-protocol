import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import BN from "bn.js";
import {
  findAgentPDA,
  ROUTER_PROGRAM_ID,
} from "./instructions";
import type {
  Agent,
  RegisterAgentParams,
  AgentReputation,
} from "./types";

const LAMPORTS_PER_SOL = 1_000_000_000;

/**
 * ArcanClient -- TypeScript SDK for the Arcan Protocol.
 */
export class ArcanClient {
  private connection: Connection;
  private payer: Keypair;
  private commitment: "confirmed" | "finalized";

  constructor(
    connection: Connection,
    payer: Keypair,
    commitment: "confirmed" | "finalized" = "confirmed",
  ) {
    this.connection = connection;
    this.payer = payer;
    this.commitment = commitment;
  }

  async registerAgent(params: RegisterAgentParams): Promise<PublicKey> {
    const [agentPDA] = findAgentPDA(this.payer.publicKey, params.name);
    // TODO: build and send register_agent transaction
    return agentPDA;
  }

  async getAgentReputation(agentAddress: PublicKey): Promise<AgentReputation> {
    const accountInfo = await this.connection.getAccountInfo(agentAddress);
    if (!accountInfo) {
      throw new Error(`Agent not found: ${agentAddress.toBase58()}`);
    }
    // TODO: deserialize account
    throw new Error("Not yet implemented");
  }
}
