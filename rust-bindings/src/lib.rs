mod utils;

use wasm_bindgen::prelude::*;
use motoko::

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern {
    // fn alert(s: &str);
}

#[wasm_bindgen]
pub fn set_code(input: &str) {
    // alert("Hello, rust-bindings!");
}
