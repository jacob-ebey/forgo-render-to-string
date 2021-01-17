import { ForgoNode } from 'forgo';

interface Options {
	shallow?: boolean;
	xml?: boolean;
	pretty?: boolean | string;
	onError?: (error: any) => void;
}

export function render(vnode: ForgoNode, options?: Options): string;
export function renderToString(vnode: ForgoNode, options?: Options): string;
export function shallowRender(vnode: ForgoNode, options?: Options): string;
export default render;
