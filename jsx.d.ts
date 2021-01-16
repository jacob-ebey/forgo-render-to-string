import { ForgoNode } from 'forgo';

interface Options {
	jsx?: boolean;
	xml?: boolean;
	functions?: boolean;
	functionNames?: boolean;
	skipFalseAttributes?: boolean;
	pretty?: boolean | string;
}

export function render(
	vnode: ForgoNode,
	context?: any,
	options?: Options
): string;
export default render;
