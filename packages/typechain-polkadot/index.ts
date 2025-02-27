// Copyright (c) 2012-2022 Supercolony
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the"Software"),
// to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/**
 *  ## Typechain-polkadot
 *
 *	User-friendly tool to generate TypeScript types from Polkadot Contract ABIs.
 *
 *
 *	@remarks
 *	This tool generates TypeScript types from Polkadot Contract ABIs. It also provides Runtime-code to interact with the contracts.
 *  To deploy contract you should also provide .contract file with wasm and abi.
 *  If you don't need to deploy it you can just provide .json file with contract ABI.
 *
 *  @example
 *  # Usage from CLI
 *  ```bash
 *     $ npm i @arthswap/typechain-polkadot
 *     $ npx @arthswap/typechain-polkadot --in path/to/abis --out path/to/output/folder
 *  ```
 *
 *  @packageDocumentation
 */

import YARGS from 'yargs';

import TypechainPolkadot from "./src/types/typechain";
import PathAPI from "path";
import FsAPI from "fs";

const _argv = YARGS
	.option('input', {
		alias: ['in'],
		demandOption: "Please, specify, where to take ABIs",
		description: 'Input relative path',
		type: 'string',
	})
	.option('output', {
		demandOption: "Please, specify, where to put generated files",
		alias: ['out'],
		description: 'Output relative path',
		type: 'string',
	})
	.option('pluginsDir', {
		alias: ['plugins'],
		description: 'Plugins directory',
		type: 'string',
	})
	.help().alias( 'h', 'help')
	.argv;

async function main() {
	const argv = _argv as Awaited<typeof _argv>;

	const cwdPath = process.cwd();

	const typechain = new TypechainPolkadot();

	const pluginsDir = argv.pluginsDir ? PathAPI.resolve(cwdPath, argv.pluginsDir) : undefined;

	typechain.loadDefaultPlugins();

	if (pluginsDir) {
		// check all .plugin.ts files in pluginsDir
		// and load them

		const pluginFiles = FsAPI.readdirSync(pluginsDir);

		const pluginFileNames: string[] = [];

		for (const file of pluginFiles) {
			if (file.endsWith('.plugin.ts')) {
				pluginFileNames.push(PathAPI.resolve(pluginsDir, file));
			}
		}

		await typechain.loadPluginsFromFiles(pluginFileNames);
	}

	await typechain.run(
		PathAPI.resolve(cwdPath, `./${argv.input}`),
		PathAPI.resolve(cwdPath, `./${argv.output}`)
	);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});


