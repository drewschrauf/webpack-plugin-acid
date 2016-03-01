import path from 'path';
import watch from 'watch';
import { create } from 'ameeno-acid';
import hotReload from 'marko/hot-reload';

export default class AcidStaticSiteGeneratorPlugin {
    constructor(config, watchPath) {
        this.config = config;
        if (watchPath) {
            this.watchPath = path.resolve(watchPath);
        }
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
            if (this.watchPath && !this.watch) {
                this.watch = true;
                hotReload.enable();

                watch.watchTree(this.watchPath, {
                    ignoreDirectoryPattern: /node_modules/
                }, f => {
                    if (typeof f !== 'string') return;
                    var isTemplate = f.indexOf('.marko') !== -1 && f.indexOf('.marko.js') === -1;

                    if (isTemplate) {
                        hotReload.handleFileModified(f);
                        watching.invalidate();
                    }
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
                    let p = path.parse(outputPath);

                    let outputFileName;
                    if (!p.ext) {
                        outputFileName = path.join(p.dir, p.base, 'index.html');
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
