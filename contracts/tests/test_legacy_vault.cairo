use starknet::ContractAddress;
use snforge_std::{
    declare, ContractClassTrait, DeclareResultTrait,
    start_cheat_caller_address, stop_cheat_caller_address,
    start_cheat_block_timestamp
};
use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
use legacy_vault::interfaces::{ILegacyVaultDispatcher, ILegacyVaultDispatcherTrait};

fn OWNER() -> ContractAddress {
    'OWNER'.try_into().unwrap()
}

fn BENEFICIARY() -> ContractAddress {
    'BENEFICIARY'.try_into().unwrap()
}

fn RECIPIENT() -> ContractAddress {
    'RECIPIENT'.try_into().unwrap()
}

fn STRANGER() -> ContractAddress {
    'STRANGER'.try_into().unwrap()
}

fn deploy_vault() -> (ContractAddress, ILegacyVaultDispatcher) {
    let contract_class = declare("LegacyVault").unwrap().contract_class();
    let (contract_address, _) = contract_class.deploy(@ArrayTrait::new()).unwrap();
    let dispatcher = ILegacyVaultDispatcher { contract_address };
    (contract_address, dispatcher)
}

fn deploy_mock_token(initial_recipient: ContractAddress, initial_supply: u256) -> (ContractAddress, IERC20Dispatcher) {
    let contract_class = declare("MockERC20").unwrap().contract_class();
    let mut calldata: Array<felt252> = ArrayTrait::new();
    let name: ByteArray = "Starknet Token";
    let symbol: ByteArray = "STRK";
    name.serialize(ref calldata);
    symbol.serialize(ref calldata);
    initial_supply.serialize(ref calldata);
    initial_recipient.serialize(ref calldata);

    let (contract_address, _) = contract_class.deploy(@calldata).unwrap();
    let dispatcher = IERC20Dispatcher { contract_address };
    (contract_address, dispatcher)
}

#[test]
fn test_configure_inheritance_and_views() {
    let (vault_address, vault) = deploy_vault();
    let initial_time: u64 = 1_000_000;
    start_cheat_block_timestamp(vault_address, initial_time);

    let gas_reserve: u256 = 50_000_000_000_000_000_000; // 50 STRK
    let (token_address, token) = deploy_mock_token(OWNER(), 100_000_000_000_000_000_000);

    // Owner approves vault to transfer gas reserve
    start_cheat_caller_address(token_address, OWNER());
    token.approve(vault_address, gas_reserve);
    stop_cheat_caller_address(token_address);

    // Owner configures inheritance for 30 days
    start_cheat_caller_address(vault_address, OWNER());
    vault.configure_inheritance(BENEFICIARY(), 30, gas_reserve, token_address);
    stop_cheat_caller_address(vault_address);

    // Check config
    let config = vault.get_inheritance_config(OWNER());
    assert(config.beneficiary == BENEFICIARY(), 'Wrong beneficiary');
    assert(config.dormancy_period_secs == 30 * 86400, 'Wrong dormancy period');
    assert(config.gas_reserve_amount == gas_reserve, 'Wrong gas reserve');
    assert(config.gas_reserve_token == token_address, 'Wrong token address');
    assert(config.is_active == true, 'Vault should be active');
    assert(config.is_paused == false, 'Vault should not be paused');
    assert(config.is_claimed == false, 'Vault should not be claimed');
    assert(config.last_heartbeat_timestamp == initial_time, 'Wrong heartbeat timestamp');

    // Check view functions
    assert(vault.get_last_heartbeat(OWNER()) == initial_time, 'Wrong last heartbeat');
    assert(!vault.is_claim_eligible(OWNER()), 'Should not be eligible yet');
    assert(vault.get_time_until_dormant(OWNER()) == 30 * 86400, 'Wrong remaining seconds');

    let (res_amount, res_token) = vault.get_gas_reserve(OWNER());
    assert(res_amount == gas_reserve, 'Wrong gas amount');
    assert(res_token == token_address, 'Wrong gas token');

    // Verify vault received the gas reserve tokens
    assert(token.balance_of(vault_address) == gas_reserve, 'Vault did not receive tokens');
}

#[test]
fn test_send_heartbeat() {
    let (vault_address, vault) = deploy_vault();
    let initial_time: u64 = 1_000_000;
    start_cheat_block_timestamp(vault_address, initial_time);

    let zero_addr: ContractAddress = 0.try_into().unwrap();
    start_cheat_caller_address(vault_address, OWNER());
    vault.configure_inheritance(BENEFICIARY(), 10, 0, zero_addr);

    // Advance time by 4 days
    let new_time = initial_time + (4 * 86400);
    start_cheat_block_timestamp(vault_address, new_time);

    assert(vault.get_time_until_dormant(OWNER()) == 6 * 86400, 'Remaining should be 6 days');

    // Send heartbeat
    vault.send_heartbeat();
    stop_cheat_caller_address(vault_address);

    // Heartbeat timestamp should now be updated to new_time
    assert(vault.get_last_heartbeat(OWNER()) == new_time, 'Heartbeat not updated');
    assert(vault.get_time_until_dormant(OWNER()) == 10 * 86400, 'Timer should reset to 10 days');
}

