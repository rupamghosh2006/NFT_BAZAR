#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String};

#[contract]
pub struct NFTCollection;

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Initialized,
    Name,
    Symbol,
    TokenCounter,
    Owner(u64),
    TokenUri(u64),
    RoyaltyPool,
    RoyaltyBps,
}

#[contractimpl]
impl NFTCollection {
    pub fn initialize(
        env: Env,
        admin: Address,
        royalty_pool: Address,
        royalty_bps: i128,
        name: String,
        symbol: String,
    ) {
        if env
            .storage()
            .instance()
            .has(&DataKey::Initialized)
        {
            panic!("already initialized");
        }
        if royalty_bps < 0 || royalty_bps > 10_000 {
            panic!("royalty bps must be 0..10000");
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::RoyaltyPool, &royalty_pool);
        env.storage()
            .instance()
            .set(&DataKey::RoyaltyBps, &royalty_bps);
        env.storage().instance().set(&DataKey::Name, &name);
        env.storage().instance().set(&DataKey::Symbol, &symbol);
        env.storage().instance().set(&DataKey::TokenCounter, &0_u64);
        env.storage().instance().set(&DataKey::Initialized, &true);
    }

    pub fn mint(env: Env, to: Address, token_uri: String) -> u64 {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut token_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::TokenCounter)
            .unwrap_or(0);
        token_id += 1;

        env.storage().instance().set(&DataKey::TokenCounter, &token_id);
        env.storage()
            .persistent()
            .set(&DataKey::Owner(token_id), &to);
        env.storage()
            .persistent()
            .set(&DataKey::TokenUri(token_id), &token_uri);

        env.events()
            .publish((symbol_short!("mint"), token_id), (to, token_uri));
        token_id
    }

    pub fn owner_of(env: Env, token_id: u64) -> Address {
        env.storage()
            .persistent()
            .get(&DataKey::Owner(token_id))
            .unwrap()
    }

    pub fn token_uri(env: Env, token_id: u64) -> String {
        env.storage()
            .persistent()
            .get(&DataKey::TokenUri(token_id))
            .unwrap()
    }

    pub fn transfer(env: Env, from: Address, to: Address, token_id: u64) {
        from.require_auth();

        let owner: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Owner(token_id))
            .unwrap();
        if owner != from {
            panic!("from is not owner");
        }

        env.storage()
            .persistent()
            .set(&DataKey::Owner(token_id), &to);
        env.events()
            .publish((symbol_short!("transfer"), token_id), (from, to));
    }

    pub fn royalty_info(env: Env, _token_id: u64, sale_price: i128) -> (Address, i128) {
        let receiver: Address = env.storage().instance().get(&DataKey::RoyaltyPool).unwrap();
        let bps: i128 = env.storage().instance().get(&DataKey::RoyaltyBps).unwrap();
        (receiver, (sale_price * bps) / 10_000)
    }

    pub fn name(env: Env) -> String {
        env.storage().instance().get(&DataKey::Name).unwrap()
    }

    pub fn symbol(env: Env) -> String {
        env.storage().instance().get(&DataKey::Symbol).unwrap()
    }
}
