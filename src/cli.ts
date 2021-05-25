import chalk from 'chalk';
import exec_p from './exec_p';
import { getPostOrder } from './lib';

async function performInstall() {
	const postOrder = await getPostOrder();

	for (const p of postOrder) {
		console.log(
			chalk.cyan('>'),
			`executing prepare script in workspace ${p}`
		);
		await exec_p(
			`npm run --workspace="${p}" prepare --if-present`,
			{
				NPM_CONFIG_COLOR: 'always',
			},
			true
		);
	}
}
async function main() {
	await performInstall();
}

main().catch(() => process.exit(1));
