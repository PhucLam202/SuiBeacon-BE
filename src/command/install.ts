import { exec } from 'child_process';
import chalk from 'chalk';
import ora, { Ora } from 'ora';
import { promisify } from 'util';
import PackageInfo from '../types/dataCli.js';

// Promisify exec to use async/await
const execPromise = promisify(exec);

async function installPackage(pkg: string, spinner: Ora, requestedVersion?: string) {
    try {
        // Display message for starting package search

        // Escape special characters in package name to avoid shell errors
        const escapedPkg = pkg.replace(/'/g, "'\\''");

        // Remove 'v' prefix from requestedVersion (if present)
        const cleanVersion = requestedVersion?.replace(/^v/, '');

        // Call nix search to find package in nixpkgs
        const { stdout } = await execPromise(
            `nix --extra-experimental-features "nix-command flakes" search nixpkgs '${escapedPkg}' --json --no-update-lock-file 2>/dev/null`,
            { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
        );

        // Parse JSON results from nix search
        const searchResults: Record<string, any> = JSON.parse(stdout);

        // Function to calculate relevance score to prioritize main packages
        const calculateRelevance = (pkgPath: string, info: any): number => {
            const name = pkgPath.split('.').pop()?.toLowerCase() || '';
            const fullPath = pkgPath.toLowerCase();
            let score = 0;

            if (name === pkg.toLowerCase()) {
                score += 100;
            } else if (name.includes(pkg.toLowerCase())) {
                score += 50;
            }

            if (!fullPath.includes('python3packages')) {
                score += 20;
            }

            if (/^python\d+$/.test(name) || /^python\d+full$/.test(name) || /^python\d+minimal$/.test(name)) {
                score += 30;
            }

            return score;
        };

        // Find suitable package
        const pkgEntries = Object.entries(searchResults)
            .map(([path, info]) => ({
                path,
                info,
                relevance: calculateRelevance(path, info),
            }))
            .filter(({ relevance }) => relevance > 0)
            .sort((a, b) => b.relevance - a.relevance);

        const pkgEntry = pkgEntries.find(({ info }) => {
            if (cleanVersion) {
                return info.version === cleanVersion;
            }
            return true;
        });

        if (!pkgEntry) {
            spinner.fail(chalk.red(`Package ${pkg}${cleanVersion ? ` version ${cleanVersion}` : ''} not found in nixpkgs`));
            return;
        }

        const { path: pkgPath, info: packageInfoRaw } = pkgEntry;
        const packageInfo: PackageInfo = {
            name: pkgPath.split('.').pop() || pkg,
            pname: packageInfoRaw.pname || pkg,
            version: packageInfoRaw.version || 'unknown',
            description: packageInfoRaw.description || '',
            license: packageInfoRaw.license?.fullName || 'unknown',
            type: 'unknown', // Adjust based on PackageInfo definition
        };

        // Transform pkgPath for use with nix profile
        const installPath = `nixpkgs#${pkgPath.split('.').pop()}`;

        // Update spinner to display installation message
        spinner.text = chalk.blue(`Installing ${pkg} version ${packageInfo.version}`);

        // Install package using nix profile
        const installCommand = `nix --extra-experimental-features "nix-command flakes" profile install ${installPath} 2>/dev/null`;

        await new Promise((resolve, reject) => {
            exec(installCommand, (error, stdout, stderr) => {
                if (error) {
                    spinner.fail(chalk.red(`Error installing package: ${stderr}`));
                    reject(new Error(stderr));
                    return;
                }
                resolve(stdout);
            });
        });

    } catch (err: any) {
        spinner.fail(chalk.red(`Error: ${err.message}`));
        console.error(chalk.yellow("Full error details:"), err);
        console.error(
            chalk.yellow(
                "If this error persists, ensure the nixpkgs flake is accessible and flakes are enabled:\n" +
                "1. Check Nix version and flake support: nix --version\n" +
                "2. Enable flakes: mkdir -p ~/.config/nix && echo 'experimental-features = nix-command flakes' >> ~/.config/nix/nix.conf\n" +
                "3. Update nixpkgs channel (if using channels): nix-channel --update\n" +
                "4. Verify package availability: nix search nixpkgs ${pkg} --json"
            )
        );
    }
}

export default installPackage;
