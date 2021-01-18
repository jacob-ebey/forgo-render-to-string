import {
	encodeEntities,
	indent,
	isLargeString,
	styleObjToCss,
	getChildren
} from './util';

const SHALLOW = { shallow: true };

// components without names, kept as a hash for later comparison to return consistent UnnamedComponentXX names.
const UNNAMED = [];

const VOID_ELEMENTS = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;

/** Render Forgo JSX + Components to an HTML string.
 *	@name render
 *	@function
 *	@param {VNode} vnode	JSX VNode to render.
 *	@param {Object} [options={}]	Rendering options
 *	@param {Boolean} [options.shallow=false]	If `true`, renders nested Components as HTML elements (`<Foo a="b" />`).
 *	@param {Boolean} [options.xml=false]		If `true`, uses self-closing tags for elements without children.
 *	@param {Boolean} [options.pretty=false]		If `true`, adds whitespace for readability
 *	@param {RegEx|undefined} [options.voidElements]       RegeEx that matches elements that are considered void (self-closing)
 */
renderToString.render = renderToString;

/** Only render elements, leaving Components inline as `<ComponentName ... />`.
 *	This method is just a convenience alias for `render(vnode, { shallow:true })`
 *	@name shallow
 *	@function
 *	@param {VNode} vnode	JSX VNode to render.
 *  @param {Object} [options={}]	Rendering options
 *	@param {Boolean} [options.xml=false]		If `true`, uses self-closing tags for elements without children.
 *	@param {Boolean} [options.pretty=false]		If `true`, adds whitespace for readability
 *	@param {RegEx|undefined} [options.voidElements]       RegeEx that matches elements that are considered void (self-closing)
 */
let shallowRender = (vnode, options) =>
	renderToString(vnode, { ...SHALLOW, ...options });
function renderToString(vnode, opts) {
	const res = _renderToString(vnode, opts);
	return res;
}

