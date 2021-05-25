import { getNpmInstallLocation } from './mapWorkspaces';
async function main() {
	const npmLocation = getNpmInstallLocation();
	console.log('npm location:', npmLocation);
}

main();
