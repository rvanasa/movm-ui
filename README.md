# Motoko VM

> ### An online Motoko virtual machine.

#### [Online Demo](https://mo-vm.netlify.app/)

---

## Local environment

### Initial setup:

```sh
git clone https://github.com/dfinity/motoko.rs
git clone https://github.com/rvanasa/mo-vm

cd mo-vm
```

Make sure that `motoko.rs` and `mo-vm` are in the same parent directory.

### Build and run:

Run the following commands in the `mo-vm` root directory:

```sh
npm ci # Update npm dependencies
npm run build # Compile WASM
npm start # Run the web server (localhost:3000)
```
