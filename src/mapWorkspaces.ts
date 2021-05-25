import path from 'path';
import fs from 'fs';
import child_process from 'child_process';
import { readPackageJsonSync } from './readPackageJson';
import semver, { outside } from 'semver';
import { PackageJson } from 'type-fest';

/** finds the install location of the globally installed npm */
export function getNpmInstallLocation() {
	const whichNpm = child_process.execSync('which npm').toString().trim();

	const npmLstat = fs.lstatSync(whichNpm);

	if (!npmLstat.isSymbolicLink())
		throw new Error(`Expected ${whichNpm} to be a symlink`);

	const linkTarget = fs.readlinkSync(whichNpm);

	const realNpmBinLocation = path.resolve(path.dirname(whichNpm), linkTarget);

	const npmPackageLocation = path.resolve(
		path.dirname(realNpmBinLocation),
		'..'
	);

	const globalNpmPackageJson = readPackageJsonSync(
		path.resolve(npmPackageLocation, 'package.json')
	);

	const { version } = globalNpmPackageJson;

	if (version === undefined)
		throw new Error('Expected npm version field to be present');

	const desiredRange = '>=7';

	const npmSupportsWorkspaces = semver.satisfies(version, desiredRange);

	if (!npmSupportsWorkspaces)
		throw new Error(
			`Expected global npm version ${desiredRange}, found ${version}`
		);

	return npmPackageLocation;
}

interface MapWorkspacesInput {
	cwd: string;
	pkg: Pick<PackageJson, 'workspaces'>;
}

type implType = (input: MapWorkspacesInput) => Map<string, string>;

/** loads the currently installed implementation of @npmcli/map-workspaces from global npm */
function getGlobalMapWorkspacesImplementation(): implType {
	const npmInstallLocation = getNpmInstallLocation();

	const mapWorkspacesPackageLocation = path.resolve(
		npmInstallLocation,
		'node_modules/@npmcli/map-workspaces'
	);

	const mapWorkspacesImplementation = require(path.resolve(
		mapWorkspacesPackageLocation,
		'index.js'
	));

	return mapWorkspacesImplementation;
}

const impl = getGlobalMapWorkspacesImplementation();

export default async function mapWorkspaces({ cwd, pkg }: MapWorkspacesInput) {
	return impl({ cwd, pkg });
}
