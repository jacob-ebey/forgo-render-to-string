import { shallowRender } from '../src';
import chai, { expect } from 'chai';
import { spy } from 'sinon';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);

describe('shallowRender()', () => {
	it('should not render nested components', () => {
		const render = spy(({ foo, children }) => (
			<div bar={foo}>
				<b>test child</b>
				{children}
			</div>
		));
		let Test = () => ({
			render
		});
		Test.displayName = 'Test';

		let rendered = shallowRender(
			<section>
				<Test foo={1}>
					<span>asdf</span>
				</Test>
			</section>
		);

		expect(rendered).to.equal(
			`<section><Test foo="1"><span>asdf</span></Test></section>`
		);
		expect(render).not.to.have.been.called;
	});

	it('should always render root component', () => {
		const render = spy(({ foo, children }) => (
			<div bar={foo}>
				<b>test child</b>
				{children}
			</div>
		));
		let Test = () => ({
			render
		});
		Test.displayName = 'Test';

		let rendered = shallowRender(
			<Test foo={1}>
				<span>asdf</span>
			</Test>
		);

		expect(rendered).to.equal(
			`<div bar="1"><b>test child</b><span>asdf</span></div>`
		);
		expect(render).to.have.been.calledOnce;
	});

	// it('should ignore Fragments', () => {
	// 	let rendered = shallowRender(
	// 		<Fragment>
	// 			<div>foo</div>
	// 		</Fragment>
	// 	);
	// 	expect(rendered).to.equal(`<div>foo</div>`);
	// });
});
