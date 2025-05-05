import boxen from "boxen";
import chalk from "chalk";
import { exec } from "child_process";
import { Ora } from "ora";
import { promisify } from "util";
import PackageInfo from "../types/dataCli";

// Promisify exec to use async/await
const execPromise = promisify(exec);

// Function to check if Nix is installed
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

// Function to calculate relevance score for packages based on search term
function calculateRelevance(pkgPath: string, info: any, searchTerm: string): number {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const name = pkgPath.split(".").pop()?.toLowerCase() || "";
    const pname = (info.pname || "").toLowerCase();
    const fullPath = pkgPath.toLowerCase();

    let score = 0;

    // Prioritize packages with exact or similar name matches
    if (name === lowerSearchTerm || pname === lowerSearchTerm) {
        score += 100;
    } else if (name.includes(lowerSearchTerm) || pname.includes(lowerSearchTerm)) {
        score += 50;
    }

    // Prioritize top-level packages (not in python3Packages)
    if (!fullPath.includes("python3packages")) {
        score += 20;
    }

    // Prioritize Python versions (e.g., python3, python310)
    if (/^python\d+$/.test(name) || /^python\d+full$/.test(name) || /^python\d+minimal$/.test(name)) {
        score += 30;
    }

    return score;
}

async function searchAvailablePackages(search?: string, spinner?: Ora) {
    try {
        // Check if Nix is installed before running commands
        await checkNixInstalled();

        // Display search start message
        if (spinner) {
            spinner.start(chalk.blue(`Searching packages${search ? ` for "${search}"` : ""}...`));
        }

        // If no search term provided, return a message
        if (!search) {
            if (spinner) {
                spinner.succeed(chalk.green("✅ Please provide a search term."));
            }
            console.log(chalk.yellow("Usage: beacon search <term>"));
            return;
        }

        // Escape special characters in search term to avoid shell errors
        const escapedSearch = search.replace(/'/g, "'\\''");

        // Call nix search with the term, enable experimental features and increase maxBuffer
        if (spinner) {
            spinner.text = chalk.blue(`Running search for "${search}"...`);
        }
        const { stdout } = await execPromise(
            `nix --extra-experimental-features "nix-command flakes" search nixpkgs '${escapedSearch}' --json --no-update-lock-file 2>/dev/null`,
            { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
        );

        // Parse JSON results from nix search
        const searchResults: Record<string, any> = JSON.parse(stdout);
        const packages: Record<string, PackageInfo> = {};

        // Convert results to PackageInfo format
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

        // Filter and sort packages by relevance
        const filteredPackages = Object.entries(packages)
            .map(([pkgPath, info]) => ({
                pkgPath,
                info,
                relevance: calculateRelevance(pkgPath, info, search),
            }))
            .filter(({ relevance }) => relevance > 0) // Only keep packages with relevance
            .sort((a, b) => b.relevance - a.relevance) // Sort in descending order by relevance
            .slice(0, 30) // Limit to 30 packages
            .map(({ pkgPath, info }) => [pkgPath, info] as [string, PackageInfo]);

        // Display success message
        if (spinner) {
            spinner.succeed(chalk.green("✅ Packages found:"));
        }

        // If no packages found, display a message
        if (filteredPackages.length === 0) {
            console.log(chalk.yellow("No packages found."));
            return;
        }

        // Format display results
        const formattedResults = filteredPackages
            .map(([pkgPath, info]) => {
                const name = pkgPath.split(".").pop();
                return chalk.green(`${name} `) + chalk.blue(`v${info.version}`);
            })
            .join("\n");

        // Display results in boxen
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
