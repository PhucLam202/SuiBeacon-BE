import chalk from "chalk";
import { exec } from "child_process";
import { promisify } from "util";
import ora from "ora";

const execPromise = promisify(exec);

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

async function removePackage(pkgInput: string) {
    // Split input by spaces to handle multiple packages
    const packages = pkgInput.split(/\s+/);
    
    // Create a single spinner for all operations
    const spinner = ora({
        spinner: "dots",
        text: chalk.blue(`Preparing to remove ${packages.length > 1 ? 'packages' : 'package'}...`)
    }).start();
    
    // Track results for summary
    const results = {
        success: [] as string[],
        notInstalled: [] as string[],
        failed: [] as {pkg: string, error: string}[]
    };
    
    // Process each package
    for (const pkg of packages) {
        try {
            spinner.text = chalk.blue(`Checking if ${pkg} is installed...`);
            const installed = await isPackageInstalled(pkg);
            
            if (!installed) {
                results.notInstalled.push(pkg);
                continue;
            }
            
            // Use nix profile remove
            spinner.text = chalk.blue(`Removing ${pkg}...`);
            const command = `nix --extra-experimental-features "nix-command flakes" profile remove ${pkg}`;
            await execPromise(command);
            
            results.success.push(pkg);
        } catch (err: any) {
            results.failed.push({pkg, error: err.message});
        }
    }
    
    // Show summary based on results
    if (results.success.length > 0) {
        spinner.succeed(chalk.green(`Successfully uninstalled ${results.success.join(', ')}`));
    } else if (packages.length > 0) {
        spinner.stop();
    }
    
    // Show not installed packages
    if (results.notInstalled.length > 0) {
        console.log(chalk.yellow(`The following packages were not installed: ${results.notInstalled.join(', ')}`));
    }
    
    // Show failed packages
    if (results.failed.length > 0) {
        console.log(chalk.red(`Failed to remove the following packages:`));
        for (const {pkg, error} of results.failed) {
            console.log(chalk.red(`  - ${pkg}: ${error}`));
        }
    }
}

export default removePackage;
