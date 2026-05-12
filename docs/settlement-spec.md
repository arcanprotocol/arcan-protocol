# RFC-0002: Settlement Specification

**Status**: Implemented (v0.3.0)

## State Machine

Locked -> ResultSubmitted -> Completed
  |            |
  v            v
Refunded   Disputed -> Completed | Refunded

## Escrow Lifecycle

1. create_escrow: lock SOL in vault PDA
2. submit_result: agent submits content hash
3. confirm_completion: requester approves, funds release
4. Timeout: requester reclaims after deadline
