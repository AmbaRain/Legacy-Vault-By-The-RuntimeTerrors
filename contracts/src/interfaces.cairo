use starknet::ContractAddress;

#[derive(Drop, Copy, Serde, starknet::Store)]
pub struct InheritanceConfig {
    pub beneficiary: ContractAddress,
    pub dormancy_period_secs: u64,
    pub gas_reserve_amount: u256,
    pub gas_reserve_token: ContractAddress,
    pub is_active: bool,
    pub is_paused: bool,
    pub is_claimed: bool,
    pub last_heartbeat_timestamp: u64,
}

#[starknet::interface]
pub trait ILegacyVault<TContractState> {
    // Views
    fn get_inheritance_config(self: @TContractState, vault_owner: ContractAddress) -> InheritanceConfig;
    fn get_last_heartbeat(self: @TContractState, vault_owner: ContractAddress) -> u64;
    fn is_claim_eligible(self: @TContractState, vault_owner: ContractAddress) -> bool;
    fn get_time_until_dormant(self: @TContractState, vault_owner: ContractAddress) -> u64;
    fn get_gas_reserve(self: @TContractState, vault_owner: ContractAddress) -> (u256, ContractAddress);

    // State mutations
    fn configure_inheritance(
        ref self: TContractState,
        beneficiary: ContractAddress,
        dormancy_days: u64,
        gas_reserve_amount: u256,
        gas_reserve_token: ContractAddress,
    );
    fn send_heartbeat(ref self: TContractState);
    fn pause_inheritance(ref self: TContractState);
    fn resume_inheritance(ref self: TContractState);
    fn claim_inheritance(ref self: TContractState, vault_owner: ContractAddress);
    fn withdraw_gas_reserve(ref self: TContractState, recipient: ContractAddress);
}
