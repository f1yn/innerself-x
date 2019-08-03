const generateKeyNode = key => `<i class="${key} __data-innerself-node"></i>`;

const isFullString = x => x && x !== true || x === 0;

export function asNode(documentNode, opts, transitorySubRoots, persistentSubRoots) {
	const persistKey = typeof opts.key === 'string' && opts.key;

	if (persistKey) {
		if (persistentSubRoots.has(persistKey)) {
			// return the cached DOM node reference and it's key (avoid recreation)
			// also destroy the passed documentNode because we're mean
			documentNode = null;
			return [generateKeyNode(persistKey), persistentSubRoots.get(persistKey), false];
		}

		// otherwise set the generated node into memory and return
		persistentSubRoots.set(persistKey, documentNode);
		return [generateKeyNode(persistKey), documentNode, true];
	}

	// otherwise treat as standard ethereal (temp) node
	const temporalKey = Math.random().toString('16');
	transitorySubRoots.set(temporalKey, documentNode);
	return [generateKeyNode(temporalKey), documentNode, true];
}

export function html([first, ...strings], ...values) {
	// Weave the literal strings and the interpolations.
	// We don't have to explicitly handle array-typed values
	// because concat will spread them flat for us.

	return function reconcile(rootProps) {
		// generate a node functionality or directly depending on it's type
		// allows for a shallow cascade via recursion
		const generate = (node) => {
			if (Array.isArray(node)) {
				// handle nested node arrays (due to reconciler)
				// make sure once the recursion is done to attempt to map it out
				// to a final string value
				return node
					.map(generate)
					.filter(isFullString)
					.join('');
			}
			
			return typeof node === 'function' ? node(rootProps) : node;
		}

		return values.reduce(
			(acc, cur) => acc.concat(generate(cur), strings.shift()),
			[first])
			// Filter out interpolations which are bools, null or undefined.
			.filter(isFullString)
			.join('');
	}
}

export function createStore(reducer) {
	// Setup minimal reducer to be shared across all the nodes
	let state = reducer();

	// Storage for a really small mapping of roots and their previous values
	const roots = new Map();
	const prevs = new Map();

	// storage for persistent sub roots
	const persistentSubRoots  = new Map();

	function render() {
		// generate pool of subsisting DOM nodes for asNode components
		const transitorySubRoots = new Map();

		// Because we are using a minimal reconciler, we can build a shared reference
		// and method pool to share across various components
		const rootProps = {
			forceUpdate: render,
			asNode: (node, opts) => asNode(node, opts || {}, transitorySubRoots, persistentSubRoots)
		};

		for (const [root, component] of roots) {
			const output = component()(rootProps);

			// Poor man's Virtual DOM implementation :)  Compare the new output
			// with the last output for this root.  Don't trust the current
			// value of root.innerHTML as it may have been changed by other
			// scripts or extensions.
			if (output !== prevs.get(root)) {
				prevs.set(root, output);

				// because we are performing dark art, lets create a new element root
				// to work within so we can run DOM operations on a subset. This is a working
				// DOM tree by the time we get to it
				const mountPoint = document.createElement('div');
				mountPoint.innerHTML = output;

				// we'll now select all the sub-roots within the document and attempt to
				// mount them where they exist
				const tempSubRoots = mountPoint.getElementsByClassName('__data-innerself-node');
				let index = tempSubRoots.length, tempNode, key, targetNode;

				while (index--) {
					tempNode = tempSubRoots[index];
					key = tempNode.className.split(' ', 1)[0];
					targetNode = transitorySubRoots.get(key) || persistentSubRoots.get(key);

					if (!targetNode) {
						// something ain't right here, make sure to log it
						// clear the temp node as well
						console.warn(`innerself-x reconciliation error, could not locate node with key: ${key}`);
						transitorySubRoots.delete(key) || persistentSubRoots.delete(key);
						continue;
					}

					// replace the temporary node with the real DOM node (either cached or live)
					tempNode.parentNode.replaceChild(targetNode, tempNode);
				}

				if (root.firstChild) {
					// if we already have a mounted subRoot then replace it with our new one
					root.replaceChild(mountPoint, root.firstChild);
				} else {
					// simply append the new root
					root.appendChild(mountPoint);
				}

				// Dispatch an event on the root to give developers a chance to
				// do some housekeeping after the whole DOM is replaced under
				// the root. You can re-focus elements in the listener to this
				// event. See example03.
				root.dispatchEvent(new CustomEvent('render', { detail: state }));
			}
		}
	};

	return {
		attach(component, root) {
			roots.set(root, component);
			render();
		},
		connect(component) {
			// Return a decorated component function.
			return (...args) => component(state, ...args);
		},
		dispatch(action, ...args) {
			state = reducer(state, action, args);
			render();
		},
	};
}

export default html;