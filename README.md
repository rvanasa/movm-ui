# Motoko VM Explorer

> ### An interactive online environment for the [Motoko VM](https://github.com/dfinity/motoko.rs).

#### [Online Demo](https://mo-vm.netlify.app/)

---

## Local environment

### Initial setup:

```sh
git clone https://github.com/dfinity/motoko.rs
git clone https://github.com/rvanasa/movm-ui
cd movm-ui
```

Make sure that `motoko.rs` and `movm-ui` are in the same parent directory.

### Build and run:

Run the following commands (in `movm-ui/`):

```sh
npm ci # Install package.json dependencies
npm run build # Compile WebAssembly
npm start # Run the development server (http://localhost:3000)
```
