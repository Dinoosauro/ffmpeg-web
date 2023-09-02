const path = require('path');
const fs = require("fs");
const HtmlWebpackPlugin = require('html-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin');
const cleanCss = require("clean-css");
if (fs.existsSync("dist/")) fs.rmdirSync("dist/", { recursive: true, force: true });
fs.mkdirSync("dist");
fs.mkdirSync("dist/assets");
for (let item of ["service-worker.js", "updatecode.txt", "netlify.toml", "vercel.json", "manifest.json", "assets/logo.png", "assets/mergedAssets.json", "translations/it.json"]) {
    if (item.indexOf("/") !== -1 && !fs.existsSync(`dist/${item.substring(0, item.lastIndexOf("/"))}`)) fs.mkdirSync(`dist/${item.substring(0, item.lastIndexOf("/"))}`);
    fs.copyFileSync(item, `dist/${item}`);
}
module.exports = {
    entry: "./script.js",
    output: {
      filename: 'out.js',
      path: path.resolve(__dirname, 'dist'),
    },
    mode: 'production',
    optimization: {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            keep_fnames: true
          }
        })
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: 'index.html',
        scriptLoading: "blocking",
        path: path.resolve(__dirname, 'dist')
      })
    ]
  }
  new cleanCss({ returnPromise: true }).minify(fs.readFileSync("./style.css")).then((res) => {fs.writeFileSync("dist/style.css", res.styles)});