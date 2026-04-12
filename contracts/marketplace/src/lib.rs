#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, vec, Address, Env, IntoVal, Symbol,
};

#[contract]
pub struct Marketplace;

#[derive(Clone)]
#[contracttype]
pub struct Listing {
    pub seller: Address,
    pub price: i128,
    pub active: bool,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Initialized,
    PaymentToken,
    RoyaltyPool,
    Listing(Address, u64),
}

#[contractimpl]
impl Marketplace {
    pub fn initialize(env: Env, admin: Address, payment_token: Address, royalty_pool: Address) {
        if env
            .storage()
            .instance()
            .has(&DataKey::Initialized)
        {
            panic!("already initialized");
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::PaymentToken, &payment_token);
        env.storage()
            .instance()
            .set(&DataKey::RoyaltyPool, &royalty_pool);
        env.storage().instance().set(&DataKey::Initialized, &true);
    }

    pub fn list_nft(env: Env, nft: Address, seller: Address, token_id: u64, price: i128) {
        if price <= 0 {
            panic!("price must be positive");
        }
        seller.require_auth();

        let market = env.current_contract_address();
        env.invoke_contract::<()>(
            &nft,
            &Symbol::new(&env, "transfer"),
            vec![&env, seller.clone().into_val(&env), market.into_val(&env), token_id.into_val(&env)],
        );

        let listing = Listing {
            seller: seller.clone(),
            price,
            active: true,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Listing(nft.clone(), token_id), &listing);

        env.events()
            .publish((symbol_short!("listed"), nft, token_id), (seller, price));
    }

    pub fn buy_nft(env: Env, nft: Address, buyer: Address, token_id: u64) {
        buyer.require_auth();

        let key = DataKey::Listing(nft.clone(), token_id);
        let mut listing: Listing = env.storage().persistent().get(&key).unwrap();
        if !listing.active {
            panic!("not listed");
        }
        listing.active = false;
        env.storage().persistent().set(&key, &listing);

        let (royalty_receiver, royalty_amount) = env.invoke_contract::<(Address, i128)>(
            &nft,
            &Symbol::new(&env, "royalty_info"),
            vec![&env, token_id.into_val(&env), listing.price.into_val(&env)],
        );

        let configured_pool: Address = env.storage().instance().get(&DataKey::RoyaltyPool).unwrap();
        let token_id_for_payment: Address = env.storage().instance().get(&DataKey::PaymentToken).unwrap();
        if royalty_amount > 0 && royalty_receiver == configured_pool {
            env.invoke_contract::<()>(
                &configured_pool,
                &Symbol::new(&env, "distribute"),
                vec![&env, buyer.clone().into_val(&env), royalty_amount.into_val(&env)],
            );
        }

        let seller_proceeds = listing.price - royalty_amount;
        if seller_proceeds > 0 {
            let token_client = token::Client::new(&env, &token_id_for_payment);
            token_client.transfer(&buyer, &listing.seller, &seller_proceeds);
        }

        env.invoke_contract::<()>(
            &nft,
            &Symbol::new(&env, "transfer"),
            vec![
                &env,
                env.current_contract_address().into_val(&env),
                buyer.clone().into_val(&env),
                token_id.into_val(&env),
            ],
        );

        env.events()
            .publish((symbol_short!("sold"), nft, token_id), (buyer, listing.price, royalty_amount));
    }

    pub fn cancel_listing(env: Env, nft: Address, seller: Address, token_id: u64) {
        seller.require_auth();

        let key = DataKey::Listing(nft.clone(), token_id);
        let mut listing: Listing = env.storage().persistent().get(&key).unwrap();
        if listing.seller != seller || !listing.active {
            panic!("not active seller listing");
        }
        listing.active = false;
        env.storage().persistent().set(&key, &listing);

        env.invoke_contract::<()>(
            &nft,
            &Symbol::new(&env, "transfer"),
            vec![
                &env,
                env.current_contract_address().into_val(&env),
                seller.clone().into_val(&env),
                token_id.into_val(&env),
            ],
        );

        env.events()
            .publish((symbol_short!("cancel"), nft, token_id), seller);
    }

    pub fn listing(env: Env, nft: Address, token_id: u64) -> Listing {
        env.storage()
            .persistent()
            .get(&DataKey::Listing(nft, token_id))
            .unwrap()
    }
}
