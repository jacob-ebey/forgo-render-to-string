# forgo-render-to-string

[![NPM](http://img.shields.io/npm/v/forgo-render-to-string.svg)](https://www.npmjs.com/package/forgo-render-to-string)
[![travis-ci](https://travis-ci.org/jacob-ebey/forgo-render-to-string.svg)](https://travis-ci.org/jacob-ebey/forgo-render-to-string)

Render JSX and [Frogo] components to an HTML string.

Works in Node & the browser, making it useful for universal/isomorphic rendering.

\>\> **[Cute Fox-Related Demo](http://codepen.io/developit/pen/dYZqjE?editors=001)** _(@ CodePen)_ <<

---

### Render JSX/VDOM to HTML

```js
import render from 'forgo-render-to-string';

let vdom = <div class="foo">content</div>;

let html = render(vdom);
console.log(html);
// <div class="foo">content</div>
```

### Render Forgo Components to HTML

```js
import render from 'forgo-render-to-string';

const Box = () => {
	return {
		render: ({ type, children }) => (
			<div class={`box box-${type}`}>{children}</div>
		)
	};
};

let html = render(
	<Box type="open">
		<Fox name="Finn" />
	</Box>
);

console.log(html);
// <div class="box box-open"><span class="fox">Finn</span></div>
```

---

### Render JSX / Forgo / Whatever via Express!

```js
import express from 'express';
import render from 'forgo-render-to-string';

// silly example component:
const Fox = () => {
	return {
		render: ({ name }) => (
			<div class="fox">
				<h5>{name}</h5>
				<p>This page is all about {name}.</p>
			</div>
		)
	};
};

// basic HTTP server via express:
const app = express();
app.listen(8080);

// on each request, render and return a component:
app.get('/:fox', (req, res) => {
	let html = render(<Fox name={req.params.fox} />);
	// send it back wrapped up as an HTML5 document:
	res.send(`<!DOCTYPE html><html><body>${html}</body></html>`);
});
```

---

### License

[MIT]

[forgo]: https://github.com/forgojs/forgo
[mit]: http://choosealicense.com/licenses/mit/
