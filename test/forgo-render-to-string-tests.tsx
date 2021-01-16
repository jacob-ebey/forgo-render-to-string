import 'forgo/jsx-runtime';
import render from '../src';

let vdom = <div class="foo">content</div>;

let html = render(vdom);
console.log(html);
