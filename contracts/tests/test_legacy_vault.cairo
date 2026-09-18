use starknet::ContractAddress;
use snforge_std::{
    declare, ContractClassTrait, DeclareResultTrait,
    start_cheat_caller_address, stop_cheat_caller_address,
    start_cheat_block_timestamp, spy_events, EventSpyAssertionsTrait
};
use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
use legacy_vault::interfaces::{ILegacyVaultDispatcher, ILegacyVaultDispatcherTrait};
use legacy_vault::legacy_vault::LegacyVault;

fn ADMIN() -> ContractAddress {
    'ADMIN'.try_into().unwrap()
}

fn TREASURY() -> ContractAddress {
    'TREASURY'.try_into().unwrap()
}

fn NEW_TREASURY() -> ContractAddress {
    'NEW_TREASURY'.try_into().unwrap()
}

fn OWNER() -> ContractAddress {
    'OWNER'.try_into().unwrap()
}

fn RELAYER() -> ContractAddress {
    'RELAYER'.try_into().unwrap()
}

fn RECIPIENT() -> ContractAddress {
    'RECIPIENT'.try_into().unwrap()
}

fn STRANGER() -> ContractAddress {
    'STRANGER'.try_into().unwrap()
}

const BENEFICIARY_ID: felt252 = 'STELLAR_USER_BOLIVIA_01';

fn deploy_vault() -> (ContractAddress, ILegacyVaultDispatcher) {
    let contract_class = declare("LegacyVault").unwrap().contract_class();
    let mut calldata: Array<felt252> = ArrayTrait::new();
    let admin_addr: ContractAddress = ADMIN();
    let treasury_addr: ContractAddress = TREASURY();
    admin_addr.serialize(ref calldata);
    treasury_addr.serialize(ref calldata);

    let (contract_address, _) = contract_class.deploy(@calldata).unwrap();
    let dispatcher = ILegacyVaultDispatcher { contract_address };
    (contract_address, dispatcher)
}

fn deploy_mock_token(name: ByteArray, symbol: ByteArray, initial_recipient: ContractAddress, initial_supply: u256) -> (ContractAddress, IERC20Dispatcher) {
    let contract_class = declare("MockERC20").unwrap().contract_class();
    let mut calldata: Array<felt252> = ArrayTrait::new();
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

    let usdc_amount: u256 = 1_000_000_000; // 1000 USDC (6 decimals)
    let gas_reserve: u256 = 50_000_000_000_000_000_000; // 50 STRK (18 decimals)

    let (usdc_address, usdc) = deploy_mock_token("USD Coin", "USDC", OWNER(), 5_000_000_000);
    let (strk_address, strk) = deploy_mock_token("Starknet Token", "STRK", OWNER(), 100_000_000_000_000_000_000);

    // Owner approves vault
    start_cheat_caller_address(usdc_address, OWNER());
    usdc.approve(vault_address, usdc_amount);
    stop_cheat_caller_address(usdc_address);

    start_cheat_caller_address(strk_address, OWNER());
    strk.approve(vault_address, gas_reserve);
    stop_cheat_caller_address(strk_address);

    // Owner configures remittance vault
    start_cheat_caller_address(vault_address, OWNER());
    vault.configure_inheritance(
        BENEFICIARY_ID,
        30,
        usdc_address,
        usdc_amount,
        strk_address,
        gas_reserve
    );
    stop_cheat_caller_address(vault_address);

    // Check config
    let config = vault.get_inheritance_config(OWNER());
    assert(config.beneficiary_identifier == BENEFICIARY_ID, 'Wrong beneficiary id');
    assert(config.dormancy_period_secs == 30 * 86400, 'Wrong dormancy period');
    assert(config.usdc_amount == usdc_amount, 'Wrong usdc amount');
    assert(config.usdc_token == usdc_address, 'Wrong usdc token');
    assert(config.gas_reserve_amount == gas_reserve, 'Wrong gas reserve');
    assert(config.gas_reserve_token == strk_address, 'Wrong gas token');
    assert(config.is_active == true, 'Vault should be active');
    assert(config.is_paused == false, 'Vault not paused');
    assert(config.is_claimed == false, 'Vault not claimed');
    assert(config.last_heartbeat_timestamp == initial_time, 'Wrong heartbeat');

    // Check views
    assert(vault.get_last_heartbeat(OWNER()) == initial_time, 'Wrong last heartbeat');
    assert(!vault.is_claim_eligible(OWNER()), 'Should not be eligible');
    assert(vault.get_time_until_dormant(OWNER()) == 30 * 86400, 'Wrong time until dormant');
    assert(vault.get_bridge_treasury() == TREASURY(), 'Wrong bridge treasury');
    assert(vault.get_admin() == ADMIN(), 'Wrong admin');

    // Check balances in vault
    assert(usdc.balance_of(vault_address) == usdc_amount, 'Vault missed USDC');
    assert(strk.balance_of(vault_address) == gas_reserve, 'Vault missed STRK');
}

