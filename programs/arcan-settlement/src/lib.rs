use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("ArcStl1111111111111111111111111111111111111");

#[program]
pub mod arcan_settlement {
    use super::*;

    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        task_id: String,
        amount: u64,
        timeout_seconds: i64,
    ) -> Result<()> {
        require!(amount > 0, SettlementError::ZeroAmount);
        require!(timeout_seconds >= 300, SettlementError::TimeoutTooShort);

        let escrow = &mut ctx.accounts.escrow;
        escrow.task_id = task_id;
        escrow.requester = ctx.accounts.requester.key();
        escrow.agent = ctx.accounts.agent.key();
        escrow.amount = amount;
        escrow.created_at = Clock::get()?.unix_timestamp;
        escrow.timeout_at = escrow.created_at + timeout_seconds;
        escrow.status = EscrowStatus::Locked;
        escrow.bump = ctx.bumps.escrow;

        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct EscrowAccount {
    #[max_len(64)]
    pub task_id: String,
    pub requester: Pubkey,
    pub agent: Pubkey,
    pub amount: u64,
    pub created_at: i64,
    pub timeout_at: i64,
    pub status: EscrowStatus,
    #[max_len(128)]
    pub result_hash: String,
    #[max_len(512)]
    pub dispute_reason: String,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum EscrowStatus {
    Locked,
    ResultSubmitted,
    Completed,
    Disputed,
    Refunded,
}

#[derive(Accounts)]
#[instruction(task_id: String)]
pub struct CreateEscrow<'info> {
    #[account(
        init,
        payer = requester,
        space = 8 + EscrowAccount::INIT_SPACE,
        seeds = [b"escrow", requester.key().as_ref(), task_id.as_bytes()],
        bump,
    )]
    pub escrow: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub requester: Signer<'info>,
    /// CHECK: Agent pubkey
    pub agent: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum SettlementError {
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Timeout must be at least 300 seconds")]
    TimeoutTooShort,
}
