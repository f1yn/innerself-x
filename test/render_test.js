require = require("esm")(module);
const assert = require("assert");
const { createStore, html } = require("../index")
const { element, fragment } = require("../x");

function counter(state = 0, action) {
    switch (action) {
        case "INCREMENT":
            return state + 1;
        default:
            return state;
    }
}

const getMount = root => root.firstChild;

suite("render", function() {
    let store;
    let root;

    setup(function() {
        store = createStore(counter);
        root = mockElement();
    });

    test("assigns innerHTML of the root", function() {
        const { attach, dispatch } = store;

        // Always returns the same output.
        const TestApp = () => () => "Foo";
        attach(TestApp, root);

        dispatch("INCREMENT");
        assert.equal(getMount(root).innerHTML, "Foo");
    });

    test("nested HTMLElement injection", function() {
        const { attach } = store;

         const TestApp = () => html`<div>Foo ${({ asNode }) => {
            const [ref, b] = asNode(document.createElement('b'));
            b.innerHTML = 'hello world';
            return ref;
        }} Baz</div>`;

        attach(TestApp, root);
        assert.equal(getMount(root).innerHTML, "<div>Foo <b>hello world</b> Baz</div>");
    });

     test("nested DocumentFragment injection", function() {
        const { attach } = store;

         const TestApp = () => html`<div>Foo ${({ asNode }) => {
            const [ref, fragment] = asNode(document.createDocumentFragment());
            // build buttons with internal state
            for (let count = 0; count < 3; count++) {
                const button = document.createElement('b');
                button.innerHTML = `${count + 1}`;
                fragment.appendChild(button);
            }
            return ref;
        }} Baz</div>`;

        attach(TestApp, root);
        assert.equal(getMount(root).innerHTML, "<div>Foo <b>1</b><b>2</b><b>3</b> Baz</div>");
    });

    test("nested x/element injection", function() {
        const { attach } = store;

        const Bold = element('b', (b) => {
            b.innerHTML = 'Hello';
        });

        const TestApp = () => html`<div>Foo ${Bold} Baz</div>`;
        attach(TestApp, root)

        assert.equal(getMount(root).innerHTML, "<div>Foo <b>Hello</b> Baz</div>");
    });

    test("re-assigns when the output changes", function() {
        const { attach, connect, dispatch } = store;

        const TestApp = state => () => `Foo ${state}`;
        const ConnectedTestApp = connect(TestApp);

        attach(ConnectedTestApp, root);
        assert.equal(getMount(root).innerHTML, "Foo 0");

        dispatch("INCREMENT");
        assert.equal(getMount(root).innerHTML, "Foo 1");

        dispatch("INCREMENT");
        assert.equal(getMount(root).innerHTML, "Foo 2");
    });

    test("dispatches an event when the output changes", function() {
        const { attach, connect, dispatch } = store;

        const TestApp = state => () => `Foo ${state}`;
        const ConnectedTestApp = connect(TestApp);
        attach(ConnectedTestApp, root);
        assert.deepEqual(root.dispatchEvent.args(), [{
            name: "render",
            detail: 0
        }]);

        dispatch("INCREMENT");
        assert.deepEqual(root.dispatchEvent.args(), [{
            name: "render",
            detail: 1
        }]);

        dispatch("INCREMENT");
        assert.deepEqual(root.dispatchEvent.args(), [{
            name: "render",
            detail: 2
        }]);
    });

    // TODO: re-enable this to be DRY and reliant on JSDOM built-ins
    // test("avoids re-assignment if the output doesn't change", function() {
    //     const { attach, connect, dispatch } = store;

    //     // Always returns the same output.
    //     const TestApp = () => () => "Foo";
    //     root._dirty.set("innerHTML", false);

    //     attach(TestApp, root);
    //     assert.equal(root._dirty.get("innerHTML"), true);

    //     root._dirty.set("innerHTML", false);
    //     dispatch("INCREMENT");
    //     assert.equal(root._dirty.get("innerHTML"), false);

    //     root._dirty.set("innerHTML", false);
    //     dispatch("INCREMENT");
    //     assert.equal(root._dirty.get("innerHTML"), false);
    // });
});
