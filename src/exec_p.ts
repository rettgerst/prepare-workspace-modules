import child_process from 'child_process';

/** simple promise wrapper for child_process.exec */
export default async function exec_p(
	command: string,
	env: Record<string, string | undefined> = {},
	pipe = false
) {
	return new Promise<string>((resolve, reject) => {
		const child = child_process.exec(
			command,
			{ env: { ...process.env, ...env } },
			(err, stdout) => {
				if (err) reject(err);
				else resolve(stdout);
			}
		);
		if (pipe) {
			child.stdout?.pipe(process.stdout);
			child.stderr?.pipe(process.stderr);
		}
	});
}
