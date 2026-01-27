module ibt::token {
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::object::{Self, UID};
    
    public struct IBT has drop {}
    
    public struct AdminCap has key, store {
        id: UID
    }
    
    fun init(witness: IBT, ctx: &mut TxContext) {
        let (treasury, metadata) = coin::create_currency(
            witness,
            9,
            b"IBT",
            b"Inter-Blockchain Token",
            b"Bridge token between Ethereum and Sui",
            option::none(),
            ctx
        );
        
        transfer::public_freeze_object(metadata);
        transfer::public_transfer(treasury, tx_context::sender(ctx));
        
        let admin_cap = AdminCap {
            id: object::new(ctx)
        };
        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }
    
    public entry fun mint(
        treasury: &mut TreasuryCap<IBT>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let coin = coin::mint(treasury, amount, ctx);
        transfer::public_transfer(coin, recipient);
    }
    
    public entry fun burn(
        treasury: &mut TreasuryCap<IBT>,
        coin: Coin<IBT>
    ) {
        coin::burn(treasury, coin);
    }
    
    public entry fun burn_amount(
        treasury: &mut TreasuryCap<IBT>,
        coin: &mut Coin<IBT>,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let to_burn = coin::split(coin, amount, ctx);
        coin::burn(treasury, to_burn);
    }
    
    public fun total_supply(treasury: &TreasuryCap<IBT>): u64 {
        coin::total_supply(treasury)
    }
}