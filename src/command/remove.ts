import chalk from "chalk";
import { exec } from "child_process";

async function removePackage(pkg: string) {
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

// Trả về true nếu gói đã được cài đặt
function isPackageInstalled(pkg: string): Promise<boolean> {
    return new Promise((resolve) => {
        exec(`nix-env -q ${pkg}`, (error) => {
            resolve(!error);
        });
    })
}

export default removePackage;