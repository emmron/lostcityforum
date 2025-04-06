/**
 * Prisma Fix Helper
 *
 * This script helps fix Prisma client generation issues
 * by removing the .prisma directory and reinstalling the client.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function runCommand(command) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    return false;
  }
}

function deleteFolderRecursive(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursive call
        deleteFolderRecursive(curPath);
      } else {
        // Delete file
        try {
          fs.unlinkSync(curPath);
        } catch (err) {
          console.error(`Failed to delete file: ${curPath}`, err);
        }
      }
    });
    try {
      fs.rmdirSync(directoryPath);
    } catch (err) {
      console.error(`Failed to delete directory: ${directoryPath}`, err);
    }
  }
}

async function main() {
  console.log('🔧 Fixing Prisma client generation...');

  // Path to the .prisma directory
  const prismaClientDir = path.join('node_modules', '.prisma');

  // Remove the .prisma directory
  console.log(`Removing ${prismaClientDir} directory...`);
  deleteFolderRecursive(prismaClientDir);

  // Reinstall Prisma client
  console.log('Reinstalling Prisma client...');
  runCommand('npm uninstall @prisma/client');
  runCommand('npm install @prisma/client');

  // Generate Prisma client
  console.log('Generating Prisma client...');
  runCommand('npx prisma generate');

  console.log('✅ Prisma client fixed!');
}

main().catch(console.error);
