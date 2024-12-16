import boxen from "boxen";
import chalk from "chalk";
import { exec } from "child_process";
import ora from "ora";

async function listPackages() {
    const spinner = ora({
        text: chalk.blue('Fetching installed packages...'),
        spinner: 'dots'
    }).start();

    const command = `nix-env -q --description`;
    exec(command, (error, stdout, stderr) => {
        if (error) {
            spinner.fail(chalk.red(`❌ Error fetching installed packages: ${stderr}`));
            return;
        }
        spinner.succeed();
        if (stdout.trim() === '') {
            console.log(chalk.yellow('No packages installed.'));
        } else {
            console.log(
                boxen(
                    chalk.green(`Installed packages:\n${stdout}`),
                    {
                        padding: 1,
                        margin: 1,
                        borderStyle: 'round',
                        borderColor: 'green'
                    }
                )
            );
        }
    });
}

export default listPackages;