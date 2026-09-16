#[starknet::contract]
pub mod LegacyVault {
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp, get_contract_address};
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};
    use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use super::super::interfaces::{ILegacyVault, InheritanceConfig};

    const SECONDS_PER_DAY: u64 = 86400;

    // --- Errors ---
    pub mod Errors {
        pub const VAULT_NOT_ACTIVE: felt252 = 'VaultNotActive';
        pub const VAULT_PAUSED: felt252 = 'VaultPaused';
        pub const ALREADY_CLAIMED: felt252 = 'AlreadyClaimed';
        pub const NOT_CLAIM_ELIGIBLE: felt252 = 'NotClaimEligible';
        pub const UNAUTHORIZED_CLAIMER: felt252 = 'UnauthorizedClaimer';
        pub const INVALID_BENEFICIARY: felt252 = 'InvalidBeneficiary';
        pub const INVALID_DORMANCY: felt252 = 'InvalidDormancy';
        pub const NO_GAS_RESERVE: felt252 = 'NoGasReserve';
        pub const ZERO_ADDRESS: felt252 = 'ZeroAddress';
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
        GasReserveRefunded: GasReserveRefunded,
    }

    #[derive(Drop, starknet::Event)]
    pub struct InheritanceConfigured {
        #[key]
        pub vault_owner: ContractAddress,
        #[key]
        pub beneficiary: ContractAddress,
        pub dormancy_period_secs: u64,
        pub gas_reserve_amount: u256,
        pub gas_reserve_token: ContractAddress,
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
        pub beneficiary: ContractAddress,
        pub claimer: ContractAddress,
        pub timestamp: u64,
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
        vault_configs: Map<ContractAddress, InheritanceConfig>,
    }

    // --- Constructor ---
    #[constructor]
    fn constructor(ref self: ContractState) {}

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

        fn get_gas_reserve(self: @ContractState, vault_owner: ContractAddress) -> (u256, ContractAddress) {
            let config = self.vault_configs.read(vault_owner);
            (config.gas_reserve_amount, config.gas_reserve_token)
        }

        fn configure_inheritance(
            ref self: ContractState,
            beneficiary: ContractAddress,
            dormancy_days: u64,
            gas_reserve_amount: u256,
            gas_reserve_token: ContractAddress,
        ) {
            let caller = get_caller_address();
            let zero_addr: ContractAddress = 0.try_into().unwrap();
            assert(beneficiary != zero_addr, Errors::INVALID_BENEFICIARY);
            assert(dormancy_days > 0, Errors::INVALID_DORMANCY);

            let dormancy_period_secs = dormancy_days * SECONDS_PER_DAY;
            let current_time = get_block_timestamp();

            // If a gas reserve is specified, transfer tokens from caller to this vault contract
            if gas_reserve_amount > 0 {
                assert(gas_reserve_token != zero_addr, Errors::ZERO_ADDRESS);
                let token = IERC20Dispatcher { contract_address: gas_reserve_token };
                token.transfer_from(caller, get_contract_address(), gas_reserve_amount);
            }

            let new_config = InheritanceConfig {
                beneficiary,
                dormancy_period_secs,
                gas_reserve_amount,
                gas_reserve_token,
                is_active: true,
                is_paused: false,
                is_claimed: false,
                last_heartbeat_timestamp: current_time,
            };

            self.vault_configs.write(caller, new_config);

            self.emit(Event::InheritanceConfigured(InheritanceConfigured {
                vault_owner: caller,
                beneficiary,
                dormancy_period_secs,
                gas_reserve_amount,
                gas_reserve_token,
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
            let caller = get_caller_address();
            let mut config = self.vault_configs.read(vault_owner);

            assert(config.is_active, Errors::VAULT_NOT_ACTIVE);
            assert(!config.is_paused, Errors::VAULT_PAUSED);
            assert(!config.is_claimed, Errors::ALREADY_CLAIMED);

            let current_time = get_block_timestamp();
            let unlock_time = config.last_heartbeat_timestamp + config.dormancy_period_secs;
            assert(current_time >= unlock_time, Errors::NOT_CLAIM_ELIGIBLE);

            // Caller must either be the beneficiary or an authorized keeper
            assert(caller == config.beneficiary, Errors::UNAUTHORIZED_CLAIMER);

            config.is_claimed = true;

            // Transfer gas reserve tokens to beneficiary if any
            let gas_amount = config.gas_reserve_amount;
            if gas_amount > 0 {
                config.gas_reserve_amount = 0;
                let token = IERC20Dispatcher { contract_address: config.gas_reserve_token };
                token.transfer(config.beneficiary, gas_amount);
            }

            self.vault_configs.write(vault_owner, config);

            self.emit(Event::InheritanceClaimed(InheritanceClaimed {
                vault_owner,
                beneficiary: config.beneficiary,
                claimer: caller,
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
