const path = require('path');

module.exports = {
    entry: './juice/core.js',
    mode: 'development',
    devtool: 'inline-source-map',
    output: {
        filename: 'juice.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
        library: 'juice',
    },
    resolve: {
        modules: [path.resolve(__dirname, './juice')],
        extensions: ['.js', '.json'],
    },
};
