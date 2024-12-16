import { spawn } from 'child_process';
import { Command } from 'commander';
import chalk from 'chalk';
import ora, { Ora } from 'ora';
import installPackage from './command/install.js';
import listPackages from './command/list.js';
import removePackage from './command/remove.js';
import searchAvailablePackages from './command/search.js';
import updatePackage from './command/update.js';


const program = new Command();
program
    .name('drop')
    .description('CLI tool powered by Nix for package management')
    .version('1.0.0');


// // Lệnh install
program
    .command('install <package> [version]')
    .description('Install a package with optional version')
    .action((pkg, version) => {
        const spinner = ora({
            text: chalk.blue(`Installing ${pkg}${version ? ` version ${version}` : ''}`),
            spinner: 'dots'
        }).start();

        installPackage(pkg, spinner, version);
        console.log(chalk.green('Package installed successfully'));
    });

// Lệnh list package installed
program
    .command('list')
    .description('List all installed packages')
    .action(() => {
        console.log(chalk.inverse('Fetching installed packages...'));
        listPackages();
    });

// Lệnh remove package
program
    .command('remove <package>')
    .description('remove a package')
    .action((pkg: string) => {
        console.log(chalk.blue(`Removing ${pkg}`));
        removePackage(pkg);
    });

// Lệnh search
program
    .command('search [search]')
    .description('Search available packages')
    .action((search?: string) => {
        const spinner = ora({
            text: chalk.blue('Searching for packages...'),
            spinner: 'dots'
        }).start();
        searchAvailablePackages(search, spinner);
    });

program
    .command('devVM')
    .description('Start a development shell using')
    .action(() => {
        console.log(chalk.blue('Starting development shell...'));
        startDevelopmentShell();
    });
// Lệnh update
program
    .command('update <package>')
    .description('Update a package')
    .action((pkg: string) => {
        console.log(chalk.blue(`Updating ${pkg}...`));
        updatePackage(pkg);
    });
function startDevelopmentShell() {
    const nixShell = spawn('nix', ['develop'], {
        stdio: 'inherit'
    });
}

// Chạy CLI
program.parse(process.argv);

