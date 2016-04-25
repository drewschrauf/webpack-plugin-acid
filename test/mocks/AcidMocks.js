export function Acid(routes) {
    return Promise.resolve({
        resolveRoutes: () => Promise.resolve(routes),
        renderRoute: route => Promise.resolve(route),
        watchExpressions: [/\.md$/]
    });
}

export function AcidFailRoutes() {
    return Promise.resolve({
        resolveRoutes: () => Promise.reject('Route'),
        watchExpressions: []

    });
}

export function AcidFailRender(routes) {
    return Promise.resolve({
        resolveRoutes: () => Promise.resolve(routes),
        renderRoute: () => Promise.reject('Render'),
        watchExpressions: []

    });
}

export function AcidFailInstantiation() {
    return Promise.reject(new Error('error'));
}
