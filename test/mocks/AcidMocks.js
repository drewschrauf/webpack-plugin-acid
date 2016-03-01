export function Acid(routes) {
    return Promise.resolve({
        resolveRoutes: () => Promise.resolve(routes),
        renderRoute: route => Promise.resolve(route)
    });
}

export function AcidFailRoutes() {
    return Promise.resolve({
        resolveRoutes: () => Promise.reject('Route')
    });
}

export function AcidFailRender(routes) {
    return Promise.resolve({
        resolveRoutes: () => Promise.resolve(routes),
        renderRoute: () => Promise.reject('Render')
    });
}

export function AcidFailInstantiation() {
    return Promise.reject(new Error('error'));
}
