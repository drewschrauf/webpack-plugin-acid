import A, { __RewireAPI__ as ARewireAPI } from '../src/AcidStaticSiteGeneratorPlugin';
import { Acid, AcidFailRoutes, AcidFailRender, AcidFailInstantiation } from './mocks/AcidMocks';
import chai, { expect } from 'chai';
import path from 'path';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

describe('AcidStaticSiteGeneratorPlugin', () => {
    it('should export a class', () => {
        expect(A).to.be.a('function');
    });

    describe('#constructor', () => {
        it('should accept no arguments', () => {
            expect(() => {
                new A();
            }).to.not.throw();
        });

        it('should accept a config', () => {
            let a = new A({config: 'config'});
            expect(a.config).to.equal('config');
        });

        it('should accept a watchPath', () => {
            let a = new A({watchPath: 'watchPath'});
            expect(a.watchPath).to.equal(path.resolve('watchPath'));
        });
    });

    describe('#apply', () => {
        let a;
        let methods = {};
        let compiler = {
            plugin: (n, callback) => {
                methods[n] = callback;
            }
        };
        beforeEach(() => {
            ARewireAPI.__set__('create', Acid);
            a = new A();
        });

        it('should register methods on apply', () => {
            let compiler = {
                plugin: sinon.spy()
            };
            a.apply(compiler);
            expect(compiler.plugin).to.have.been.calledWith('run');
            expect(compiler.plugin).to.have.been.calledWith('watch-run');
            expect(compiler.plugin).to.have.been.calledWith('emit');
        });

        describe('run', () => {
            beforeEach(() => {
                a.apply(compiler);
            });
            it('should instantiate Acid on run', done => {
                methods.run(null, () => {
                    expect(a.acid).to.not.be.undefined;
                    done();
                });
            });

            it('should report errors for a bad instantiation', done => {
                ARewireAPI.__set__('create', AcidFailInstantiation);
                let a = new A({config: []});
                a.apply(compiler);
                let c = {assets: {}, errors: []};
                methods.run(c, () => {
                    expect(c.errors).to.have.length(1);
                    done();
                });
            });
        });

        describe('watch-run', () => {
            let callback;
            let watchSpy;
            let watcher;
            let hotReload;
            beforeEach(() => {
                callback = null;

                let watch = {
                    watchTree: (p, i, f) => {callback = f;}
                };
                watchSpy = sinon.spy(watch, 'watchTree');

                hotReload = {
                    enable: sinon.spy(),
                    handleFileModified: sinon.spy()
                };

                watcher = {
                    invalidate: sinon.spy()
                };

                ARewireAPI.__Rewire__('watch', watch);
                ARewireAPI.__Rewire__('hotReload', hotReload);
            });
            it('should instantiate Acid on watch-run', done => {
                a.apply(compiler);
                methods['watch-run'](null, () => {
                    expect(a.acid).to.not.be.undefined;
                    done();
                });
            });
            it('should start a watch task on watch-run', done => {
                a.apply(compiler);
                methods['watch-run'](null, () => {
                    try {
                        expect(watchSpy).to.have.been.called;
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            });
            it('should reload if a template is changed', done => {
                a.apply(compiler);
                methods['watch-run'](watcher, () => {
                    try {
                        callback('test.marko');
                        expect(watcher.invalidate).to.have.been.called;
                        expect(hotReload.handleFileModified).to.have.been.calledWith('test.marko');
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            });
            it('should not reload if something other than a template is changed', done => {
                a.apply(compiler);
                methods['watch-run'](watcher, () => {
                    try {
                        callback('test.marko.js');
                        callback({test: 'test'});
                        expect(watcher.invalidate).to.not.have.been.called;
                        expect(hotReload.handleFileModified).to.not.have.been.called;
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            });
            it('should allow additional extensions to be added for reload', done => {
                ARewireAPI.__set__('create', Acid);
                let a = new A();
                a.apply(compiler);
                methods['watch-run'](watcher, () => {
                    try {
                        callback('/my/post.md');
                        expect(watcher.invalidate).to.have.been.called;
                        expect(hotReload.handleFileModified).to.not.have.been.called;
                        done();
                    } catch (err) {
                        done(err);
                    }
                });

            });
        });

        describe('emit', () => {
            it('should add an asset for a path', done => {
                ARewireAPI.__set__('create', Acid);
                let a = new A({config: ['/one.html', '/about']});
                a.apply(compiler);
                methods.run(compiler, () => {
                    let c = {assets: {}, errors: []};
                    methods.emit(c, () => {
                        expect(c.assets['one.html']).to.not.be.undefined;
                        expect(c.assets['one.html'].source()).to.equal('/one.html');
                        expect(c.assets['one.html'].size()).to.equal(9);
                        expect(c.assets['about/index.html']).to.not.be.undefined;
                        done();
                    });
                });
            });

            it('should report errors for a rejects promise from resolveRoutes', done => {
                ARewireAPI.__set__('create', AcidFailRoutes);
                let a = new A({config: ['/one.html']});
                a.apply(compiler);
                methods.run(compiler, () => {
                    let c = {assets: {}, errors: []};
                    methods.emit(c, () => {
                        expect(c.errors.length).to.equal(1);
                        done();
                    });
                });
            });

            it('should report errors for a rejected promise from renderRoutes', done => {
                ARewireAPI.__set__('create', AcidFailRender);
                let a = new A({config: ['/one.html']});
                a.apply(compiler);
                methods.run(compiler, () => {
                    let c = {assets: {}, errors: []};
                    methods.emit(c, () => {
                        expect(c.errors.length).to.equal(1);
                        done();
                    });
                });
            });
        });
    });
});
