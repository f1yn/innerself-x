import { createStore, html } from '../index'; // import innerself
import withLogger from '../logger'; // import innerself/logger

const { attach, dispatch } = createStore(withLogger(() => null));

function App() {
	return html`
		<div>
			<button>${({ asNode, forceUpdate }) => {
				// temporal node
				const [ref, div, isFirstRender] = asNode(document.createElement('div'));

				div.addEventListener('click', () => {
					console.log('rerender');
					forceUpdate();
				});

				div.innerHTML = `This is a temporal node ${Math.random()}`;
				return ref;
			}}
			</button>
			<button>
				${({ asNode, forceUpdate }) => {
					// persistent node
					const [ref, div, isFirstRender] = asNode(document.createElement('div'), { key: 'my-unique-key' });

					if (isFirstRender) {
						// is first time it renders
						div.addEventListener('click', () => {
							console.log('rerender');
							forceUpdate();
						});

						div.innerHTML = `This is a persistent node ${Math.random()}`;
					}

					// otherwise return string ref since the Node will persist with it's first set state
					return ref;
				}}
			</button>
			<div>
				${({ asNode }) => {
					// fragment example (temporal)
					const [ref, fragment, isFirstRender] = asNode(document.createDocumentFragment());

					// build buttons with internal state
					for (let count = 0; count < 3; count++) {
						const button = document.createElement('button');
						button.innerHTML = `Button ${count + 1}`;
						button.addEventListener('click', () => {
							console.log(`You clicked me! I am button ${count}`);
						});

						// append the node to the document fragment
						fragment.appendChild(button);
					}

					// otherwise return string ref since the Node will persist with it's first set state
					return ref;
				}}
			</div>
		</div>
	`;
}

attach(App, document.getElementById('app'));
