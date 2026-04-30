import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import BN from "bn.js";
import {
  findAgentPDA,
  findRoutePDA,
  findEscrowPDA,
  ROUTER_PROGRAM_ID,
} from "./instructions";
import type {
  Agent,
  RegisterAgentParams,
  RouteTaskParams,
  Route,
  RouteStatus,
  AgentReputation,
} from "./types";

const LAMPORTS_PER_SOL = 1_000_000_000;

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
    const tx = new Transaction();
    // TODO: add register instruction
    return agentPDA;
  }

  async routeTask(params: RouteTaskParams): Promise<Route & { escrowId: PublicKey }> {
    const taskId = `task-${Date.now()}`;
    const maxCostLamports = new BN(Math.floor(params.maxCost * LAMPORTS_PER_SOL));

    const agents = await this.getAgentsByCapability(params.capability);
    if (agents.length === 0) {
      throw new Error(`No agents found with capability: ${params.capability}`);
    }

    const scored = agents
      .filter((a) => a.isActive)
      .filter((a) => a.costPerTask.lte(maxCostLamports))
      .map((a) => ({
        agent: a,
        score: this.scoreAgent(a, maxCostLamports),
      }))
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
      throw new Error("No agents match the routing criteria");
    }

    const bestAgent = scored[0].agent;
    const [routePDA] = findRoutePDA(this.payer.publicKey, taskId);
    const [escrowPDA] = findEscrowPDA(this.payer.publicKey, taskId);

    return {
      address: routePDA,
      taskId,
      requester: this.payer.publicKey,
      agent: bestAgent.address,
      capability: params.capability,
      cost: bestAgent.costPerTask,
      reputationAtRoute: bestAgent.reputationScore,
      routedAt: Math.floor(Date.now() / 1000),
      status: "pending" as RouteStatus,
      escrowId: escrowPDA,
    };
  }

  async getAgentsByCapability(capability: string): Promise<Agent[]> {
    const accounts = await this.connection.getProgramAccounts(ROUTER_PROGRAM_ID, {
      filters: [{ dataSize: 1200 }],
    });
    return accounts
      .map((a) => this.deserializeAgent(a.pubkey, a.account.data))
      .filter((a) => a.capabilities.includes(capability));
  }

  async getAgentReputation(agentAddress: PublicKey): Promise<AgentReputation> {
    const accountInfo = await this.connection.getAccountInfo(agentAddress);
    if (!accountInfo) {
      throw new Error(`Agent not found: ${agentAddress.toBase58()}`);
    }
    const agent = this.deserializeAgent(agentAddress, accountInfo.data);
    const total = agent.tasksCompleted + agent.tasksFailed;
    return {
      agent: agentAddress,
      score: agent.reputationScore,
      tasksCompleted: agent.tasksCompleted,
      tasksFailed: agent.tasksFailed,
      successRate: total > 0 ? agent.tasksCompleted / total : 0,
      registeredAt: agent.registeredAt,
    };
  }

  private scoreAgent(agent: Agent, maxCost: BN): number {
    const reputationScore = (agent.reputationScore / 1000) * 40;
    const costRatio = 1 - agent.costPerTask.toNumber() / maxCost.toNumber();
    const costScore = costRatio * 30;
    const total = agent.tasksCompleted + agent.tasksFailed;
    const completionRate = total > 0 ? agent.tasksCompleted / total : 0.5;
    const completionScore = completionRate * 30;
    return reputationScore + costScore + completionScore;
  }

  private deserializeAgent(address: PublicKey, data: Buffer): Agent {
    let offset = 8;
    const authority = new PublicKey(data.subarray(offset, offset + 32));
    offset += 32;
    const nameLen = data.readUInt32LE(offset);
    offset += 4;
    const name = data.subarray(offset, offset + nameLen).toString("utf8");
    offset += nameLen;
    const capsLen = data.readUInt32LE(offset);
    offset += 4;
    const capabilities: string[] = [];
    for (let i = 0; i < capsLen; i++) {
      const capLen = data.readUInt32LE(offset);
      offset += 4;
      capabilities.push(data.subarray(offset, offset + capLen).toString("utf8"));
      offset += capLen;
    }
    const costPerTask = new BN(data.subarray(offset, offset + 8), "le");
    offset += 8;
    const endpointLen = data.readUInt32LE(offset);
    offset += 4;
    const endpoint = data.subarray(offset, offset + endpointLen).toString("utf8");
    offset += endpointLen;
    const reputationScore = data.readUInt16LE(offset);
    offset += 2;
    const tasksCompleted = new BN(data.subarray(offset, offset + 8), "le").toNumber();
    offset += 8;
    const tasksFailed = new BN(data.subarray(offset, offset + 8), "le").toNumber();
    offset += 8;
    const registeredAt = new BN(data.subarray(offset, offset + 8), "le").toNumber();
    offset += 8;
    const isActive = data[offset] === 1;
    return {
      address, authority, name, capabilities, costPerTask, endpoint,
      reputationScore, tasksCompleted, tasksFailed, registeredAt, isActive,
    };
  }
}
