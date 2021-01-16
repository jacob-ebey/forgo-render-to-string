import { render } from '../src';
import chai, { expect } from 'chai';
import { spy, match } from 'sinon';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);

function jsx(type, props, key) {
	return { type, props, key, __is_forgo_element__: true };
}

describe('render', () => {
	describe('Basic JSX', () => {
		it('should render JSX', () => {
			let rendered = render(<div class="foo">bar</div>),
				expected = `<div class="foo">bar</div>`;

			expect(rendered).to.equal(expected);
		});

		describe('whitespace', () => {
			it('should omit whitespace between elements', () => {
				let children = [];
				for (let i = 0; i < 1000; i++) {
					children.push(Math.random() > 0.5 ? String(i) : 'x-' + String(i));
				}
				let rendered = render(
					<div class="foo">
						x<a>a</a>
						<b>b</b>c{children}d
					</div>
				);

				expect(rendered).not.to.contain(/\s/);
			});

			it('should not indent when attributes contain newlines', () => {
				let rendered = render(
					<div class={`foo\n\tbar\n\tbaz`}>
						<a>a</a>
						<b>b</b>c
					</div>
				);

				expect(rendered).to.equal(
					`<div class="foo\n\tbar\n\tbaz"><a>a</a><b>b</b>c</div>`
				);
			});
		});

		it('should omit falsey attributes', () => {
			let rendered = render(<div a={null} b={undefined} c={false} />),
				expected = `<div></div>`;

			expect(rendered).to.equal(expected);

			expect(render(<div foo={0} />)).to.equal(`<div foo="0"></div>`);
		});

		it('should omit key attribute', () => {
			let rendered = render(<div key="test" />),
				expected = `<div></div>`;

			expect(rendered).to.equal(expected);
		});

		it('should omit ref attribute', () => {
			let rendered = render(<div ref="test" />),
				expected = `<div></div>`;

			expect(rendered).to.equal(expected);
		});

		it('should omit __source attribute', () => {
			let rendered = render(<div __source="test" />),
				expected = `<div></div>`;

			expect(rendered).to.equal(expected);
		});

		it('should omit __self attribute', () => {
			let rendered = render(<div __self="test" />),
				expected = `<div></div>`;

			expect(rendered).to.equal(expected);
		});

		it('should omit defaultValue attribute', () => {
			let rendered = render(<div defaultValue="test" />),
				expected = `<div></div>`;

			expect(rendered).to.equal(expected);
		});

		it('should include boolean aria-* attributes', () => {
			let rendered = render(<div aria-hidden aria-whatever={false} />),
				expected = `<div aria-hidden="true" aria-whatever="false"></div>`;

			expect(rendered).to.equal(expected);
		});

		describe('attribute name sanitization', () => {
			it('should omit attributes with invalid names', () => {
				let rendered = render(
					<div
						{...{
							'<a': '1',
							'a>': '1',
							'foo"bar': '1',
							'"hello"': '1'
						}}
					/>
				);
				expect(rendered).to.equal(`<div></div>`);
			});

			it('should mitigate attribute name injection', () => {
				let rendered = render(
					<div
						{...{
							'></div><script>alert("hi")</script>': '',
							'foo onclick': 'javascript:alert()',
							a: 'b'
						}}
					/>
				);
				expect(rendered).to.equal(`<div a="b"></div>`);
			});

			it('should allow emoji attribute names', () => {
				let rendered = render(
					<div
						{...{
							'a;b': '1',
							'a🧙‍b': '1'
						}}
					/>
				);
				expect(rendered).to.equal(`<div a;b="1" a🧙‍b="1"></div>`);
			});
		});

		it('should throw for invalid nodeName values', () => {
			expect(() => render(<div />)).not.to.throw();
			expect(() => render(jsx('x-💩'))).not.to.throw();
			expect(() => render(jsx('a b'))).to.throw(/<a b>/);
			expect(() => render(jsx('a\0b'))).to.throw(/<a\0b>/);
			expect(() => render(jsx('a>'))).to.throw(/<a>>/);
			expect(() => render(jsx('<'))).to.throw(/<<>/);
			expect(() => render(jsx('"'))).to.throw(/<">/);
		});

		it('should collapse collapsible attributes', () => {
			let rendered = render(<div class="" style="" foo bar />),
				expected = `<div class style foo bar></div>`;

			expect(rendered).to.equal(expected);
		});

		it('should omit functions', () => {
			let rendered = render(<div a={() => {}} b={function () {}} />),
				expected = `<div></div>`;

			expect(rendered).to.equal(expected);
		});

		it('should encode entities', () => {
			let rendered = render(<div a={'"<>&'}>{'"<>&'}</div>),
				expected = `<div a="&quot;&lt;&gt;&amp;">&quot;&lt;&gt;&amp;</div>`;

			expect(rendered).to.equal(expected);
		});

		it('should serialize textarea value', () => {
			let rendered = render(<textarea value="abc" />),
				expected = `<textarea>abc</textarea>`;

			expect(rendered).to.equal(expected);
		});

		it('should escape textarea value', () => {
			let rendered = render(<textarea value={`a&b"c`} />),
				expected = `<textarea>a&amp;b&quot;c</textarea>`;

			expect(rendered).to.equal(expected);
		});

		it('should omit empty textarea value', () => {
			let rendered = render(<textarea value="" />),
				expected = `<textarea></textarea>`;

			expect(rendered).to.equal(expected);
		});

		it('should omit falsey children', () => {
			let rendered = render(
					<div>
						{null}|{undefined}|{false}
					</div>
				),
				expected = `<div>||</div>`;

			expect(rendered).to.equal(expected);
		});

		it('should self-close void elements', () => {
			let rendered = render(
					<div>
						<input type="text" />
						<wbr />
					</div>
				),
				expected = `<div><input type="text" /><wbr /></div>`;

			expect(rendered).to.equal(expected);
		});

		it('should self-close custom void elements', () => {
			let rendered = render(
					<div>
						<hello-world />
					</div>,
					{ voidElements: /^hello-world$/ }
				),
				expected = `<div><hello-world /></div>`;

			expect(rendered).to.equal(expected);
		});

		it('does not close void elements with closing tags', () => {
			let rendered = render(<link>http://forgojs.org</link>),
				expected = `<link>http://forgojs.org</link>`;

			expect(rendered).to.equal(expected);
		});

		it('should not self-close void elements if it has dangerouslySetInnerHTML prop', () => {
			let rendered = render(
					<link dangerouslySetInnerHTML={{ __html: '<foo>' }} />
				),
				expected = `<link><foo></link>`;

			expect(rendered).to.equal(expected);
		});

		it('should serialize object styles', () => {
			let rendered = render(<div style={{ color: 'red', border: 'none' }} />),
				expected = `<div style="color: red; border: none;"></div>`;

			expect(rendered).to.equal(expected);
		});

		it('should preserve CSS Custom Properties', () => {
			let rendered = render(<div style={{ '--foo': 1, '--foo-bar': '2' }} />),
				expected = `<div style="--foo: 1; --foo-bar: 2;"></div>`;

			expect(rendered).to.equal(expected);
		});

		it('should ignore empty object styles', () => {
			let rendered = render(<div style={{}} />),
				expected = `<div></div>`;

			expect(rendered).to.equal(expected);
		});

		it('should render SVG elements', () => {
			let rendered = render(
				<svg>
					<image xlinkHref="#" />
					<foreignObject>
						<div xlinkHref="#" />
					</foreignObject>
					<g>
						<image xlinkHref="#" />
					</g>
				</svg>
			);

			expect(rendered).to.equal(
				`<svg><image xlink:href="#"></image><foreignObject><div xlinkHref="#"></div></foreignObject><g><image xlink:href="#"></image></g></svg>`
			);
		});
	});

	describe('Functional Components', () => {
		it('should render functional components', () => {
			const renderFunc = spy(({ foo, children }) => (
				<div foo={foo}>{children}</div>
			));
			let Test = () => ({
				render: renderFunc
			});

			let rendered = render(<Test foo="test">content</Test>);

			expect(rendered).to.equal(`<div foo="test">content</div>`);

			expect(renderFunc).to.have.been.calledOnce.and.calledWithExactly(
				match({
					foo: 'test',
					children: 'content'
				}),
				match({})
			);
		});

		it('should render functional components within JSX', () => {
			const renderFunc = spy(({ foo, children }) => (
				<div foo={foo}>{children}</div>
			));
			let Test = () => ({
				render: renderFunc
			});

			let rendered = render(
				<section>
					<Test foo={1}>
						<span>asdf</span>
					</Test>
				</section>
			);

			expect(rendered).to.equal(
				`<section><div foo="1"><span>asdf</span></div></section>`
			);

			expect(renderFunc).to.have.been.calledOnce.and.calledWithExactly(
				match({
					foo: 1,
					children: match({ type: 'span', props: { children: 'asdf' } })
				}),
				match({})
			);
		});
	});

	describe('dangerouslySetInnerHTML', () => {
		it('should support dangerouslySetInnerHTML', () => {
			// some invalid HTML to make sure we're being flakey:
			let html = '<a href="foo">asdf</a> some text <ul><li>foo<li>bar</ul>';
			let rendered = render(
				<div id="f" dangerouslySetInnerHTML={{ __html: html }} />
			);
			expect(rendered).to.equal(`<div id="f">${html}</div>`);
		});

		it('should override children', () => {
			let rendered = render(
				<div dangerouslySetInnerHTML={{ __html: 'foo' }}>
					<b>bar</b>
				</div>
			);
			expect(rendered).to.equal('<div>foo</div>');
		});
	});

	describe('className / class massaging', () => {
		it('should render class using className', () => {
			let rendered = render(<div className="foo bar" />);
			expect(rendered).to.equal('<div class="foo bar"></div>');
		});

		it('should render class using class', () => {
			let rendered = render(<div class="foo bar" />);
			expect(rendered).to.equal('<div class="foo bar"></div>');
		});

		it('should prefer class over className', () => {
			let rendered = render(<div class="foo" className="foo bar" />);
			expect(rendered).to.equal('<div class="foo"></div>');
		});
	});

	describe('htmlFor / for massaging', () => {
		it('should render for using htmlFor', () => {
			let rendered = render(<label htmlFor="foo" />);
			expect(rendered).to.equal('<label for="foo"></label>');
		});

		it('should render for using for', () => {
			let rendered = render(<label for="foo" />);
			expect(rendered).to.equal('<label for="foo"></label>');
		});

		it('should prefer for over htmlFor', () => {
			let rendered = render(<label for="foo" htmlFor="bar" />);
			expect(rendered).to.equal('<label for="foo"></label>');
		});
	});

	describe('sortAttributes', () => {
		it('should leave attributes unsorted by default', () => {
			let rendered = render(<div b1="b1" c="c" a="a" b="b" />);
			expect(rendered).to.equal('<div b1="b1" c="c" a="a" b="b"></div>');
		});

		it('should sort attributes lexicographically if enabled', () => {
			let rendered = render(<div b1="b1" c="c" a="a" b="b" />, {
				sortAttributes: true
			});
			expect(rendered).to.equal('<div a="a" b="b" b1="b1" c="c"></div>');
		});
	});

	describe('xml:true', () => {
		let renderXml = (jsx) => render(jsx, { xml: true });

		it('should render end-tags', () => {
			expect(renderXml(<div />)).to.equal(`<div />`);
			expect(renderXml(<a />)).to.equal(`<a />`);
			expect(renderXml(<a>b</a>)).to.equal(`<a>b</a>`);
		});

		it('should not self-close if it has dangerouslySetInnerHTML prop', () => {
			expect(
				renderXml(<a dangerouslySetInnerHTML={{ __html: 'b' }} />)
			).to.equal(`<a>b</a>`);
			expect(
				renderXml(<a dangerouslySetInnerHTML={{ __html: '<b />' }} />)
			).to.equal(`<a><b /></a>`);
		});

		it('should render boolean attributes with named values', () => {
			expect(renderXml(<div foo bar />)).to.equal(
				`<div foo="foo" bar="bar" />`
			);
		});

		it('should exclude falsey attributes', () => {
			expect(renderXml(<div foo={false} bar={0} />)).to.equal(
				`<div bar="0" />`
			);
		});
	});

	// describe('Fragments', () => {
	// 	it('should skip Fragment node', () => {
	// 		let html = render(
	// 			<div>
	// 				<Fragment>foo</Fragment>
	// 			</div>
	// 		);
	// 		expect(html).to.equal('<div>foo</div>');
	// 	});

	// 	it('should skip Fragment node with multiple children', () => {
	// 		let html = render(
	// 			<div>
	// 				<Fragment>
	// 					foo
	// 					<span>bar</span>
	// 				</Fragment>
	// 			</div>
	// 		);
	// 		expect(html).to.equal('<div>foo<span>bar</span></div>');
	// 	});

	// 	it('should skip Fragment node with multiple children #2', () => {
	// 		let html = render(
	// 			<div>
	// 				<Fragment>
	// 					<div>foo</div>
	// 					<div>bar</div>
	// 				</Fragment>
	// 			</div>
	// 		);
	// 		expect(html).to.equal('<div><div>foo</div><div>bar</div></div>');
	// 	});

	// 	it('should indent Fragment children when pretty printing', () => {
	// 		let html = render(
	// 			<div>
	// 				<Fragment>
	// 					<div>foo</div>
	// 					<div>bar</div>
	// 					<div>
	// 						<div>baz</div>
	// 						<div>quux</div>
	// 					</div>
	// 				</Fragment>
	// 			</div>,
	// 			undefined,
	// 			{ pretty: true }
	// 		);
	// 		expect(html).to.equal(
	// 			'<div>\n\t<div>foo</div>\n\t<div>bar</div>\n\t<div>\n\t\t<div>baz</div>\n\t\t<div>quux</div>\n\t</div>\n</div>'
	// 		);
	// 	});

	// 	it('should skip Fragment even if it has props', () => {
	// 		let html = render(
	// 			<div>
	// 				<Fragment key="2">foo</Fragment>
	// 			</div>
	// 		);
	// 		expect(html).to.equal('<div>foo</div>');
	// 	});

	// 	it('should skip sibling Fragments', () => {
	// 		let html = render(
	// 			<div>
	// 				<Fragment>foo</Fragment>
	// 				<Fragment>bar</Fragment>
	// 			</div>
	// 		);
	// 		expect(html).to.equal('<div>foobar</div>');
	// 	});

	// 	it('should skip nested Fragments', () => {
	// 		let html = render(
	// 			<div>
	// 				<Fragment>
	// 					<Fragment>foo</Fragment>
	// 				</Fragment>
	// 			</div>
	// 		);
	// 		expect(html).to.equal('<div>foo</div>');
	// 	});
	// });

	it('should render select value on option', () => {
		let res = render(
			<select value="B">
				<option value="A">A</option>
				<option value="B">B</option>
			</select>
		);
		expect(res).to.equal(
			'<select><option value="A">A</option><option selected value="B">B</option></select>'
		);
	});

	// it('should render select value on option with a Fragment', () => {
	// 	let res = render(
	// 		<select value="B">
	// 			<Fragment>
	// 				<option value="A">A</option>
	// 				<option value="B">B</option>
	// 			</Fragment>
	// 		</select>
	// 	);
	// 	expect(res).to.equal(
	// 		'<select><option value="A">A</option><option selected value="B">B</option></select>'
	// 	);
	// });

	it('should render select value on option through a component', () => {
		function Foo() {
			return {
				render: () => (
					<optgroup label="foo">
						<option value="A">A</option>
						<option value="B">B</option>
					</optgroup>
				)
			};
		}
		let res = render(
			<select value="B">
				<Foo />
			</select>
		);
		expect(res).to.equal(
			'<select><optgroup label="foo"><option value="A">A</option><option selected value="B">B</option></optgroup></select>'
		);
	});

	it('should render select value with loose equality', () => {
		let res = render(
			<select value={2}>
				<option value="2">2</option>
			</select>
		);
		expect(res).to.equal(
			'<select><option selected value="2">2</option></select>'
		);
	});
});
