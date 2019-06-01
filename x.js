// x-tended features

/**
 * HOC Helper for build a composable HTMLElement based component
 * @param {String} tagName The tagName of the element to create
 * @param {Function} comp The functional component to use for rendering
 * @param {String} [key=null] Unique key value, used to ensure node persistence between renders
 * @returns {Function} Node component to be used within html calls
 */
export const element = (tagName, comp, key) => (rootProps) => {
    const [ref, node, isFirstRender] = rootProps.asNode(document.createElement(tagName), { key });
    comp(node, Object.assign({ isFirstRender }, rootProps));
    return ref;
};


/**
 * HOC Helper for build a composable DocumentFragment based component
 * @param {Function} comp The functional component to use for rendering
 * @param {String} [key=null] Unique key value, used to ensure node persistence between renders
 * @returns {Function} Node component to be used within html calls
 */
export const fragment = (comp, key) => (rootProps) => {
	const [ref, fragment, isFirstRender] = opts.asNode(document.createDocumentFragment(), { key });
    comp(fragment, Object.assign({ isFirstRender }, rootProps));
    return ref;
}