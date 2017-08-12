const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: {
        app: [
            path.resolve(__dirname, 'lib/index.js'),
        ],
    },

    output: {
        filename: 'powerdi.min.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'umd',
        library: "PowerDI"
    },

    module: {
    },

    plugins: [
        new webpack.DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify("production")
            }
        }),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.optimize.UglifyJsPlugin({
            // comments: false,
            // mangle: false,
            // compress: {
            //     warnings: false
            // }
        })
    ],
}