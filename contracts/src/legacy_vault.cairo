#[starknet::contract]
pub mod LegacyVault {
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp, get_contract_address};
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess,
        StoragePointerReadAccess, StoragePointerWriteAccess
    };
    use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use super::super::interfaces::{ILegacyVault, InheritanceConfig};

    const SECONDS_PER_DAY: u64 = 86400;
    const TARGET_STELLAR: felt252 = 'STELLAR';

    // --- Errors ---
    pub mod Errors {
        pub const NOT_ADMIN: felt252 = 'NotAdmin';
        pub const VAULT_NOT_ACTIVE: felt252 = 'VaultNotActive';
        pub const VAULT_PAUSED: felt252 = 'VaultPaused';
        pub const ALREADY_CLAIMED: felt252 = 'AlreadyClaimed';
        pub const NOT_CLAIM_ELIGIBLE: felt252 = 'NotClaimEligible';
        pub const INVALID_BENEFICIARY: felt252 = 'InvalidBeneficiary';
        pub const INVALID_DORMANCY: felt252 = 'InvalidDormancy';
        pub const NO_GAS_RESERVE: felt252 = 'NoGasReserve';
        pub const ZERO_ADDRESS: felt252 = 'ZeroAddress';
        pub const ZERO_AMOUNT: felt252 = 'ZeroAmount';
    }

    // --- Events ---
    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        InheritanceConfigured: InheritanceConfigured,
        HeartbeatReceived: HeartbeatReceived,
        InheritancePaused: InheritancePaused,
        InheritanceResumed: InheritanceResumed,
        InheritanceClaimed: InheritanceClaimed,
        BridgeTreasuryUpdated: BridgeTreasuryUpdated,
        AdminTransferred: AdminTransferred,
        UsdcDeposited: UsdcDeposited,
        GasReserveRefunded: GasReserveRefunded,
    }

    #[derive(Drop, starknet::Event)]
    pub struct InheritanceConfigured {
        #[key]
        pub vault_owner: ContractAddress,
        pub beneficiary_identifier: felt252,
        pub dormancy_period_secs: u64,
        pub usdc_amount: u256,
        pub gas_reserve_amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct HeartbeatReceived {
        #[key]
        pub vault_owner: ContractAddress,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct InheritancePaused {
        #[key]
        pub vault_owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct InheritanceResumed {
        #[key]
        pub vault_owner: ContractAddress,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct InheritanceClaimed {
        #[key]
        pub vault_owner: ContractAddress,
        #[key]
        pub bridge_treasury: ContractAddress,
        pub beneficiary_identifier: felt252,
        pub usdc_amount: u256,
        pub target_network: felt252,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct BridgeTreasuryUpdated {
        pub old_treasury: ContractAddress,
        pub new_treasury: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct AdminTransferred {
        pub old_admin: ContractAddress,
        pub new_admin: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct UsdcDeposited {
        #[key]
        pub vault_owner: ContractAddress,
        pub amount: u256,
        pub new_total: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct GasReserveRefunded {
        #[key]
        pub vault_owner: ContractAddress,
        #[key]
        pub recipient: ContractAddress,
        pub amount: u256,
    }

    // --- Storage ---
    #[storage]
    struct Storage {
        admin: ContractAddress,
        bridge_treasury: ContractAddress,
        vault_configs: Map<ContractAddress, InheritanceConfig>,
    }

    // --- Constructor ---
    #[constructor]
    fn constructor(
        ref self: ContractState,
        initial_admin: ContractAddress,
        initial_treasury: ContractAddress
    ) {
        let zero_addr: ContractAddress = 0.try_into().unwrap();
        assert(initial_admin != zero_addr, Errors::ZERO_ADDRESS);
        assert(initial_treasury != zero_addr, Errors::ZERO_ADDRESS);

        self.admin.write(initial_admin);
        self.bridge_treasury.write(initial_treasury);
    }

    // --- Implementation ---
    #[abi(embed_v0)]
    impl LegacyVaultImpl of ILegacyVault<ContractState> {
        fn get_inheritance_config(self: @ContractState, vault_owner: ContractAddress) -> InheritanceConfig {
            self.vault_configs.read(vault_owner)
        }

        fn get_last_heartbeat(self: @ContractState, vault_owner: ContractAddress) -> u64 {
            let config = self.vault_configs.read(vault_owner);
            config.last_heartbeat_timestamp
        }

        fn is_claim_eligible(self: @ContractState, vault_owner: ContractAddress) -> bool {
            let config = self.vault_configs.read(vault_owner);
            if !config.is_active || config.is_paused || config.is_claimed {
                return false;
            }
            let current_time = get_block_timestamp();
            let unlock_time = config.last_heartbeat_timestamp + config.dormancy_period_secs;
            current_time >= unlock_time
        }

        fn get_time_until_dormant(self: @ContractState, vault_owner: ContractAddress) -> u64 {
            let config = self.vault_configs.read(vault_owner);
            if !config.is_active || config.is_paused || config.is_claimed {
                return 0;
            }
            let current_time = get_block_timestamp();
            let unlock_time = config.last_heartbeat_timestamp + config.dormancy_period_secs;
            if current_time >= unlock_time {
                0
            } else {
                unlock_time - current_time
            }
        }

        fn get_bridge_treasury(self: @ContractState) -> ContractAddress {
            self.bridge_treasury.read()
        }

        fn get_admin(self: @ContractState) -> ContractAddress {
            self.admin.read()
        }

        fn set_bridge_treasury(ref self: ContractState, new_treasury: ContractAddress) {
            let caller = get_caller_address();
            assert(caller == self.admin.read(), Errors::NOT_ADMIN);

            let zero_addr: ContractAddress = 0.try_into().unwrap();
            assert(new_treasury != zero_addr, Errors::ZERO_ADDRESS);

            let old_treasury = self.bridge_treasury.read();
            self.bridge_treasury.write(new_treasury);

            self.emit(Event::BridgeTreasuryUpdated(BridgeTreasuryUpdated {
                old_treasury,
                new_treasury,
            }));
        }

        fn transfer_admin(ref self: ContractState, new_admin: ContractAddress) {
            let caller = get_caller_address();
            assert(caller == self.admin.read(), Errors::NOT_ADMIN);

            let zero_addr: ContractAddress = 0.try_into().unwrap();
            assert(new_admin != zero_addr, Errors::ZERO_ADDRESS);

            let old_admin = self.admin.read();
            self.admin.write(new_admin);

            self.emit(Event::AdminTransferred(AdminTransferred {
                old_admin,
                new_admin,
            }));
        }

        fn configure_inheritance(
            ref self: ContractState,
            beneficiary_identifier: felt252,
            dormancy_days: u64,
            usdc_token: ContractAddress,
            usdc_amount: u256,
            gas_reserve_token: ContractAddress,
            gas_reserve_amount: u256,
        ) {
            let caller = get_caller_address();
            let zero_addr: ContractAddress = 0.try_into().unwrap();

            assert(beneficiary_identifier != 0, Errors::INVALID_BENEFICIARY);
            assert(dormancy_days > 0, Errors::INVALID_DORMANCY);

            let dormancy_period_secs = dormancy_days * SECONDS_PER_DAY;
            let current_time = get_block_timestamp();

            // Transfer USDC remittance deposit if specified
            if usdc_amount > 0 {
                assert(usdc_token != zero_addr, Errors::ZERO_ADDRESS);
                let token = IERC20Dispatcher { contract_address: usdc_token };
                token.transfer_from(caller, get_contract_address(), usdc_amount);
            }

            // Transfer STRK gas reserve deposit if specified
            if gas_reserve_amount > 0 {
                assert(gas_reserve_token != zero_addr, Errors::ZERO_ADDRESS);
                let token = IERC20Dispatcher { contract_address: gas_reserve_token };
                token.transfer_from(caller, get_contract_address(), gas_reserve_amount);
            }

            let new_config = InheritanceConfig {
                beneficiary_identifier,
                dormancy_period_secs,
                usdc_token,
                usdc_amount,
                gas_reserve_token,
                gas_reserve_amount,
                is_active: true,
                is_paused: false,
                is_claimed: false,
                last_heartbeat_timestamp: current_time,
            };

            self.vault_configs.write(caller, new_config);

            self.emit(Event::InheritanceConfigured(InheritanceConfigured {
                vault_owner: caller,
                beneficiary_identifier,
                dormancy_period_secs,
                usdc_amount,
                gas_reserve_amount,
            }));
        }

        fn deposit_usdc(ref self: ContractState, amount: u256) {
            let caller = get_caller_address();
            assert(amount > 0, Errors::ZERO_AMOUNT);

            let mut config = self.vault_configs.read(caller);
            assert(config.is_active, Errors::VAULT_NOT_ACTIVE);
            assert(!config.is_claimed, Errors::ALREADY_CLAIMED);

            let token = IERC20Dispatcher { contract_address: config.usdc_token };
            token.transfer_from(caller, get_contract_address(), amount);

            config.usdc_amount += amount;
            self.vault_configs.write(caller, config);

            self.emit(Event::UsdcDeposited(UsdcDeposited {
                vault_owner: caller,
                amount,
                new_total: config.usdc_amount,
            }));
        }

        fn send_heartbeat(ref self: ContractState) {
            let caller = get_caller_address();
            let mut config = self.vault_configs.read(caller);
            assert(config.is_active, Errors::VAULT_NOT_ACTIVE);
            assert(!config.is_claimed, Errors::ALREADY_CLAIMED);

            let current_time = get_block_timestamp();
            config.last_heartbeat_timestamp = current_time;
            config.is_paused = false;

            self.vault_configs.write(caller, config);

            self.emit(Event::HeartbeatReceived(HeartbeatReceived {
                vault_owner: caller,
                timestamp: current_time,
            }));
        }

        fn pause_inheritance(ref self: ContractState) {
            let caller = get_caller_address();
            let mut config = self.vault_configs.read(caller);
            assert(config.is_active, Errors::VAULT_NOT_ACTIVE);
            assert(!config.is_claimed, Errors::ALREADY_CLAIMED);

            config.is_paused = true;
            self.vault_configs.write(caller, config);

            self.emit(Event::InheritancePaused(InheritancePaused {
                vault_owner: caller,
            }));
        }

        fn resume_inheritance(ref self: ContractState) {
            let caller = get_caller_address();
            let mut config = self.vault_configs.read(caller);
            assert(config.is_active, Errors::VAULT_NOT_ACTIVE);
            assert(!config.is_claimed, Errors::ALREADY_CLAIMED);

            let current_time = get_block_timestamp();
            config.is_paused = false;
            config.last_heartbeat_timestamp = current_time;

            self.vault_configs.write(caller, config);

            self.emit(Event::InheritanceResumed(InheritanceResumed {
                vault_owner: caller,
                timestamp: current_time,
            }));
        }

        fn claim_inheritance(ref self: ContractState, vault_owner: ContractAddress) {
            let mut config = self.vault_configs.read(vault_owner);

            assert(config.is_active, Errors::VAULT_NOT_ACTIVE);
            assert(!config.is_paused, Errors::VAULT_PAUSED);
            assert(!config.is_claimed, Errors::ALREADY_CLAIMED);

            let current_time = get_block_timestamp();
            let unlock_time = config.last_heartbeat_timestamp + config.dormancy_period_secs;
            assert(current_time >= unlock_time, Errors::NOT_CLAIM_ELIGIBLE);

            let treasury = self.bridge_treasury.read();
            let usdc_to_transfer = config.usdc_amount;
            let strk_to_sweep = config.gas_reserve_amount;

            config.is_claimed = true;
            config.usdc_amount = 0;
            config.gas_reserve_amount = 0;
            self.vault_configs.write(vault_owner, config);

            // 1. Remit USDC to bridge treasury
            if usdc_to_transfer > 0 {
                let usdc = IERC20Dispatcher { contract_address: config.usdc_token };
                usdc.transfer(treasury, usdc_to_transfer);
            }

            // 2. Sweep remaining STRK gas reserve to treasury as relayer compensation
            if strk_to_sweep > 0 {
                let strk = IERC20Dispatcher { contract_address: config.gas_reserve_token };
                strk.transfer(treasury, strk_to_sweep);
            }

            // 3. Emit Cross-Chain Claim event for off-chain indexer settlement on Stellar
            self.emit(Event::InheritanceClaimed(InheritanceClaimed {
                vault_owner,
                bridge_treasury: treasury,
                beneficiary_identifier: config.beneficiary_identifier,
                usdc_amount: usdc_to_transfer,
                target_network: TARGET_STELLAR,
                timestamp: current_time,
            }));
        }

        fn withdraw_gas_reserve(ref self: ContractState, recipient: ContractAddress) {
            let caller = get_caller_address();
            let zero_addr: ContractAddress = 0.try_into().unwrap();
            assert(recipient != zero_addr, Errors::ZERO_ADDRESS);

            let mut config = self.vault_configs.read(caller);
            assert(config.is_active, Errors::VAULT_NOT_ACTIVE);
            assert(!config.is_claimed, Errors::ALREADY_CLAIMED);

            let amount = config.gas_reserve_amount;
            assert(amount > 0, Errors::NO_GAS_RESERVE);

            config.gas_reserve_amount = 0;
            self.vault_configs.write(caller, config);

            let token = IERC20Dispatcher { contract_address: config.gas_reserve_token };
            token.transfer(recipient, amount);

            self.emit(Event::GasReserveRefunded(GasReserveRefunded {
                vault_owner: caller,
                recipient,
                amount,
            }));
        }
    }
}
