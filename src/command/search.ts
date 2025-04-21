import boxen from "boxen";
import chalk from "chalk";
import { exec } from "child_process";
import { Ora } from "ora";
import { promisify } from "util";
import PackageInfo from "../types/dataCli";

// Promisify exec để sử dụng async/await
const execPromise = promisify(exec);

// Hàm kiểm tra xem Nix đã được cài đặt chưa
async function checkNixInstalled(): Promise<void> {
    try {
        await execPromise("nix --version");
    } catch {
        throw new Error(
            "Nix is not installed. Please install it with:\n" +
            "sh <(curl -L https://nixos.org/nix/install) --no-daemon"
        );
    }
}

// Hàm tính điểm relevance cho gói dựa trên search term
function calculateRelevance(pkgPath: string, info: any, searchTerm: string): number {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const name = pkgPath.split(".").pop()?.toLowerCase() || "";
    const pname = (info.pname || "").toLowerCase();
    const fullPath = pkgPath.toLowerCase();

    let score = 0;

    // Ưu tiên gói có tên khớp chính xác hoặc gần giống
    if (name === lowerSearchTerm || pname === lowerSearchTerm) {
        score += 100;
    } else if (name.includes(lowerSearchTerm) || pname.includes(lowerSearchTerm)) {
        score += 50;
    }

    // Ưu tiên gói ở top-level (không nằm trong python3Packages)
    if (!fullPath.includes("python3packages")) {
        score += 20;
    }

    // Ưu tiên các phiên bản Python (e.g., python3, python310)
    if (/^python\d+$/.test(name) || /^python\d+full$/.test(name) || /^python\d+minimal$/.test(name)) {
        score += 30;
    }

    return score;
}

async function searchAvailablePackages(search?: string, spinner?: Ora) {
    try {
        // Kiểm tra Nix trước khi chạy lệnh
        await checkNixInstalled();

        // Hiển thị thông báo bắt đầu tìm kiếm
        if (spinner) {
            spinner.start(chalk.blue(`Searching packages${search ? ` for "${search}"` : ""}...`));
        }

        // Nếu không có từ khóa tìm kiếm, trả về thông báo
        if (!search) {
            if (spinner) {
                spinner.succeed(chalk.green("✅ Please provide a search term."));
            }
            console.log(chalk.yellow("Usage: beacon search <term>"));
            return;
        }

        // Thoát các ký tự đặc biệt trong từ khóa tìm kiếm để tránh lỗi shell
        const escapedSearch = search.replace(/'/g, "'\\''");

        // Gọi nix search với từ khóa, bật experimental features và tăng maxBuffer
        if (spinner) {
            spinner.text = chalk.blue(`Running nix search for "${search}"...`);
        }
        const { stdout } = await execPromise(
            `nix --extra-experimental-features "nix-command flakes" search nixpkgs '${escapedSearch}' --json --no-update-lock-file 2>/dev/null`,
            { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
        );

        // Phân tích kết quả JSON từ nix search
        const searchResults: Record<string, any> = JSON.parse(stdout);
        const packages: Record<string, PackageInfo> = {};

        // Chuyển đổi kết quả thành định dạng PackageInfo
        for (const [pkgPath, info] of Object.entries(searchResults)) {
            packages[pkgPath] = {
                name: pkgPath.split(".").pop() || pkgPath,
                pname: info.pname || "",
                version: info.version || "unknown",
                description: info.description || "",
                license: info.license?.fullName || "unknown",
                type: "unknown", // Adjust based on PackageInfo definition
            };
        }

        // Lọc và sắp xếp gói theo relevance
        const filteredPackages = Object.entries(packages)
            .map(([pkgPath, info]) => ({
                pkgPath,
                info,
                relevance: calculateRelevance(pkgPath, info, search),
            }))
            .filter(({ relevance }) => relevance > 0) // Chỉ giữ các gói có relevance
            .sort((a, b) => b.relevance - a.relevance) // Sắp xếp giảm dần theo relevance
            .slice(0, 30) // Giới hạn 30 gói
            .map(({ pkgPath, info }) => [pkgPath, info] as [string, PackageInfo]);

        // Hiển thị thông báo thành công
        if (spinner) {
            spinner.succeed(chalk.green("✅ Packages found:"));
        }

        // Nếu không tìm thấy gói, thông báo
        if (filteredPackages.length === 0) {
            console.log(chalk.yellow("No packages found."));
            return;
        }

        // Định dạng kết quả hiển thị
        const formattedResults = filteredPackages
            .map(([pkgPath, info]) => {
                const name = pkgPath.split(".").pop();
                return chalk.green(`${name} `) + chalk.blue(`v${info.version}`);
            })
            .join("\n");

        // Hiển thị kết quả trong boxen
        console.log(
            boxen(`Available packages:\n\n${formattedResults}`, {
                padding: 1,
                margin: 1,
                borderStyle: "round",
                borderColor: "green",
            })
        );
    } catch (err: any) {
        if (spinner) {
            spinner.fail(chalk.red(`❌ Error: ${err.message}`));
        }
        console.error(chalk.yellow("Full error details:"), err);
        console.error(
            chalk.yellow(
                "If this error persists, try enabling nix-command and flakes permanently:\n" +
                "mkdir -p ~/.config/nix && echo 'experimental-features = nix-command flakes' >> ~/.config/nix/nix.conf"
            )
        );
    }
}

export default searchAvailablePackages;