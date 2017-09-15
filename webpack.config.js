const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: {
        core: [
            path.resolve(__dirname, 'lib/index.js'),
        ],
        react: [
            path.resolve(__dirname, 'lib/react/index.js'),
        ],
        helper: [
            path.resolve(__dirname, 'lib/helper/index.js'),
        ],
        utils: [
            path.resolve(__dirname, 'lib/utils/index.js'),
        ],
    },

    output: {
        filename: 'powerdi.[name].min.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'umd',
        library: "powerdi"
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
        new webpack.optimize.UglifyJsPlugin()
    ],
}
