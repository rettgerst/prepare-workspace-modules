import mockfs from 'mock-fs';
import {
	getDryRun,
	getPackages,
	getPostOrder,
	getRootPjson,
	getWorkspaces,
} from '../src/lib';

describe('lib', () => {
	beforeAll(() => {
		mockfs.restore();
	});

	test('get workspaces', async () => {
		mockfs({
			'./package.json': JSON.stringify({
				workspaces: ['packages/foo', 'packages/bar'],
			}),
			'./packages/foo/package.json': JSON.stringify({
				name: 'foo',
			}),
			'./packages/bar/package.json': JSON.stringify({
				name: 'bar',
			}),
		});

		const rootPjson = await getRootPjson();

		const workspaces = await getWorkspaces(rootPjson);

		mockfs.restore();
		expect(workspaces).toMatchInlineSnapshot(`
		Object {
		  "bar": "packages/bar",
		  "foo": "packages/foo",
		}
	`);
	});

	test('get packages', async () => {
		mockfs({
			'./package.json': JSON.stringify({
				workspaces: ['packages/foo', 'packages/bar'],
			}),
			'./packages/foo/package.json': JSON.stringify({
				name: 'foo',
				dependencies: {
					bar: '1.0.0',
				},
			}),
			'./packages/bar/package.json': JSON.stringify({
				name: 'bar',
			}),
		});

		const rootPjson = await getRootPjson();

		const workspaces = await getWorkspaces(rootPjson);

		const packages = await getPackages(workspaces);

		mockfs.restore();
		expect(packages).toMatchInlineSnapshot(`
		Object {
		  "bar": Object {
		    "name": "bar",
		  },
		  "foo": Object {
		    "dependencies": Object {
		      "bar": "1.0.0",
		    },
		    "name": "foo",
		  },
		}
	`);
	});

	test('get postorder', async () => {
		mockfs({
			'./package.json': JSON.stringify({
				workspaces: ['packages/*'],
			}),
			'./packages/foo/package.json': JSON.stringify({
				name: 'foo',
				dependencies: {
					bar: '1.0.0',
					qux: '1.0.0',
				},
			}),
			'./packages/bar/package.json': JSON.stringify({
				name: 'bar',
				dependencies: {
					baz: '1.0.0',
				},
			}),
			'./packages/baz/package.json': JSON.stringify({
				name: 'baz',
			}),
			'./packages/quz/package.json': JSON.stringify({
				name: 'qux',
			}),
		});

		const packages = await getPostOrder();

		mockfs.restore();
		expect(packages).toMatchInlineSnapshot(`
		Array [
		  "baz",
		  "bar",
		  "qux",
		  "foo",
		]
	`);
	});

	test('get dry run', async () => {
		mockfs({
			'./package.json': JSON.stringify({
				workspaces: ['packages/*'],
			}),
			'./packages/foo/package.json': JSON.stringify({
				name: 'foo',
				dependencies: {
					bar: '1.0.0',
					qux: '1.0.0',
				},
			}),
			'./packages/bar/package.json': JSON.stringify({
				name: 'bar',
				dependencies: {
					baz: '1.0.0',
				},
			}),
			'./packages/baz/package.json': JSON.stringify({
				name: 'baz',
			}),
			'./packages/quz/package.json': JSON.stringify({
				name: 'qux',
			}),
		});

		const dryRun = await getDryRun();

		mockfs.restore();
		expect(dryRun).toMatchInlineSnapshot(`
		Array [
		  "npm run prepare --workspace=\\"baz\\" --if-exists",
		  "npm run prepare --workspace=\\"bar\\" --if-exists",
		  "npm run prepare --workspace=\\"qux\\" --if-exists",
		  "npm run prepare --workspace=\\"foo\\" --if-exists",
		]
	`);
	});
});
