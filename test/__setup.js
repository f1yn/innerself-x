const { JSDOM } = require("jsdom");

const { window } = new JSDOM("", {
    url: "http://localhost",
});
Object.keys(window).forEach(property => {
    if (typeof global[property] === "undefined") {
        global[property] = window[property];
    }
});
global.window = window;
global.CustomEvent = function CustomEvent(name, {detail}) {
    this.name = name;
    this.detail = detail;
}

global.spyFunction = function(orig = x => y => void x) {
    let _args = [];

    function fake(...args) {
        _args = args;
        return orig(...args);
    }

    fake.args = () => _args;
    return fake;
}

global.mockElement = function(tagName = 'div') {
    const elem = document.createElement(tagName)
    elem.dispatchEvent = spyFunction();
    return elem;
}
