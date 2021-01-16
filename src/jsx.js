import './polyfills';
import renderToString from './index';
import { indent, encodeEntities, assign } from './util';
import prettyFormat from 'pretty-format';

// we have to patch in Array support, Possible issue in npm.im/pretty-format
let forgoPlugin = {
	test(object) {
		return (
			object &&
			typeof object === 'object' &&
			'type' in object &&
			'props' in object &&
			'key' in object
		);
	},
	print(val, print, indent) {
		return renderToString(val, forgoPlugin.opts, true);
	}
};

let prettyFormatOpts = {
	plugins: [forgoPlugin]
};

function attributeHook(name, value, opts, isComponent) {
	let type = typeof value;

	// Use render-to-string's built-in handling for these properties
	if (name === 'dangerouslySetInnerHTML') return false;

	// always skip null & undefined values, skip false DOM attributes, skip functions if told to
	if (value == null || (type === 'function' && !opts.functions)) return '';

	if (
		opts.skipFalseAttributes &&
		!isComponent &&
		(value === false ||
			((name === 'class' || name === 'style') && value === ''))
	)
		return '';

	let indentChar = typeof opts.pretty === 'string' ? opts.pretty : '\t';
	if (type !== 'string') {
		if (type === 'function' && !opts.functionNames) {
			value = 'Function';
		} else {
			forgoPlugin.opts = opts;
			value = prettyFormat(value, prettyFormatOpts);
			if (~value.indexOf('\n')) {
				value = `${indent('\n' + value, indentChar)}\n`;
			}
		}
		return indent(`\n${name}={${value}}`, indentChar);
	}
	return `\n${indentChar}${name}="${encodeEntities(value)}"`;
}

let defaultOpts = {
	attributeHook,
	jsx: true,
	xml: false,
	functions: true,
	functionNames: true,
	skipFalseAttributes: true,
	pretty: '  '
};

function renderToJsxString(vnode, opts, inner) {
	opts = assign(assign({}, defaultOpts), opts || {});
	return renderToString(vnode, opts, inner);
}

export default renderToJsxString;
export { renderToJsxString as render };
