import path from 'path';
import watch from 'watch';
import { create } from 'ameeno-acid';
import hotReload from 'marko/hot-reload';

export default class AcidStaticSiteGeneratorPlugin {
    constructor(options = {}) {
        this.config = options.config;
        this.watchPath = options.watchPath ? path.resolve(options.watchPath) : path.resolve('.');
        this.watchExp = options.watchExpressions || [];
    }

    apply(compiler) {
        compiler.plugin('run', (compiler, done) => {
            create(this.config).then(a => {
                this.acid = a;
                done();
            }).catch(err => {
                compiler.errors.push(err.stack);
                done();
            });
        });

        compiler.plugin('watch-run', (watching, done) => {
            if (!this.watch) {
                this.watch = true;
                hotReload.enable();

                watch.watchTree(this.watchPath, {
                    ignoreDirectoryPattern: /node_modules/
                }, f => {
                    if (typeof f !== 'string') return;
                    var isTemplate = f.match(/\.marko$/);

                    if (isTemplate) {
                        hotReload.handleFileModified(f);
                        watching.invalidate();
                    }

                    // see if we match a custom extension
                    this.acid.watchExpressions.forEach(exp => {
                        if (f.match(exp)) {
                            watching.invalidate();
                        }
                    });
                });
            }

            create(this.config).then(a => {
                this.acid = a;
                done();
            });
        });

        compiler.plugin('emit', (compiler, done) => {
            return this.acid.resolveRoutes().then(outputPaths => {
                return Promise.all(outputPaths.map(outputPath => {
                    let outputFileName;
                    if (!outputPath.match(/\.html$/i)) {
                        outputFileName = [outputPath, 'index.html'].join('/');
                    } else {
                        outputFileName = outputPath;
                    }
                    outputFileName = outputFileName.replace(/^(\/+|\\)/, ''); // Remove leading slashes for webpack-dev-server

                    return Promise.resolve(this.acid.renderRoute(outputPath)).then(output => {
                        compiler.assets[outputFileName] = createAssetFromContents(output);
                    });
                })).then(() => {
                    done();
                });
            }).catch(err => {
                compiler.errors.push(err.stack);
                done();
            });
        });
    }
}

function createAssetFromContents(contents) {
    return {
        source: () => {
            return contents;
        },
        size: () => {
            return contents.length;
        }
    };
}
