import mapWorkspaces from './mapWorkspaces';
import { readPackageJson } from './readPackageJson';
import path from 'path';
import crawl from 'tree-crawl';
import { PackageJson, PromiseValue } from 'type-fest';

async function Promise_allObj<K extends string | number | symbol, V, MV>(
	obj: Record<K, V>,
	fn: (input: [k: K, v: V]) => Promise<MV>
): Promise<Record<K, MV>> {
	const entries = Object.entries(obj) as [K, V][];
	const promises = entries.map(async ([k, v]) => [
		k,
		await fn([k, v]),
	]) as Promise<[K, MV]>[];
	const mappedEntries = await Promise.all(promises);

	return Object.fromEntries(mappedEntries) as Record<K, MV>;
}

export async function getRootPjson() {
	return readPackageJson('package.json');
}

export async function getWorkspaces(pjson: PackageJson) {
	const { workspaces = [] } = pjson;

	if (!Array.isArray(workspaces))
		throw new Error(`This package only supports npm-style workspaces.`);

	const mapped = await mapWorkspaces({ cwd: process.cwd(), pkg: pjson });

	const relativeEntries = Array.from(mapped.entries()).map(
		([name, workspacePath]) => [
			name,
			path.relative(process.cwd(), workspacePath),
		]
	);

	const relativeMapped = Object.fromEntries(relativeEntries) as Record<
		string,
		string
	>;

	return relativeMapped;
}

export async function getPackages(
	workspaces: PromiseValue<ReturnType<typeof getWorkspaces>>
) {
	const packages = Promise_allObj(workspaces, async ([name, packagePath]) =>
		readPackageJson(path.resolve(packagePath, 'package.json'))
	);

	return packages;
}

export async function getPostOrder() {
	const rootPjson = await getRootPjson();

	const workspaces = await getWorkspaces(rootPjson);

	const packages = await getPackages(workspaces);

	const postOrder: string[] = [];

	const root = Symbol();

	crawl<symbol | string>(
		root,
		node => {
			if (node !== root && !postOrder.includes(node as string))
				postOrder.push(node as string);
		},
		{
			order: 'post',
			getChildren: node => {
				if (node === root) return Object.keys(packages);
				else {
					const { dependencies = {}, devDependencies = {} } =
						packages[node as string];

					const depNames = Object.keys(dependencies);
					const devDepNames = Object.keys(devDependencies);

					const allDepNames = [...depNames, ...devDepNames];

					const localDeps = allDepNames.filter(n => n in packages);

					return localDeps;
				}
			},
		}
	);

	return postOrder;
}

export async function getDryRun() {
	const postOrder = await getPostOrder();

	const steps = postOrder.map(
		p => `npm run prepare --workspace="${p}" --if-exists`
	);

	return steps;
}
