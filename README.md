# Software Development Project

## Setup
1. Clone the repo:
```bash
$ git clone https://github.com/optimalstrategy/COMP231
```

and switch to `dev`
```bash
$ git checkout dev
```

2. Install the dependencies
```bash
$ npm install -g typescript ts-node nodemon
$ npm install
```

After this step, you need to have MongoDB installed and running to proceed with the setup.

3. Run the tests. You should see something like this:
```bash
$ npm test
> jest

PASS  server/routes/demoRoute.test.ts
  A sample test demonstrating how to test APIs
    ✓ Request / should return HTTP 200 OK (54 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        1.875 s, estimated 2 s
```

4. Run the backend server
```bash
$ nodemon
```

## Development server

Run `nodemon` for a dev server. The serve will be listening on `http://localhost:3000/`. The app will automatically reload if you change any of the source files.
