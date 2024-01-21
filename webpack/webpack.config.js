const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    mode: "production",
    entry: {
        open: path.resolve(__dirname, "..", "src", "open.ts"),
        settings: path.resolve(__dirname, "..", "src", "settings.ts"),
        popup: path.resolve(__dirname, "..", "src", "popup.ts"),
        sandbox: path.resolve(__dirname, "..", "src", "sandbox.ts"),
        datagen: path.resolve(__dirname, "..", "src", "datagen.ts"),
        dashboard: path.resolve(__dirname, "..", "src", "dashboard.ts"),
        dom: path.resolve(__dirname, "..", "src", "dom.ts"),
        project: path.resolve(__dirname, "..", "src", "project.ts"),
    },
    output: {
        path: path.join(__dirname, "../dist"),
        filename: "[name].js",
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
        ],
    },
    plugins: [
        new MiniCssExtractPlugin(),
        new CopyPlugin({
            patterns: [{from: ".", to: ".", context: "public"}]
        }),
        new CopyWebpackPlugin({
            patterns: [{
                from: 'node_modules/webextension-polyfill/dist/browser-polyfill.js',
            }],
        }),
    ],
};