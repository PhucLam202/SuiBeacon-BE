import { exec } from 'child_process';
import chalk from 'chalk';
import ora, { Ora } from 'ora';
import PackageInfo from '../types/dataCli';
import fs from 'fs';
const FLAKE_FILE = "flake.nix";
const CACHE_FILE = "packages-cache.json";

async function installPackage(pkg: string, spinner: Ora, requestedVersion?: string) {
    try {
        const cacheContent = await fs.promises.readFile(CACHE_FILE, "utf8");
        const cache: Record<string, PackageInfo> = JSON.parse(cacheContent);
        
        const cleanVersion = requestedVersion?.replace(/^v/, '');
        
        const pkgEntry = Object.entries(cache).find(([path, info]) => {
            const name = path.split('.').pop();
            if (cleanVersion) {
                return name === pkg && info.version === cleanVersion;
            }
            return name === pkg;
        });

        if (!pkgEntry) {
            spinner.fail(chalk.red(`❌ Package ${pkg}${cleanVersion ? ` version ${cleanVersion}` : ''} not found`));
            return;
        }

        const [pkgPath, packageInfo] = pkgEntry as [string, PackageInfo];
        spinner.text = chalk.blue(`Installing ${pkg} version ${packageInfo.version}`);

        // Cài đặt package
        const installCommand = `nix-env -iA ${pkgPath}`;
        
        await new Promise((resolve, reject) => {
            exec(installCommand, (error, stdout, stderr) => {
                if (error) {
                    spinner.fail(chalk.red(`Error installing package: ${stderr}`));
                    reject(new Error(stderr));
                    return;
                }
                spinner.succeed(chalk.green(`✅ Successfully installed ${pkg} version ${packageInfo.version}`));
                resolve(stdout);
            });
        });

    } catch (err: any) {
        spinner.fail(chalk.red(`❌ Error: ${err.message}`));
    }
}

export default installPackage;
