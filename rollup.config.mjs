import fs from "node:fs";
import dotEnv from "dotenv";

import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import JavaScriptObfuscator from "javascript-obfuscator";

/**
 *
 * @param options {import("javascript-obfuscator").ObfuscatorOptions}
 * @returns {{transform(*, *): {code: string}, name: string}|{code: string}}
 */
function javascriptObfuscator(options = {}) {
  return {
    name: "javascript-obfuscator",
    transform(code, id) {
      const obfuscationResult = JavaScriptObfuscator.obfuscate(code, options);
      let result = { code: obfuscationResult.getObfuscatedCode() };

      if (options.sourceMap && options.sourceMapMode !== "inline") {
        result.map = obfuscationResult.getSourceMap();
      }

      return result;
    }
  };

}

const env = dotEnv.config().parsed;

export default {
  input: fs.readdirSync("./build/commands")
    .filter(f => f.endsWith("js")).map(file => `./build/commands/${file}`)
    .reduce((acc, file) => {
      acc[file.replace("./build/", "").replace(".js", "")] = file;
      return acc;
    }, {
      index: "./build/index.js"
    }),
  output: {
    dir: "dist",
    chunkFileNames: "includes/[hash].js",
    format: "cjs"
  },
  plugins: [
    replace(
      Object.fromEntries(Object.entries(env).map(([k, v]) => [`process.env.${k}`, `"${v}"`]))
    ),
    commonjs(),
    javascriptObfuscator({
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 1,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 1,
      debugProtection: true,
      debugProtectionInterval: 4000,
      disableConsoleOutput: false,
      identifierNamesGenerator: 'hexadecimal',
      log: false,
      numbersToExpressions: true,
      renameGlobals: false,
      selfDefending: true,
      simplify: true,
      splitStrings: true,
      splitStringsChunkLength: 5,
      stringArray: true,
      stringArrayCallsTransform: true,
      stringArrayEncoding: ['rc4'],
      stringArrayIndexShift: true,
      stringArrayRotate: true,
      stringArrayShuffle: true,
      stringArrayWrappersCount: 5,
      stringArrayWrappersChainedCalls: true,
      stringArrayWrappersParametersMaxCount: 5,
      stringArrayWrappersType: 'function',
      stringArrayThreshold: 1,
      transformObjectKeys: true,
      unicodeEscapeSequence: false
    })]

};
