import chalk from "chalk";
import { exec } from "child_process";
import { promisify } from "util";
import ora from "ora";

const execPromise = promisify(exec);

async function removePackage(pkg: string) {
    const spinner = ora({
        text: chalk.blue(`Removing ${pkg}...`),
        spinner: "dots",
    }).start();
    
    try {
        const installed = await isPackageInstalled(pkg);
        
        if (!installed) {
            spinner.fail(chalk.yellow(`❌ Package ${pkg} is not installed.`));
            return;
        }
        
        // Use nix profile remove instead of nix-env -e
        const command = `nix --extra-experimental-features "nix-command flakes" profile remove ${pkg}`;
        await execPromise(command);
        
        spinner.succeed(chalk.green(`✅ Successfully uninstalled ${pkg}`));
    } catch (err: any) {
        spinner.fail(chalk.red(`❌ Error: ${err.message}`));
        console.error(chalk.yellow("Full error details:"), err);
    }
}

/**
 * Checks if a package is installed
 * @param pkg Package name to check
 * @returns True if the package is installed
 */
async function isPackageInstalled(pkg: string): Promise<boolean> {
    try {
        // Use nix profile list to check if package is installed
        const { stdout } = await execPromise(
            `nix --extra-experimental-features "nix-command flakes" profile list --json 2>/dev/null`
        );
        
        // Parse the profile data
        const profileData = JSON.parse(stdout);
        const elements = profileData.elements || {};
        
        // Check if the package exists in the profile
        return Object.keys(elements).includes(pkg);
    } catch (error) {
        console.error(chalk.yellow(`Warning: Error checking if ${pkg} is installed`), error);
        return false;
    }
}

export default removePackage;