#[test]
fn test_admin_update_bridge_treasury() {
    let (vault_address, vault) = deploy_vault();
    assert(vault.get_bridge_treasury() == TREASURY(), 'Initial treasury mismatch');

    // Admin updates treasury
    start_cheat_caller_address(vault_address, ADMIN());
    vault.set_bridge_treasury(NEW_TREASURY());
    stop_cheat_caller_address(vault_address);

    assert(vault.get_bridge_treasury() == NEW_TREASURY(), 'Treasury not updated');
}

#[test]
#[should_panic(expected: 'NotAdmin')]
fn test_stranger_cannot_update_treasury() {
    let (vault_address, vault) = deploy_vault();

    start_cheat_caller_address(vault_address, STRANGER());
    vault.set_bridge_treasury(NEW_TREASURY());
    stop_cheat_caller_address(vault_address);
}

#[test]
fn test_deposit_additional_usdc() {
    let (vault_address, vault) = deploy_vault();
    let (usdc_address, usdc) = deploy_mock_token("USD Coin", "USDC", OWNER(), 10_000_000_000);
    let zero_addr: ContractAddress = 0.try_into().unwrap();

    start_cheat_caller_address(vault_address, OWNER());
    vault.configure_inheritance(BENEFICIARY_ID, 15, usdc_address, 0, zero_addr, 0);

    // Approve and deposit 500 USDC
    let top_up: u256 = 500_000_000;
    start_cheat_caller_address(usdc_address, OWNER());
    usdc.approve(vault_address, top_up);
    stop_cheat_caller_address(usdc_address);

    vault.deposit_usdc(top_up);
    stop_cheat_caller_address(vault_address);

    let config = vault.get_inheritance_config(OWNER());
    assert(config.usdc_amount == top_up, 'USDC total mismatch');
    assert(usdc.balance_of(vault_address) == top_up, 'Vault balance mismatch');
}

#[test]
fn test_send_heartbeat() {
    let (vault_address, vault) = deploy_vault();
    let initial_time: u64 = 1_000_000;
    start_cheat_block_timestamp(vault_address, initial_time);

    let zero_addr: ContractAddress = 0.try_into().unwrap();
    start_cheat_caller_address(vault_address, OWNER());
    vault.configure_inheritance(BENEFICIARY_ID, 10, zero_addr, 0, zero_addr, 0);

    // Advance 4 days
    let new_time = initial_time + (4 * 86400);
    start_cheat_block_timestamp(vault_address, new_time);
    assert(vault.get_time_until_dormant(OWNER()) == 6 * 86400, 'Remaining should be 6 days');

    vault.send_heartbeat();
    stop_cheat_caller_address(vault_address);

    assert(vault.get_last_heartbeat(OWNER()) == new_time, 'Heartbeat not updated');
    assert(vault.get_time_until_dormant(OWNER()) == 10 * 86400, 'Timer should reset');
}

#[test]
fn test_pause_and_resume() {
    let (vault_address, vault) = deploy_vault();
    let initial_time: u64 = 1_000_000;
    start_cheat_block_timestamp(vault_address, initial_time);

    let zero_addr: ContractAddress = 0.try_into().unwrap();
    start_cheat_caller_address(vault_address, OWNER());
    vault.configure_inheritance(BENEFICIARY_ID, 10, zero_addr, 0, zero_addr, 0);

    vault.pause_inheritance();
    assert(vault.get_inheritance_config(OWNER()).is_paused == true, 'Should be paused');

    // Advance past 10 days
    start_cheat_block_timestamp(vault_address, initial_time + (15 * 86400));
    assert(!vault.is_claim_eligible(OWNER()), 'Paused vault cannot be eligible');

    // Resume
    let resume_time = initial_time + (15 * 86400);
    vault.resume_inheritance();
    stop_cheat_caller_address(vault_address);

    assert(vault.get_inheritance_config(OWNER()).is_paused == false, 'Should be unpaused');
    assert(vault.get_last_heartbeat(OWNER()) == resume_time, 'Heartbeat reset on resume');
}

