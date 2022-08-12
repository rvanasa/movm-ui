use std::sync::Mutex;

use lazy_static::lazy_static;
use send_wrapper::SendWrapper;
// use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

use motoko::check::parse;
use motoko::vm::{core_init, core_step};
use motoko::vm_types::Core;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

lazy_static! {
    #[wasm_bindgen]
    static ref HISTORY: Mutex<Vec<SendWrapper<Core>>> = Mutex::new(vec![]);
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    // fn history_callback(s: &str);
    // fn end_callback(s: &str);
}

#[wasm_bindgen(start)]
pub fn start() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn set_input(input: &str) {
    let prog = parse(&input).expect("Unable to parse file");

    let core = core_init(prog);

    let history = &mut *HISTORY.lock().unwrap();
    history.clear();
    history.push(SendWrapper::new(core));
}

#[wasm_bindgen]
pub fn forward() -> Option<String> {
    let history = &mut *HISTORY.lock().unwrap();

    if !history.is_empty() {
        let mut core = history[history.len() - 1].clone();
        match core_step(
            &mut core,
            &motoko::vm_types::Limits {
                step: None,
                stack: None,
                call: None,
                alloc: None,
                send: None,
            },
        ) {
            Ok(_) => {
                history.push(core);
                None
            }
            Err(end) => Some(serde_json::to_string(&end).unwrap()),
        }
    } else {
        None
    }
}

#[wasm_bindgen]
pub fn backward() {
    let history = &mut *HISTORY.lock().unwrap();

    if history.len() > 1 {
        history.pop();
    }
}

#[wasm_bindgen]
pub fn history() -> String {
    let history = &mut *HISTORY.lock().unwrap();

    let result = &history.iter().map(|c| c.clone().take()).collect::<Vec<_>>();

    serde_json::to_string(result).unwrap()
}
