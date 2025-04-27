#!/usr/bin/env node
/**
 * Milestone Creation Script (Node.js)
 * Creates a new milestone directory and moves handoff files
 *
 * Usage:
 *   node create-milestone.js [milestone-name]
 */

const fs = require('node:fs')
const path = require('node:path')
const readline = require('node:readline')

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

/**
 * Creates a milestone directory and moves handoff files
 * @param {string} milestoneName - Name for the milestone
 */
async function createMilestone(milestoneName) {
  try {
    // Get the next milestone number
    const handoffsDir = 'handoffs'

    // Check if handoffs directory exists
    if (!fs.existsSync(handoffsDir)) {
      console.error(`Error: Directory '${handoffsDir}' not found`)
      process.exit(1)
    }

    // Find milestone directories
    const dirs = fs
      .readdirSync(handoffsDir)
      .filter((d) => fs.statSync(path.join(handoffsDir, d)).isDirectory() && /^\d+-/.test(d))

    // Determine next milestone number
    let nextNum = 1
    if (dirs.length > 0) {
      // Extract numbers from directory names and find the highest
      const maxNum = Math.max(...dirs.map((d) => Number.parseInt(d.match(/^(\d+)-/)[1]) || 0))
      nextNum = maxNum + 1
    }

    // If milestone name wasn't provided, prompt for it
    if (!milestoneName) {
      // biome-ignore lint/style/noParameterAssign: This is a prompt
      milestoneName = await new Promise((resolve) => {
        rl.question('Enter milestone name: ', (answer) => resolve(answer))
      })
    }

    // Create milestone directory
    const milestoneDir = path.join(handoffsDir, `${nextNum}-${milestoneName}`)
    fs.mkdirSync(milestoneDir, { recursive: true })
    console.log(`Created milestone directory: ${milestoneDir}`)

    // Find handoff files
    const handoffFiles = fs
      .readdirSync(handoffsDir)
      .filter((f) => /^[1-9].*\.md$/.test(f) && fs.statSync(path.join(handoffsDir, f)).isFile())

    // Move handoff files
    let movedCount = 0
    for (const file of handoffFiles) {
      const srcPath = path.join(handoffsDir, file)
      const destPath = path.join(milestoneDir, file)
      fs.renameSync(srcPath, destPath)
      movedCount++
    }

    console.log(`Moved ${movedCount} handoff files to milestone directory`)
    console.log(`Milestone ${nextNum}-${milestoneName} created successfully.`)
    console.log(
      `Don't forget to create 0-milestone-summary.md and 0-lessons-learned.md files in the milestone directory.`
    )

    rl.close()
  } catch (error) {
    console.error(`Error creating milestone: ${error.message}`)
    rl.close()
    process.exit(1)
  }
}

// Get milestone name from command line arguments
const milestoneName = process.argv[2]

// Call the function
createMilestone(milestoneName)
