'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _watch = require('watch');

var _watch2 = _interopRequireDefault(_watch);

var _ameenoAcid = require('ameeno-acid');

var _hotReload = require('marko/hot-reload');

var _hotReload2 = _interopRequireDefault(_hotReload);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AcidStaticSiteGeneratorPlugin = function () {
    function AcidStaticSiteGeneratorPlugin(options) {
        _classCallCheck(this, AcidStaticSiteGeneratorPlugin);

        this.config = options.config;
        this.watchPath = options.watchPath ? _path2.default.resolve(options.watchPath) : _path2.default.resolve('.');
    }

    _createClass(AcidStaticSiteGeneratorPlugin, [{
        key: 'apply',
        value: function apply(compiler) {
            var _this = this;

            compiler.plugin('run', function (compiler, done) {
                (0, _ameenoAcid.create)(_this.config).then(function (a) {
                    _this.acid = a;
                    done();
                }).catch(function (err) {
                    compiler.errors.push(err.stack);
                    done();
                });
            });

            compiler.plugin('watch-run', function (watching, done) {
                if (!_this.watch) {
                    _this.watch = true;
                    _hotReload2.default.enable();

                    _watch2.default.watchTree(_this.watchPath, {
                        ignoreDirectoryPattern: /node_modules/
                    }, function (f) {
                        if (typeof f !== 'string') return;
                        var isTemplate = f.indexOf('.marko') !== -1 && f.indexOf('.marko.js') === -1;

                        if (isTemplate) {
                            _hotReload2.default.handleFileModified(f);
                            watching.invalidate();
                        }
                    });
                }

                (0, _ameenoAcid.create)(_this.config).then(function (a) {
                    _this.acid = a;
                    done();
                });
            });

            compiler.plugin('emit', function (compiler, done) {
                return _this.acid.resolveRoutes().then(function (outputPaths) {
                    return Promise.all(outputPaths.map(function (outputPath) {
                        var p = _path2.default.parse(outputPath);

                        var outputFileName = undefined;
                        if (!p.ext) {
                            outputFileName = _path2.default.join(p.dir, p.base, 'index.html');
                        } else {
                            outputFileName = outputPath;
                        }
                        outputFileName = outputFileName.replace(/^(\/+|\\)/, ''); // Remove leading slashes for webpack-dev-server

                        return Promise.resolve(_this.acid.renderRoute(outputPath)).then(function (output) {
                            compiler.assets[outputFileName] = createAssetFromContents(output);
                        });
                    })).then(function () {
                        done();
                    });
                }).catch(function (err) {
                    compiler.errors.push(err.stack);
                    done();
                });
            });
        }
    }]);

    return AcidStaticSiteGeneratorPlugin;
}();

exports.default = AcidStaticSiteGeneratorPlugin;


function createAssetFromContents(contents) {
    return {
        source: function source() {
            return contents;
        },
        size: function size() {
            return contents.length;
        }
    };
}