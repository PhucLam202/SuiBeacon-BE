/**
 * Package mapping configuration for updates
 * 
 * This file defines mappings between packages for the update command.
 * When a package is updated, it will be replaced with the target package.
 * 
 * Format:
 * {
 *   "sourcePackage": {
 *     "targetPackage": "newPackage",
 *     "description": "Optional description of why this mapping exists"
 *   }
 * }
 */

export interface PackageMapping {
  targetPackage: string;
  description?: string;
}

export interface PackageMappings {
  [sourcePackage: string]: PackageMapping;
}

const packageMappings: PackageMappings = {
  // Python version mappings
  "python310": {
    targetPackage: "python313",
    description: "Python 3.10 is outdated, upgrade to Python 3.13"
  },
  "python311": {
    targetPackage: "python313",
    description: "Python 3.11 is outdated, upgrade to Python 3.13"
  },
  "python312": {
    targetPackage: "python313",
    description: "Python 3.12 is outdated, upgrade to Python 3.13"
  },
  
  // Node.js version mappings
  "nodejs": {
    targetPackage: "nodejs_20",
    description: "Default Node.js should be upgraded to Node.js 20"
  },
  "nodejs_18": {
    targetPackage: "nodejs_20",
    description: "Node.js 18 is outdated, upgrade to Node.js 20"
  },
  
  // Add more package mappings as needed
};

export default packageMappings;