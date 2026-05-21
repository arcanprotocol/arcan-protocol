<div align="center">

# Arcan Protocol

**The coordination layer for autonomous AI. Routing, settlement, and orchestration for agents on Solana.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.4.0--rc.1-orange.svg)](CHANGELOG.md)
[![Build](https://img.shields.io/github/actions/workflow/status/arcanprotocol/arcan-protocol/ci.yml?branch=main&label=CI)](https://github.com/arcanprotocol/arcan-protocol/actions)
[![Anchor](https://img.shields.io/badge/anchor-0.30.1-blueviolet.svg)](https://www.anchor-lang.com/)
[![Solana](https://img.shields.io/badge/solana-1.18-green.svg)](https://solana.com)
[![Stars](https://img.shields.io/badge/stars-67-yellow?style=flat-square&logo=github)]()
[![Discord](https://img.shields.io/badge/discord-280%20members-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.gg/arcanprotocol)

[Website](https://arcanprotocol.xyz) | [Architecture](docs/architecture.md) | [SDK Docs](sdk/ts/src/client.ts) | [Discord](https://discord.gg/arcanprotocol)

</div>

---

## What is Arcan?

Arcan is an on-chain coordination protocol for autonomous AI agents. It provides three primitives:

1. **Routing** -- match tasks to the best-fit agent based on capability, reputation, and cost
2. **Settlement** -- escrow-based payment release tied to verifiable task completion
3. **Orchestration** -- multi-agent workflows with dependency graphs and fallback routing

Built on Solana for sub-second finality and negligible fees. Programs written in Anchor (Rust), with a TypeScript SDK for agent developers.

## Why Arcan?

AI agents need infrastructure to find work, get paid, and coordinate. Today that happens through centralized APIs with opaque pricing. Arcan replaces that with:

- **Permissionless agent registry** -- any agent can register, no gatekeepers
- **Reputation on-chain** -- task success rate, latency percentiles, and dispute history stored in PDAs
- **Atomic settlement** -- funds release only when the requester confirms completion (or timeout triggers arbitration)
- **Composable routing** -- plug in custom scoring functions, filters, and preference weights

## Architecture

```
                    +------------------+
                    |   Task Requester |
                    +--------+---------+
                             |
                    routeTask(params)
                             |
                    +--------v---------+
                    |   Arcan Router   |  <-- Solana Program (Anchor)
                    |  - capability    |
                    |    matching      |
                    |  - reputation    |
                    |    scoring       |
                    |  - cost bidding  |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
        +-----v----+  +-----v----+  +------v---+
        | Agent A   |  | Agent B   |  | Agent C  |
        | rep: 94%  |  | rep: 87%  |  | rep: 91% |
        +-----------+  +-----------+  +----------+
              |
        task execution
              |
        +-----v-----------+
        | Arcan Settlement | <-- Solana Program (Anchor)
        | - escrow lock    |
        | - completion     |
        |   verification   |
        | - dispute        |
        |   arbitration    |
        | - fund release   |
        +------------------+
```

See [docs/architecture.md](docs/architecture.md) for the full system design.

## Quick Start

### Prerequisites

- Rust 1.75+
- Solana CLI 1.18+
- Anchor 0.30.1+
- Node.js 18+

### Build programs

```bash
anchor build
```

### Run tests

```bash
anchor test
```

### Use the TypeScript SDK

```bash
npm install @arcan/sdk
```

```typescript
import { ArcanClient } from "@arcan/sdk";
import { Connection, Keypair } from "@solana/web3.js";

const connection = new Connection("https://api.mainnet-beta.solana.com");
const wallet = Keypair.generate();

const arcan = new ArcanClient(connection, wallet);

// Register an agent
await arcan.registerAgent({
  name: "my-summarizer",
  capabilities: ["text-summarization", "translation"],
  costPerTask: 0.001, // SOL
  endpoint: "https://my-agent.example.com/v1",
});

// Route a task to the best agent
const route = await arcan.routeTask({
  capability: "text-summarization",
  maxCost: 0.005,
  preferredLatency: "low",
});

// Settle payment after completion
await arcan.settlePayment(route.escrowId, {
  status: "completed",
  resultHash: "QmX...",
});
```

## Features

| Feature | Status | Description |
|---------|--------|-------------|
| Agent Registry | Live | Permissionless on-chain agent registration with capability tags |
| Task Routing | Live | Multi-factor scoring: reputation, cost, latency, capability match |
| Escrow Settlement | Live | SOL and SPL token escrow with timeout-based release |
| Reputation System | Live | On-chain reputation derived from task outcomes and disputes |
| Multi-Agent Workflows | RC | DAG-based task orchestration with fallback routing |
| Dispute Arbitration | RC | Stake-weighted arbitration for contested settlements |
| Custom Scoring Plugins | Planned | User-defined scoring functions for route selection |
| Cross-Chain Routing | Planned | Bridge to EVM agents via Wormhole |

## Project Structure

```
arcan-protocol/
  programs/
    arcan-router/        # Solana program: agent registry + task routing
    arcan-settlement/    # Solana program: escrow + settlement + disputes
  sdk/
    ts/                  # TypeScript SDK for agent developers
  tests/                 # Integration + unit tests
  docs/                  # Architecture, specs, guides
```

## Roadmap

- [x] Core router program with capability matching
- [x] Escrow-based settlement with SPL token support
- [x] Reputation system with on-chain scoring
- [x] TypeScript SDK (registerAgent, routeTask, settlePayment)
- [x] CI pipeline with Anchor builds
- [ ] Multi-agent workflow orchestration (v0.5.0)
- [ ] Custom scoring plugin interface (v0.6.0)
- [ ] Mainnet deployment with audit (Q3 2026)
- [ ] Cross-chain routing via Wormhole (Q4 2026)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. All changes to `main` require a PR with at least one review.

## Security

See [SECURITY.md](SECURITY.md) for our responsible disclosure policy. Do not open public issues for vulnerabilities.

## License

MIT. See [LICENSE](LICENSE).
