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

        Ok(())
    }

    pub fn deregister_agent(ctx: Context<DeregisterAgent>) -> Result<()> {
        let agent = &ctx.accounts.agent;
        require!(
            agent.authority == ctx.accounts.authority.key(),
            ArcanError::Unauthorized
        );
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
}
