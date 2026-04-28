use anchor_lang::prelude::*;

declare_id!("ArcRtr1111111111111111111111111111111111111");

#[program]
pub mod arcan_router {
    use super::*;

    pub fn register_agent(
        ctx: Context<RegisterAgent>,
        name: String,
        capabilities: Vec<String>,
        cost_per_task: u64,
        endpoint: String,
    ) -> Result<()> {
        require!(name.len() <= 32, ArcanError::NameTooLong);
        require!(capabilities.len() <= 16, ArcanError::TooManyCapabilities);
        require!(!capabilities.is_empty(), ArcanError::NoCapabilities);
        require!(endpoint.len() <= 256, ArcanError::EndpointTooLong);

        let agent = &mut ctx.accounts.agent;
        agent.authority = ctx.accounts.authority.key();
        agent.name = name;
        agent.capabilities = capabilities;
        agent.cost_per_task = cost_per_task;
        agent.endpoint = endpoint;
        agent.reputation_score = 500;
        agent.tasks_completed = 0;
        agent.tasks_failed = 0;
        agent.registered_at = Clock::get()?.unix_timestamp;
        agent.is_active = true;
        agent.bump = ctx.bumps.agent;

        emit!(AgentRegistered {
            agent: agent.key(),
            authority: agent.authority,
            name: agent.name.clone(),
            capabilities: agent.capabilities.clone(),
        });

        Ok(())
    }

    pub fn deregister_agent(ctx: Context<DeregisterAgent>) -> Result<()> {
        let agent = &ctx.accounts.agent;
        require!(
            agent.authority == ctx.accounts.authority.key(),
            ArcanError::Unauthorized
        );
        emit!(AgentDeregistered {
            agent: agent.key(),
            authority: agent.authority,
        });
        Ok(())
    }

    pub fn route_task(
        ctx: Context<RouteTask>,
        capability: String,
        max_cost: u64,
        task_id: String,
    ) -> Result<()> {
        require!(task_id.len() <= 64, ArcanError::TaskIdTooLong);

        let route = &mut ctx.accounts.route;
        let agent = &ctx.accounts.agent;

        require!(
            agent.capabilities.iter().any(|c| c == &capability),
            ArcanError::CapabilityMismatch
        );
        require!(agent.is_active, ArcanError::AgentInactive);
        require!(agent.cost_per_task <= max_cost, ArcanError::CostExceedsMax);

        route.task_id = task_id.clone();
        route.requester = ctx.accounts.requester.key();
        route.agent = agent.key();
        route.capability = capability;
        route.cost = agent.cost_per_task;
        route.reputation_at_route = agent.reputation_score;
        route.routed_at = Clock::get()?.unix_timestamp;
        route.status = RouteStatus::Pending;
        route.bump = ctx.bumps.route;

        emit!(TaskRouted {
            route: route.key(),
            task_id,
            agent: agent.key(),
            requester: ctx.accounts.requester.key(),
            cost: agent.cost_per_task,
        });

        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct AgentAccount {
    pub authority: Pubkey,
    #[max_len(32)]
    pub name: String,
    #[max_len(16, 32)]
    pub capabilities: Vec<String>,
    pub cost_per_task: u64,
    #[max_len(256)]
    pub endpoint: String,
    pub reputation_score: u16,
    pub tasks_completed: u64,
    pub tasks_failed: u64,
    pub registered_at: i64,
    pub is_active: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct RouteAccount {
    #[max_len(64)]
    pub task_id: String,
    pub requester: Pubkey,
    pub agent: Pubkey,
    #[max_len(32)]
    pub capability: String,
    pub cost: u64,
    pub reputation_at_route: u16,
    pub routed_at: i64,
    pub status: RouteStatus,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum RouteStatus {
    Pending,
    Active,
    Completed,
    Failed,
    Disputed,
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct RegisterAgent<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + AgentAccount::INIT_SPACE,
        seeds = [b"agent", authority.key().as_ref(), name.as_bytes()],
        bump,
    )]
    pub agent: Account<'info, AgentAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeregisterAgent<'info> {
    #[account(
        mut,
        close = authority,
        has_one = authority,
    )]
    pub agent: Account<'info, AgentAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(capability: String, max_cost: u64, task_id: String)]
pub struct RouteTask<'info> {
    #[account(
        init,
        payer = requester,
        space = 8 + RouteAccount::INIT_SPACE,
        seeds = [b"route", requester.key().as_ref(), task_id.as_bytes()],
        bump,
    )]
    pub route: Account<'info, RouteAccount>,
    pub agent: Account<'info, AgentAccount>,
    #[account(mut)]
    pub requester: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct AgentRegistered {
    pub agent: Pubkey,
    pub authority: Pubkey,
    pub name: String,
    pub capabilities: Vec<String>,
}

#[event]
pub struct AgentDeregistered {
    pub agent: Pubkey,
    pub authority: Pubkey,
}

#[event]
pub struct TaskRouted {
    pub route: Pubkey,
    pub task_id: String,
    pub agent: Pubkey,
    pub requester: Pubkey,
    pub cost: u64,
}

#[error_code]
pub enum ArcanError {
    #[msg("Agent name must be 32 characters or less")]
    NameTooLong,
    #[msg("Maximum 16 capabilities allowed")]
    TooManyCapabilities,
    #[msg("At least one capability required")]
    NoCapabilities,
    #[msg("Endpoint URL must be 256 characters or less")]
    EndpointTooLong,
    #[msg("Unauthorized: signer does not own this agent")]
    Unauthorized,
    #[msg("Agent does not have the requested capability")]
    CapabilityMismatch,
    #[msg("Agent is not currently active")]
    AgentInactive,
    #[msg("Agent cost exceeds the maximum specified")]
    CostExceedsMax,
    #[msg("Task ID must be 64 characters or less")]
    TaskIdTooLong,
}