#[test]
fn test_cross_border_claim_routes_to_treasury_and_emits_event() {
    let (vault_address, vault) = deploy_vault();
    let initial_time: u64 = 1_000_000;
    start_cheat_block_timestamp(vault_address, initial_time);

    let usdc_remittance: u256 = 2_500_000_000; // 2500 USDC
    let strk_gas_reserve: u256 = 40_000_000_000_000_000_000; // 40 STRK

    let (usdc_address, usdc) = deploy_mock_token("USD Coin", "USDC", OWNER(), 10_000_000_000);
    let (strk_address, strk) = deploy_mock_token("Starknet Token", "STRK", OWNER(), 100_000_000_000_000_000_000);

    start_cheat_caller_address(usdc_address, OWNER());
    usdc.approve(vault_address, usdc_remittance);
    stop_cheat_caller_address(usdc_address);

    start_cheat_caller_address(strk_address, OWNER());
    strk.approve(vault_address, strk_gas_reserve);
    stop_cheat_caller_address(strk_address);

    start_cheat_caller_address(vault_address, OWNER());
    vault.configure_inheritance(
        BENEFICIARY_ID,
        30,
        usdc_address,
        usdc_remittance,
        strk_address,
        strk_gas_reserve
    );
    stop_cheat_caller_address(vault_address);

    // Fast forward past 30 days dormancy (31 days)
    let claim_time = initial_time + (31 * 86400);
    start_cheat_block_timestamp(vault_address, claim_time);

    assert(vault.is_claim_eligible(OWNER()), 'Should be claim eligible');

    // Spy on events to verify cross-chain routing event emission
    let mut spy = spy_events();

    // Relayer / Keeper triggers cross-border remittance claim
    start_cheat_caller_address(vault_address, RELAYER());
    vault.claim_inheritance(OWNER());
    stop_cheat_caller_address(vault_address);

    // 1. Verify Bridge Treasury received USDC remittance
    assert(usdc.balance_of(TREASURY()) == usdc_remittance, 'Treasury missing USDC');

    // 2. Verify Bridge Treasury received STRK gas reserve refund
    assert(strk.balance_of(TREASURY()) == strk_gas_reserve, 'Treasury missing STRK');

    // 3. Verify Vault balances are now zero
    assert(usdc.balance_of(vault_address) == 0, 'Vault USDC should be 0');
    assert(strk.balance_of(vault_address) == 0, 'Vault STRK should be 0');

    // 4. Verify Vault state is updated
    let config = vault.get_inheritance_config(OWNER());
    assert(config.is_claimed == true, 'Should be marked claimed');
    assert(config.usdc_amount == 0, 'Config USDC should be 0');
    assert(config.gas_reserve_amount == 0, 'Config STRK should be 0');
    assert(!vault.is_claim_eligible(OWNER()), 'Claimed vault not eligible');

    // 5. Verify Event emission
    spy.assert_emitted(@array![
        (
            vault_address,
            LegacyVault::Event::InheritanceClaimed(
                LegacyVault::InheritanceClaimed {
                    vault_owner: OWNER(),
                    bridge_treasury: TREASURY(),
                    beneficiary_identifier: BENEFICIARY_ID,
                    usdc_amount: usdc_remittance,
                    target_network: 'STELLAR',
                    timestamp: claim_time,
                }
            )
        )
    ]);
}

#[test]
#[should_panic(expected: 'NotClaimEligible')]
fn test_rejection_claim_before_dormancy() {
    let (vault_address, vault) = deploy_vault();
    let initial_time: u64 = 1_000_000;
    start_cheat_block_timestamp(vault_address, initial_time);

    let zero_addr: ContractAddress = 0.try_into().unwrap();
    start_cheat_caller_address(vault_address, OWNER());
    vault.configure_inheritance(BENEFICIARY_ID, 30, zero_addr, 0, zero_addr, 0);
    stop_cheat_caller_address(vault_address);

    // Only 20 days passed
    start_cheat_block_timestamp(vault_address, initial_time + (20 * 86400));

    start_cheat_caller_address(vault_address, RELAYER());
    vault.claim_inheritance(OWNER());
    stop_cheat_caller_address(vault_address);
}

#[test]
fn test_withdraw_gas_reserve() {
    let (vault_address, vault) = deploy_vault();
    let initial_time: u64 = 1_000_000;
    start_cheat_block_timestamp(vault_address, initial_time);

    let gas_reserve: u256 = 15_000_000_000_000_000_000;
    let (strk_address, strk) = deploy_mock_token("Starknet Token", "STRK", OWNER(), 30_000_000_000_000_000_000);
    let zero_addr: ContractAddress = 0.try_into().unwrap();

    start_cheat_caller_address(strk_address, OWNER());
    strk.approve(vault_address, gas_reserve);
    stop_cheat_caller_address(strk_address);

    start_cheat_caller_address(vault_address, OWNER());
    vault.configure_inheritance(BENEFICIARY_ID, 30, zero_addr, 0, strk_address, gas_reserve);

    // Owner refunds unspent gas reserve to RECIPIENT
    vault.withdraw_gas_reserve(RECIPIENT());
    stop_cheat_caller_address(vault_address);

    assert(strk.balance_of(RECIPIENT()) == gas_reserve, 'Recipient did not get funds');
    assert(strk.balance_of(vault_address) == 0, 'Vault should have 0 tokens');
    assert(vault.get_inheritance_config(OWNER()).gas_reserve_amount == 0, 'Gas amount not 0');
}