#[test]
fn test_pause_and_resume() {
    let (vault_address, vault) = deploy_vault();
    let initial_time: u64 = 1_000_000;
    start_cheat_block_timestamp(vault_address, initial_time);

    let zero_addr: ContractAddress = 0.try_into().unwrap();
    start_cheat_caller_address(vault_address, OWNER());
    vault.configure_inheritance(BENEFICIARY(), 10, 0, zero_addr);

    // Pause protection
    vault.pause_inheritance();

    let config_paused = vault.get_inheritance_config(OWNER());
    assert(config_paused.is_paused == true, 'Should be paused');

    // Advance time past 10 days
    start_cheat_block_timestamp(vault_address, initial_time + (15 * 86400));
    assert(!vault.is_claim_eligible(OWNER()), 'Paused vault cannot be eligible');
    assert(vault.get_time_until_dormant(OWNER()) == 0, 'Paused vault time should be 0');

    // Resume protection
    let resume_time = initial_time + (15 * 86400);
    vault.resume_inheritance();
    stop_cheat_caller_address(vault_address);

    let config_resumed = vault.get_inheritance_config(OWNER());
    assert(config_resumed.is_paused == false, 'Should be unpaused');
    assert(config_resumed.last_heartbeat_timestamp == resume_time, 'Heartbeat reset on resume');
    assert(vault.get_time_until_dormant(OWNER()) == 10 * 86400, 'Timer should reset on resume');
}

#[test]
fn test_successful_beneficiary_claim() {
    let (vault_address, vault) = deploy_vault();
    let initial_time: u64 = 1_000_000;
    start_cheat_block_timestamp(vault_address, initial_time);

    let gas_reserve: u256 = 20_000_000_000_000_000_000; // 20 STRK
    let (token_address, token) = deploy_mock_token(OWNER(), 50_000_000_000_000_000_000);

    start_cheat_caller_address(token_address, OWNER());
    token.approve(vault_address, gas_reserve);
    stop_cheat_caller_address(token_address);

    start_cheat_caller_address(vault_address, OWNER());
    vault.configure_inheritance(BENEFICIARY(), 30, gas_reserve, token_address);
    stop_cheat_caller_address(vault_address);

    // Fast forward past 30 days dormancy (31 days)
    let claim_time = initial_time + (31 * 86400);
    start_cheat_block_timestamp(vault_address, claim_time);

    assert(vault.is_claim_eligible(OWNER()), 'Vault should be eligible');
    assert(vault.get_time_until_dormant(OWNER()) == 0, 'Time remaining should be 0');

    // Beneficiary claims inheritance
    start_cheat_caller_address(vault_address, BENEFICIARY());
    vault.claim_inheritance(OWNER());
    stop_cheat_caller_address(vault_address);

    // Beneficiary received the gas reserve tokens
    assert(token.balance_of(BENEFICIARY()) == gas_reserve, 'Beneficiary did not get gas');
    assert(token.balance_of(vault_address) == 0, 'Vault should have 0 tokens');

    let config = vault.get_inheritance_config(OWNER());
    assert(config.is_claimed == true, 'Should be marked as claimed');
    assert(!vault.is_claim_eligible(OWNER()), 'Claimed vault not eligible');
}

#[test]
#[should_panic(expected: 'NotClaimEligible')]
fn test_rejection_claim_before_dormancy() {
    let (vault_address, vault) = deploy_vault();
    let initial_time: u64 = 1_000_000;
    start_cheat_block_timestamp(vault_address, initial_time);

    let zero_addr: ContractAddress = 0.try_into().unwrap();
    start_cheat_caller_address(vault_address, OWNER());
    vault.configure_inheritance(BENEFICIARY(), 30, 0, zero_addr);
    stop_cheat_caller_address(vault_address);

    // Only 20 days passed
    start_cheat_block_timestamp(vault_address, initial_time + (20 * 86400));

    // Beneficiary attempts to claim early
    start_cheat_caller_address(vault_address, BENEFICIARY());
    vault.claim_inheritance(OWNER());
    stop_cheat_caller_address(vault_address);
}

#[test]
#[should_panic(expected: 'UnauthorizedClaimer')]
fn test_rejection_unauthorized_claim() {
    let (vault_address, vault) = deploy_vault();
    let initial_time: u64 = 1_000_000;
    start_cheat_block_timestamp(vault_address, initial_time);

    let zero_addr: ContractAddress = 0.try_into().unwrap();
    start_cheat_caller_address(vault_address, OWNER());
    vault.configure_inheritance(BENEFICIARY(), 30, 0, zero_addr);
    stop_cheat_caller_address(vault_address);

    // Past 30 days
    start_cheat_block_timestamp(vault_address, initial_time + (35 * 86400));

    // Stranger tries to claim
    start_cheat_caller_address(vault_address, STRANGER());
    vault.claim_inheritance(OWNER());
    stop_cheat_caller_address(vault_address);
}

#[test]
fn test_withdraw_gas_reserve() {
    let (vault_address, vault) = deploy_vault();
    let initial_time: u64 = 1_000_000;
    start_cheat_block_timestamp(vault_address, initial_time);

    let gas_reserve: u256 = 15_000_000_000_000_000_000; // 15 STRK
    let (token_address, token) = deploy_mock_token(OWNER(), 30_000_000_000_000_000_000);

    start_cheat_caller_address(token_address, OWNER());
    token.approve(vault_address, gas_reserve);
    stop_cheat_caller_address(token_address);

    start_cheat_caller_address(vault_address, OWNER());
    vault.configure_inheritance(BENEFICIARY(), 30, gas_reserve, token_address);

    // Owner withdraws gas reserve to RECIPIENT
    vault.withdraw_gas_reserve(RECIPIENT());
    stop_cheat_caller_address(vault_address);

    assert(token.balance_of(RECIPIENT()) == gas_reserve, 'Recipient did not get funds');
    assert(token.balance_of(vault_address) == 0, 'Vault should have 0 tokens');

    let (remaining_gas, _) = vault.get_gas_reserve(OWNER());
    assert(remaining_gas == 0, 'Gas reserve should be 0');
}
