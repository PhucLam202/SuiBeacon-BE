import { exec } from 'child_process';
import chalk from 'chalk';

function updatePackage(pkg: string) {
    exec(`nix-env -u ${pkg}`, (error, stdout, stderr) => {
        if (error) {
            console.error(chalk.red(`Error updating package: ${error.message}`));
            return;
        }
        if (stderr) {
            console.error(chalk.red(`Error: ${stderr}`));
            return;
        }
        console.log(chalk.green(`Successfully updated package: ${pkg}`));
    });
}

export default updatePackage;