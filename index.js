// CommonJS bootstrap so hosts that run `node .` work with TypeScript.
require("dotenv").config();
require("ts-node/register");
require("./src/index.ts");

