#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';

/**
 * Checks if Nix is installed
 * @returns {boolean} True if Nix is installed
 */
function isNixInstalled() {
  try {
    execSync('nix --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Ensures the Nix configuration directory exists
 * @returns {string} Path to the Nix config directory
 */
function ensureNixConfigDir() {
  const nixConfigDir = path.join(os.homedir(), '.config', 'nix');
  
  if (!fs.existsSync(nixConfigDir)) {
    console.log(chalk.blue('Creating Nix config directory...'));
    fs.mkdirSync(nixConfigDir, { recursive: true });
  }
  
  return nixConfigDir;
}

/**
 * Ensures the Nix configuration file exists with required settings
 * @param {string} configDir Path to the Nix config directory
 */
function ensureNixConfig(configDir) {
  const configPath = path.join(configDir, 'nix.conf');
  const requiredConfig = 'experimental-features = nix-command flakes';
  
  if (fs.existsSync(configPath)) {
    const currentConfig = fs.readFileSync(configPath, 'utf8');
    
    if (!currentConfig.includes(requiredConfig)) {
      console.log(chalk.blue('Updating Nix configuration...'));
      fs.appendFileSync(configPath, `\n${requiredConfig}\n`);
    }
  } else {
    console.log(chalk.blue('Creating Nix configuration file...'));
    fs.writeFileSync(configPath, `${requiredConfig}\n`);
  }
}

/**
 * Installs Nix on the system
 */
function installNix() {
  console.log(chalk.blue('Installing Nix...'));
  
  try {
    const platform = os.platform();
    
    if (platform === 'linux' || platform === 'darwin') {
      // For Linux and macOS
      console.log(chalk.yellow('Running Nix installer. This may require sudo permissions.'));
      execSync('curl -L https://nixos.org/nix/install | sh -s -- --no-daemon', { 
        stdio: 'inherit'
      });
    } else if (platform === 'win32') {
      process.exit(1);
    } else {
      console.error(chalk.red(`Unsupported platform: ${platform}`));
      process.exit(1);
    }
    
    console.log(chalk.green('✅ Nix installed successfully'));
  } catch (error) {
    console.error(chalk.red('Failed to install '), error.message);
    console.log(chalk.yellow('Please install Nix manually from: https://nixos.org/download.html'));
    process.exit(1);
  }
}

// Main function
async function main() {
  console.log(chalk.blue('Checking Dependencies installation...'));
  
  if (!isNixInstalled()) {
    installNix();
    
    // Check again after installation
    if (!isNixInstalled()) {

      process.exit(1);
    }
  } else {
  }
  
  // Ensure Nix configuration
  const nixConfigDir = ensureNixConfigDir();
  ensureNixConfig(nixConfigDir);
}

main().catch(error => {
  console.error(chalk.red('Error:'), error);
  process.exit(1);
});