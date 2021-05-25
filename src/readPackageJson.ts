import { PackageJson } from 'type-fest';
import fsPromises from 'fs/promises';
import fs from 'fs';
import path from 'path';

export async function readPackageJson(p: string): Promise<PackageJson> {
	const file = await fsPromises.readFile(path.resolve(process.cwd(), p), {
		encoding: 'utf-8',
	});

	return JSON.parse(file);
}

export function readPackageJsonSync(p: string): PackageJson {
	const file = fs.readFileSync(path.resolve(process.cwd(), p), {
		encoding: 'utf8',
	});

	return JSON.parse(file);
}
