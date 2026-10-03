#!/usr/bin/env bun

/**
 * Git Hook Setup Script
 * 
 * This script configures Git to use the project's shared hooks directory.
 * It is idempotent and can be run multiple times safely.
 */

import { $ } from 'bun'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

async function main() {
  try {
    const repositoryRoot = await $`git rev-parse --show-toplevel`.text().then(t => t.trim())
    const hooksPath = resolve(repositoryRoot, '.githooks')
    
    // Check current hooks path
    const currentHooksPath = await $`git config core.hooksPath`.text().then(t => t.trim()).catch(() => '')
    
    if (currentHooksPath === hooksPath) {
      console.log(`Git hooks already configured: ${hooksPath}`)
      return
    }
    
    // Set the hooks path
    await $`git config core.hooksPath ${hooksPath}`
    console.log(`Git hooks configured: ${hooksPath}`)
    
    // Verify the hook exists and is executable
    const commitMsgHook = resolve(hooksPath, 'commit-msg')
    try {
      await $`test -x ${commitMsgHook}`.quiet()
      console.log('commit-msg hook is executable')
    } catch {
      console.warn(`Warning: commit-msg hook at ${commitMsgHook} is not executable`)
    }
    
    console.log('Hook setup complete. Run `bun install` to install commitlint dependencies.')
    
  } catch (error) {
    console.error('Failed to setup Git hooks:', error)
    process.exit(1)
  }
}

main()