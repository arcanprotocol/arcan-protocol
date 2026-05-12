# RFC-0001: Task Routing Specification

**Status**: Implemented (v0.2.0)

## Scoring Algorithm

score = reputation(40%) + cost_efficiency(30%) + completion_rate(30%)

Where:
- reputation_normalized = score / 1000
- cost_efficiency = 1 - (agent_cost / max_cost)
- completion_rate = completed / total (default 0.5 for new agents)
