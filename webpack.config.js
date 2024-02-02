var path = require("path")
// import path from "path";
// import { fileURLToPath } from "url";
// const __dirname = path.dirname(fileURLToPath(import.meta.url));

module.exports = {
    entry: './index.js',
    experiments: {
        outputModule: true
    },
    output: {
        path:  path.resolve(__dirname, 'dist'),
        filename: 'worker.js',
        library: {
            type: 'module'
        }
    },
    externals:{"/router.js":"/router.js"}
  };