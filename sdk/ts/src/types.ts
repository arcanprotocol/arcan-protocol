import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

export interface Agent {
  address: PublicKey;
  authority: PublicKey;
  name: string;
  capabilities: string[];
  costPerTask: BN;
  endpoint: string;
  reputationScore: number;
  tasksCompleted: number;
  tasksFailed: number;
  registeredAt: number;
  isActive: boolean;
}

export interface RegisterAgentParams {
  name: string;
  capabilities: string[];
  costPerTask: number;
  endpoint: string;
}

export interface RouteTaskParams {
  capability: string;
  maxCost: number;
  preferredLatency?: "low" | "medium" | "high";
  preferredAgent?: PublicKey;
}

export interface Route {
  address: PublicKey;
  taskId: string;
  requester: PublicKey;
  agent: PublicKey;
  capability: string;
  cost: BN;
  reputationAtRoute: number;
  routedAt: number;
  status: RouteStatus;
}

export type RouteStatus = "pending" | "active" | "completed" | "failed" | "disputed";
