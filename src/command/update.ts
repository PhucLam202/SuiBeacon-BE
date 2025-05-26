import { exec } from 'child_process';
import chalk from 'chalk';
import ora, { Ora } from 'ora';
import { promisify } from 'util';
import packageMappings from '../config/package-mappings.js';
import installPackage from './install.js';
import boxen from 'boxen';

const execPromise = promisify(exec);

async function updatePackage(pkg: string) {
    const spinner = ora({
        spinner: "dots",
    }).start();

    try {
        // First check if the package is installed
        const { stdout: profileJson } = await execPromise(
            `nix --extra-experimental-features "nix-command flakes" profile list --json 2>/dev/null`
        );
        
        const profileData = JSON.parse(profileJson);
        const elements = profileData.elements || {};
        
        if (!Object.keys(elements).includes(pkg)) {
            spinner.fail(chalk.yellow(`Package ${pkg} is not installed.`));
            
            // Simple message without recommendations
            const message = `${chalk.yellow('Package not found:')} ${chalk.bold(pkg)}\n\n` +
                           `To install this package, use:\n` +
                           `${chalk.green(`beacon install ${pkg}`)}`;
            
            console.log(
                boxen(message, {
                    padding: 1,
                    margin: 1,
                    borderStyle: "round",
                    borderColor: "yellow",
                })
            );
            
            return;
        }

        // Get current version
        const currentInfo = elements[pkg];
        const storePath = currentInfo.storePaths[0].split("/").pop() || "";
        const versionMatch = storePath.match(/-(\d+\.\d+\.\d+[^-]*)$/);
        const currentVersion = versionMatch ? versionMatch[1] : "unknown";
        
        // Check if there's a mapping for this package
        let targetPkg = pkg;
        
        if (packageMappings[pkg]) {
            targetPkg = packageMappings[pkg].targetPackage;
            const mappingDescription = packageMappings[pkg].description || "";
            
            // Check if the target package is already installed
            if (Object.keys(elements).includes(targetPkg)) {
                const targetInfo = elements[targetPkg];
                const targetStorePath = targetInfo.storePaths[0].split("/").pop() || "";
                const targetVersionMatch = targetStorePath.match(/-(\d+\.\d+\.\d+[^-]*)$/);
                const targetVersion = targetVersionMatch ? targetVersionMatch[1] : "unknown";
                
                // Use nix command directly instead of removePackage
                const removeCommand = `nix --extra-experimental-features "nix-command flakes" profile remove ${pkg}`;
                await execPromise(removeCommand);
                
                spinner.succeed(chalk.green(`Successfully upgraded from ${pkg} v${currentVersion} to ${targetPkg} v${targetVersion}`));
                return;
            }
            
            // First remove the old package - use nix command directly
            const removeCommand = `nix --extra-experimental-features "nix-command flakes" profile remove ${pkg}`;
            await execPromise(removeCommand);
                        
            try {
                // Call installPackage with the target package name and spinner
                await installPackage(targetPkg, spinner);
                
                // Get the version of the newly installed package
                const { stdout: newProfileJson } = await execPromise(
                    `nix --extra-experimental-features "nix-command flakes" profile list --json 2>/dev/null`
                );
                
                const newProfileData = JSON.parse(newProfileJson);
                const newElements = newProfileData.elements || {};
                const newInfo = newElements[targetPkg];
                
                let newVersion = "unknown";
                if (newInfo) {
                    const newStorePath = newInfo.storePaths[0].split("/").pop() || "";
                    const newVersionMatch = newStorePath.match(/-(\d+\.\d+\.\d+[^-]*)$/);
                    newVersion = newVersionMatch ? newVersionMatch[1] : "unknown";
                }
                
                spinner.succeed(chalk.green(`Successfully upgraded from ${pkg} v${currentVersion} to ${targetPkg} v${newVersion}`));
                return;
            } catch (installError) {
                // If installation fails, inform the user
                spinner.fail(chalk.red(`Error installing ${targetPkg}: ${installError || 'Unknown installation error'}`));
                console.log(chalk.yellow(`Note: The old package ${pkg} was already removed.`));
                console.log(chalk.yellow(`You can install ${targetPkg} manually with: beacon install ${targetPkg}`));
                return;
            }
        } else {
            
            // Store current version for later comparison
            const currentVersionSaved = currentVersion;
            
            // Use nix command directly to remove the package
            const removeCommand = `nix --extra-experimental-features "nix-command flakes" profile remove ${pkg}`;
            await execPromise(removeCommand);
            
            // Reinstall the package with the latest version
            try {
                // Call installPackage with package name and spinner
                await installPackage(pkg, spinner);
                
                // Get the version of the newly installed package
                const { stdout: newProfileJson } = await execPromise(
                    `nix --extra-experimental-features "nix-command flakes" profile list --json 2>/dev/null`
                );
                
                const newProfileData = JSON.parse(newProfileJson);
                const newElements = newProfileData.elements || {};
                const newInfo = newElements[pkg];
                
                let newVersion = "unknown";
                if (newInfo) {
                    const newStorePath = newInfo.storePaths[0].split("/").pop() || "";
                    const newVersionMatch = newStorePath.match(/-(\d+\.\d+\.\d+[^-]*)$/);
                    newVersion = newVersionMatch ? newVersionMatch[1] : "unknown";
                }
                
                spinner.succeed(chalk.green(`Successfully updated ${pkg} from v${currentVersionSaved} to v${newVersion}`));
            } catch (installError) {
                // If installation fails, inform the user
                spinner.fail(chalk.red(`Error reinstalling ${pkg}: ${installError || 'Unknown installation error'}`));
                console.log(chalk.yellow(`Note: The old version of ${pkg} was already removed.`));
                console.log(chalk.yellow(`You can install ${pkg} manually with: beacon install ${pkg}`));
            }
        }
    } catch (error: any) {
        spinner.fail(chalk.red(`Error updating package: ${error.message}`));
        console.error(chalk.yellow("Full error details:"), error);
    }
}

export default updatePackage;
