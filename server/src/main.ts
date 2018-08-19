// import * as program from "commander";
import { createLspConnection } from "./connection";

// program
//     .version("0.1.0")
//     .usage("[options]")
//     .option("--foo", "Just a test flag")
//     .parse(process.argv);

createLspConnection().listen();
