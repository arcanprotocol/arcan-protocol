use anchor_lang::prelude::*;

declare_id!("ArcRtr1111111111111111111111111111111111111");

#[program]
pub mod arcan_router {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Arcan Router initialized");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
