import { exec, spawn } from 'child_process';
import { Command } from 'commander';
import chalk from 'chalk';
import ora, { Ora } from 'ora';
import boxen from 'boxen';
import fs from "fs";
const program = new Command();
const FLAKE_FILE = "flake.nix";
const CACHE_FILE = "packages-cache.json";

program
    .name('drop')
    .description('CLI tool powered by Nix for package management')
    .version('1.0.0');

// Lệnh install
program
    .command('install <package> [version]')
    .description('Install a package with optional version')
    .action((pkg, version) => {
        const spinner = ora({
            text: chalk.blue(`Installing ${pkg}${version ? ` version ${version}` : ''}`),
            spinner: 'dots'
        }).start();

        installPackage(pkg, spinner, version);
    });

// Lệnh installed
program
    .command('installed')
    .description('List all installed packages')
    .action(() => {
        console.log(chalk.inverse('Fetching installed packages...'));
        listInstalledPackages();
    });

// Lệnh uninstall
program
    .command('remove <package>')
    .description('remove a package')
    .action((pkg: string) => {
        console.log(chalk.blue(`Removing ${pkg}`));
        uninstallPackage(pkg);
    });

// Lệnh list
program
    .command('list [search]')
    .description('List available packages from nixpkgs')
    .action((search?: string) => {
        const spinner = ora({
            text: chalk.blue('Searching for packages...'),
            spinner: 'dots'
        }).start();
        listAvailablePackages(search, spinner);
    });

program
    .command('devVM')
    .description('Start a development shell using')
    .action(() => {
        console.log(chalk.blue('Starting development shell...'));
        startDevelopmentShell();
    });

// Thêm interface định nghĩa kiểu dữ liệu cho package
interface PackageInfo {
    version: string;
    description: string;
    homepage?: string;
    license: string;
    pname: string;
    type: string;
}

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

async function listInstalledPackages() {
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

async function uninstallPackage(pkg: string) {
    try {
        const installed = await isPackageInstalled(pkg);
        
        if (!installed) {
            console.log(chalk.yellow(`❌ Package ${pkg} is not installed.`));
            return;
        }

        const command = `nix-env -e ${pkg}`;
        await new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(stderr));
                    return;
                }
                resolve(stdout);
            });
        });
        
        console.log(chalk.green(`✅ Successfully uninstalled ${pkg}`));
    } catch (err: any) {
        console.error(chalk.red(`❌ Error: ${err.message}`));
    }
}

async function listAvailablePackages(search?: string, spinner?: Ora) {
    try {
        // Kiểm tra xem file cache có tồn tại không
        const cacheExists = await fs.promises.access(CACHE_FILE)
            .then(() => true)
            .catch(() => false);

        // Nếu không có cache hoặc force update, tạo cache mới
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

        // Đọc từ cache
        const cacheContent = await fs.promises.readFile(CACHE_FILE, 'utf8');
        const packages = JSON.parse(cacheContent);

        // Lọc packages theo từ khóa tìm kiếm
        const filteredPackages = Object.entries(packages)
            .filter(([pkgPath, info]: [string, any]) => {
                const name = pkgPath.split('.').pop()?.toLowerCase() || '';
                const description = (info.description || '').toLowerCase();
                const searchTerm = (search || '').toLowerCase();
                
                return !search || 
                    name.includes(searchTerm) || 
                    description.includes(searchTerm);
            })
            .slice(0, 20); // Giới hạn 20 kết quả

        spinner?.succeed(chalk.green('✅ Packages found:'));

        if (filteredPackages.length === 0) {
            console.log(chalk.yellow('No packages found.'));
            return;
        }

        // Hiển thị kết quả
        const formattedResults = filteredPackages.map(([pkgPath, info]: [string, any]) => {
            const name = pkgPath.split('.').pop();
            return chalk.green(`${name} `) + 
                   chalk.blue(`v${info.version}`) +
                   `\n  ${info.description || 'No description'}` +
                   (info.homepage ? `\n  Homepage: ${info.homepage}` : '') +
                   `\n  License: ${info.license || 'N/A'}\n`;
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

function startDevelopmentShell() {
    const nixShell = spawn('nix', ['develop'], {
        stdio: 'inherit'
    });
}
// Trả về true nếu gói đã được cài đặt
function isPackageInstalled(pkg: string): Promise<boolean> {
    return new Promise((resolve) => {
        exec(`nix-env -q ${pkg}`, (error) => {
            resolve(!error);
        });
    });
}
// Chạy CLI
program.parse(process.argv);

