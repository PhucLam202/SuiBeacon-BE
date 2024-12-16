import boxen from "boxen";
import chalk from "chalk";
import { exec } from "child_process";
import { Ora } from "ora";
import fs from "fs";

const CACHE_FILE = "packages-cache.json";

async function searchAvailablePackages(search?: string, spinner?: Ora) {
    try {
        // Check if cache file exists
        const cacheExists = await fs.promises.access(CACHE_FILE)
            .then(() => true)
            .catch(() => false);

        // If cache does not exist or force update, create new cache
        if (!cacheExists) {
            spinner?.start(chalk.blue('Creating packages cache...'));
            const command = `nix search nixpkgs --json`;
            await new Promise((resolve, reject) => {
                exec(command, async (error, stdout, stderr) => {
                    if (error) {
                        reject(new Error(stderr));
                        return;
                    }
                    await fs.promises.writeFile(CACHE_FILE, stdout);
                    resolve(stdout);
                });
            });
        }

        // Read from cache
        const cacheContent = await fs.promises.readFile(CACHE_FILE, 'utf8');
        const packages = JSON.parse(cacheContent);

        // Filter packages by search term
        const filteredPackages = Object.entries(packages)
            .filter(([pkgPath, info]: [string, any]) => {
                const name = pkgPath.split('.').pop()?.toLowerCase() || '';
                const description = (info.description || '').toLowerCase();
                const searchTerm = (search || '').toLowerCase();
                
                return !search || 
                    name.includes(searchTerm) || 
                    description.includes(searchTerm);
            })
            .slice(0, 20);

        spinner?.succeed(chalk.green('✅ Packages found:'));

        if (filteredPackages.length === 0) {
            console.log(chalk.yellow('No packages found.'));
            return;
        }

        // Hiển thị kết quả
        const formattedResults = filteredPackages.map(([pkgPath, info]: [string, any]) => {
            const name = pkgPath.split('.').pop();
            return chalk.green(`${name} `) + 
                   chalk.blue(`v${info.version}`)
        }).join('\n');

        console.log(
            boxen(
                `Available packages:\n\n${formattedResults}`,
                {
                    padding: 1,
                    margin: 1,
                    borderStyle: 'round',
                    borderColor: 'green'
                }
            )
        );

        if (filteredPackages.length === 20) {
            console.log(chalk.yellow('\nShowing first 20 results. Use specific search terms to filter results.'));
        }

    } catch (err: any) {
        spinner?.fail(chalk.red(`❌ Error: ${err.message}`));
        console.error(err);
    }
}

export default searchAvailablePackages;               