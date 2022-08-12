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
    #[no_mangle]
    #[wasm_bindgen]
    static ref HISTORY: Mutex<Vec<SendWrapper<Core>>> = Mutex::new(vec![]);
}

#[no_mangle]
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    fn history_callback(s: &str);
    fn end_callback(s: &str);
    fn vm_input() -> String;
}

#[no_mangle]
#[wasm_bindgen(start)]
pub fn start() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[no_mangle]
#[wasm_bindgen]
pub fn set_input(input: &str) {
    let prog = parse(&input).expect("Unable to parse file");

    let core = core_init(prog);

    let history = &mut *HISTORY.lock().unwrap();
    history.clear();
    history.push(SendWrapper::new(core));
}

#[no_mangle]
#[wasm_bindgen]
pub fn forward() {
    let history = &mut *HISTORY.lock().unwrap();

    if !history.is_empty() {
        let mut core = history[history.len() - 1].clone();
        match core_step(
            &mut core,
            &motoko::vm::Limits {
                step: None,
                stack: None,
                call: None,
                alloc: None,
                send: None,
            },
        ) {
            Ok(_) => history.push(core),
            Err(err) => end_callback(&serde_json::to_string(&err).unwrap()),
        };
    }
}

#[no_mangle]
#[wasm_bindgen]
pub fn backward() {
    let history = &mut *HISTORY.lock().unwrap();

    if history.len() > 1 {
        history.pop();
    }
}

#[no_mangle]
#[wasm_bindgen]
pub fn history() -> String {
    let history = &mut *HISTORY.lock().unwrap();

    // log(&format!("{:?}", history));

    let result = &history.iter().map(|c| c.clone().take()).collect::<Vec<_>>();

    // log(&format!("{}", serde_json::to_string(result).unwrap()));

    history_callback(&format!("{}", serde_json::to_string(result).unwrap()));

    serde_json::to_string(result).unwrap()
}

#[no_mangle]
#[wasm_bindgen]
pub fn test(s: &str) -> String {
    log(&format!(">>>>>> {}", s));

    "AAAA".to_string()
}