/** The default export is an alias of `render()`. */
function _renderToString(vnode, opts, inner, isSvgMode, selectValue, boundary) {
	if (vnode == null || typeof vnode === 'boolean') {
		return '';
	}

	// wrap array nodes in Fragment
	if (Array.isArray(vnode)) {
		// vnode = createElement(Fragment, null, vnode);
		throw new Error('Array vnode not yet supported');
	}

	let nodeName = vnode.type,
		props = vnode.props,
		isComponent = false;
	opts = opts || {};

	let pretty = opts.pretty,
		indentChar =
			pretty && typeof pretty === 'string' ? pretty : pretty ? '\t' : '';

	// #text nodes
	if (typeof vnode !== 'object' && !nodeName) {
		return encodeEntities(vnode);
	}

	// components
	if (typeof nodeName === 'function') {
		isComponent = true;
		if (opts.shallow && (inner || opts.renderRootComponent === false)) {
			nodeName = getComponentName(nodeName);
			// } else if (nodeName === Fragment) {
			// 	let rendered = '';
			// 	let children = [];
			// 	getChildren(children, vnode.props.children);

			// 	for (let i = 0; i < children.length; i++) {
			// 		rendered +=
			// 			(i > 0 && pretty ? '\n' : '') +
			// 			_renderToString(
			// 				children[i],
			// 				opts,
			// 				opts.shallowHighOrder !== false,
			// 				isSvgMode,
			// 				selectValue
			// 			);
			// 	}
			// 	return rendered;
		} else {
			let rendered;

			// stateless functional components
			const component = nodeName(props);
			try {
				rendered = component.render(props, {});

				const newBoundary = component.error ? component : boundary;

				return _renderToString(
					rendered,
					opts,
					opts.shallowHighOrder !== false,
					isSvgMode,
					selectValue,
					newBoundary
				);
			} catch (error) {
				if (opts.onError) {
					opts.onError(error);
				}

				if (boundary && boundary.error) {
					rendered = opts.boundary.error(props, { error });
				}

				return _renderToString(
					rendered,
					opts,
					opts.shallowHighOrder !== false,
					isSvgMode,
					selectValue
				);
			}
		}
	}

	// render JSX to HTML
	let s = '',
		propChildren,
		html;

	if (props) {
		let attrs = Object.keys(props);

		// allow sorting lexicographically for more determinism (useful for tests, such as via preact-jsx-chai)
		if (opts && opts.sortAttributes === true) attrs.sort();

		for (let i = 0; i < attrs.length; i++) {
			let name = attrs[i],
				v = props[name];
			if (name === 'children') {
				propChildren = v;
				continue;
			}

			if (name.match(/[\s\n\\/='"\0<>]/)) continue;

			if (
				!(opts && opts.allAttributes) &&
				(name === 'key' ||
					name === 'ref' ||
					name === '__self' ||
					name === '__source' ||
					name === 'defaultValue')
			)
				continue;

			if (name === 'className') {
				if (props.class) continue;
				name = 'class';
			} else if (isSvgMode && name.match(/^xlink:?./)) {
				name = name.toLowerCase().replace(/^xlink:?/, 'xlink:');
			}

			if (name === 'htmlFor') {
				if (props.for) continue;
				name = 'for';
			}

			if (name === 'style' && v && typeof v === 'object') {
				v = styleObjToCss(v);
			}

			// always use string values instead of booleans for aria attributes
			// also see https://github.com/preactjs/preact/pull/2347/files
			if (name[0] === 'a' && name['1'] === 'r' && typeof v === 'boolean') {
				v = String(v);
			}

			let hooked =
				opts.attributeHook && opts.attributeHook(name, v, opts, isComponent);
			if (hooked || hooked === '') {
				s += hooked;
				continue;
			}

			if (name === 'dangerouslySetInnerHTML') {
				html = v && v.__html;
			} else if (nodeName === 'textarea' && name === 'value') {
				// <textarea value="a&b"> --> <textarea>a&amp;b</textarea>
				propChildren = v;
			} else if ((v || v === 0 || v === '') && typeof v !== 'function') {
				if (v === true || v === '') {
					v = name;
					// in non-xml mode, allow boolean attributes
					if (!opts || !opts.xml) {
						s += ' ' + name;
						continue;
					}
				}

				if (name === 'value') {
					if (nodeName === 'select') {
						selectValue = v;
						continue;
					} else if (nodeName === 'option' && selectValue == v) {
						s += ` selected`;
					}
				}
				s += ` ${name}="${encodeEntities(v)}"`;
			}
		}
	}

	// account for >1 multiline attribute
	if (pretty) {
		let sub = s.replace(/^\n\s*/, ' ');
		if (sub !== s && !~sub.indexOf('\n')) s = sub;
		else if (pretty && ~s.indexOf('\n')) s += '\n';
	}

	s = `<${nodeName}${s}>`;
	if (String(nodeName).match(/[\s\n\\/='"\0<>]/))
		throw new Error(`${nodeName} is not a valid HTML tag name in ${s}`);

	let isVoid =
		String(nodeName).match(VOID_ELEMENTS) ||
		(opts.voidElements && String(nodeName).match(opts.voidElements));
	let pieces = [];

	let children;
	if (html) {
		// if multiline, indent.
		if (pretty && isLargeString(html)) {
			html = '\n' + indentChar + indent(html, indentChar);
		}
		s += html;
	} else if (
		propChildren != null &&
		getChildren((children = []), propChildren).length
	) {
		let hasLarge = pretty && ~s.indexOf('\n');
		let lastWasText = false;

		for (let i = 0; i < children.length; i++) {
			let child = children[i];

			if (child != null && child !== false) {
				let childSvgMode =
						nodeName === 'svg'
							? true
							: nodeName === 'foreignObject'
							? false
							: isSvgMode,
					ret = _renderToString(
						child,
						opts,
						true,
						childSvgMode,
						selectValue,
						boundary
					);

				if (pretty && !hasLarge && isLargeString(ret)) hasLarge = true;

				// Skip if we received an empty string
				if (ret) {
					if (pretty) {
						let isText = ret.length > 0 && ret[0] != '<';

						// We merge adjacent text nodes, otherwise each piece would be printed
						// on a new line.
						if (lastWasText && isText) {
							pieces[pieces.length - 1] += ret;
						} else {
							pieces.push(ret);
						}

						lastWasText = isText;
					} else {
						pieces.push(ret);
					}
				}
			}
		}
		if (pretty && hasLarge) {
			for (let i = pieces.length; i--; ) {
				pieces[i] = '\n' + indentChar + indent(pieces[i], indentChar);
			}
		}
	}

	if (pieces.length || html) {
		s += pieces.join('');
	} else if (opts && opts.xml) {
		return s.substring(0, s.length - 1) + ' />';
	}

	if (isVoid && !children && !html) {
		s = s.replace(/>$/, ' />');
	} else {
		if (pretty && ~s.indexOf('\n')) s += '\n';
		s += `</${nodeName}>`;
	}

	return s;
}

function getComponentName(component) {
	return (
		component.displayName ||
		(component !== Function && component.name) ||
		getFallbackComponentName(component)
	);
}

function getFallbackComponentName(component) {
	let str = Function.prototype.toString.call(component),
		name = (str.match(/^\s*function\s+([^( ]+)/) || '')[1];
	if (!name) {
		// search for an existing indexed name for the given component:
		let index = -1;
		for (let i = UNNAMED.length; i--; ) {
			if (UNNAMED[i] === component) {
				index = i;
				break;
			}
		}
		// not found, create a new indexed name:
		if (index < 0) {
			index = UNNAMED.push(component) - 1;
		}
		name = `UnnamedComponent${index}`;
	}
	return name;
}
renderToString.shallowRender = shallowRender;

export default renderToString;

export {
	renderToString as render,
	renderToString as renderToStaticMarkup,
	renderToString,
	shallowRender
};
