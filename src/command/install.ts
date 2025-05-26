import { exec } from 'child_process';
import chalk from 'chalk';
import ora, { Ora } from 'ora';
import { promisify } from 'util';
import PackageInfo from '../types/dataCli.js';

// Promisify exec to use async/await
const execPromise = promisify(exec);

async function installPackage(pkg: string, spinner: Ora, requestedVersion?: string, flakeUrl?: string) {
    try {
        // Xác định flake source
        const flakeSource = flakeUrl || 'nixpkgs';

        // Kiểm tra xem gói đã được cài đặt chưa
        try {
            const { stdout: profileJson } = await execPromise(
                `nix --extra-experimental-features "nix-command flakes" profile list --json 2>/dev/null`
            );
            
            const profileData = JSON.parse(profileJson);
            const elements = profileData.elements || {};
            
            if (Object.keys(elements).includes(pkg)) {
                const pkgInfo = elements[pkg];
                const storePath = pkgInfo.storePaths[0].split("/").pop() || "";
                const versionMatch = storePath.match(/-(\d+\.\d+\.\d+[^-]*)$/);
                const installedVersion = versionMatch ? versionMatch[1] : "unknown";
                
                spinner.info(chalk.blue(`Package ${pkg} is already installed (version ${installedVersion})`));
                
                // Nếu có yêu cầu phiên bản cụ thể và khác với phiên bản đã cài đặt
                if (requestedVersion && installedVersion !== requestedVersion) {
                    spinner.text = chalk.blue(`Updating ${pkg} to version ${requestedVersion}...`);
                    // Tiếp tục với quá trình cài đặt
                } else {
                    return; // Không cần cài đặt lại
                }
            }
        } catch (checkErr) {
            // Bỏ qua lỗi kiểm tra và tiếp tục với quá trình cài đặt
        }

        // Tạo đường dẫn cài đặt
        let installPath = `${flakeSource}#${pkg}`;
        
        // Nếu có yêu cầu phiên bản cụ thể, thử tìm gói với phiên bản đó
        if (requestedVersion) {
            spinner.text = chalk.blue(`Searching for ${pkg} version ${requestedVersion}...`);
            
            try {
                // Tìm kiếm gói trong nixpkgs
                const { stdout } = await execPromise(
                    `nix --extra-experimental-features "nix-command flakes" search ${flakeSource} '${pkg}' --json --no-update-lock-file 2>/dev/null`,
                    { maxBuffer: 10 * 1024 * 1024 }
                );
                
                const searchResults = JSON.parse(stdout);
                
                // Tìm gói phù hợp với phiên bản yêu cầu
                const matchingPkg = Object.entries(searchResults).find(([path, info]: [string, any]) => {
                    return info.version === requestedVersion;
                });
                
                if (matchingPkg) {
                    const [pkgPath, info] = matchingPkg;
                    installPath = `${flakeSource}#${pkgPath.split('.').pop()}`;
                }
            } catch (searchErr) {
                // Bỏ qua lỗi tìm kiếm và sử dụng đường dẫn mặc định
            }
        }

        // Cập nhật spinner để hiển thị thông báo cài đặt
        spinner.text = chalk.blue(`Installing ${pkg} from ${flakeSource}${requestedVersion ? ` (version ${requestedVersion})` : ''}...`);

        // Cài đặt gói sử dụng nix profile
        const installCommand = `nix --extra-experimental-features "nix-command flakes" profile install ${installPath} 2>/dev/null`;

        await execPromise(installCommand);

        // Lấy thông tin về phiên bản đã cài đặt
        const { stdout: newProfileJson } = await execPromise(
            `nix --extra-experimental-features "nix-command flakes" profile list --json 2>/dev/null`
        );
        
        const newProfileData = JSON.parse(newProfileJson);
        const newElements = newProfileData.elements || {};
        const newInfo = newElements[pkg];
        
        let installedVersion = "unknown";
        if (newInfo) {
            const newStorePath = newInfo.storePaths[0].split("/").pop() || "";
            const newVersionMatch = newStorePath.match(/-(\d+\.\d+\.\d+[^-]*)$/);
            installedVersion = newVersionMatch ? newVersionMatch[1] : "unknown";
        }

        spinner.succeed(chalk.green(`Successfully installed ${pkg} from ${flakeSource} (version ${installedVersion})`));
    } catch (err: any) {
        spinner.fail(chalk.red(`Error: ${err.message}`));
        console.error(chalk.yellow("Full error details:"), err);
        console.error(
            chalk.yellow(
                "If this error persists, ensure the flake is accessible and flakes are enabled:\n" +
                "1. Check Nix version and flake support: nix --version\n" +
                "2. Enable flakes: mkdir -p ~/.config/nix && echo 'experimental-features = nix-command flakes' >> ~/.config/nix/nix.conf\n" +
                "3. Verify package availability: nix search ${flakeSource} ${pkg} --json"
            )
        );
    }
}

export default installPackage;
