# webpack-plugin-acid

webpack-plugin-acid lets you add your [Acid static site](https://github.com/drewschrauf/ameeno-acid) to your [Webpack](https://webpack.github.io/) build. This lets you automatically watch your templates and build your static site along with the rest of your assets.

It should be noted that this plugin simply adds the compiled HTML of your site to your Webpack output and does not actually pass the assets through your pipeline.

## Usage

Just add the plugin to your webpack.config.js:

    var AcidPlugin = require('webpack-plugin-acid');
    module.exports = {
        entry: {...},
        output: {...},
        module: {...},
        plugins: [
            new AcidPlugin()
        ]
    }

## Options

`webpack-plugin-acid` accepts the following options as an object:

    new AcidPlugin({
        config: {},
        watchPath: '...'
    })

- `config` (object, optional) - Causes the Acid instance to be initiated with the passed configuration object rather than loading it from `acid.config.js`.
- `watchPath` (string, optional) - Choose the directory to watch for changes to `*.marko` files. By default, this will watch for any templates in the entire project (excluding `node_modules`).

## Acknowledgements

This plugin was heavily inspired by (and shamelessly stole code from) [static-site-generator-webpack-plugin](https://github.com/markdalgleish/static-site-generator-webpack-plugin).
