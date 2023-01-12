# Motoko VM Explorer

> ### An interactive online environment for the [Motoko VM](https://github.com/dfinity/motoko.rs).

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

Run the following commands (in `mo-vm/`):

```sh
npm ci # Install package.json dependencies
npm run build # Compile WebAssembly
npm start # Run the development server (http://localhost:3000)
```
