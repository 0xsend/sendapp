#!/usr/bin/env node
/**
 * Combined Conversation Extraction Script
 *
 * This script attempts to run the conversation extraction tools in order:
 * 1. First tries the Python script
 * 2. If Python fails, falls back to the Node.js script
 *
 * The script takes care of determining the correct output path based on
 * the next handoff number and naming convention.
 *
 * Usage:
 *   node extract-conversation.js <conversation_export_file> [handoffs_dir]
 *
 * If no conversation file is specified, it will check the chat_history directory
 * for any conversation exports and process the first one found.
 *
 * If handoffs_dir is not specified, it defaults to 'handoffs'
 */

const fs = require('node:fs')
const path = require('node:path')
const { execSync, exec } = require('node:child_process')

// Define handoffsDir at module level with a default value
// This ensures it's accessible to all functions
let handoffsDir = path.join(process.cwd(), 'handoffs')

/**
 * Determines the next handoff number by examining existing handoff files
 * @param {string} handoffsDir - Path to the handoffs directory
 * @returns {number} - The next handoff number to use
 */
function determineNextHandoffNumber(handoffsDir) {
  try {
    // Get all MD files in the handoffs directory that start with a number
    const files = fs
      .readdirSync(handoffsDir)
      .filter(
        (file) =>
          file.endsWith('.md') &&
          /^[0-9]/.test(file) &&
          fs.statSync(path.join(handoffsDir, file)).isFile()
      )

    if (files.length === 0) {
      return 1 // Start with 1 if no existing files
    }

    // Extract numbers from filenames and find the highest
    const numbers = files.map((file) => {
      const match = file.match(/^(\d+)/)
      return match ? Number.parseInt(match[1], 10) : 0
    })

    return Math.max(...numbers) + 1
  } catch (err) {
    console.error(`Error finding next handoff number: ${err.message}`)
    return 1 // Default to 1 if any errors
  }
}

/**
 * Check if the system directories exist, create them if they don't
 * @param {string} handoffsDir - Path to the handoffs directory
 * @returns {object} - Object with paths to the system directories
 */
function ensureSystemDirs(handoffsDir) {
  const systemDir = path.join(handoffsDir, '0-system')
  const chatHistoryDir = path.join(systemDir, 'chat_history')
  const scriptsDir = path.join(systemDir, 'scripts')

  // Create system directory if it doesn't exist
  if (!fs.existsSync(systemDir)) {
    console.log(`Creating system directory: ${systemDir}`)
    fs.mkdirSync(systemDir, { recursive: true })
  }

  // Create chat_history directory if it doesn't exist
  if (!fs.existsSync(chatHistoryDir)) {
    console.log(`Creating chat_history directory: ${chatHistoryDir}`)
    fs.mkdirSync(chatHistoryDir, { recursive: true })
  }

  // Create scripts directory if it doesn't exist
  if (!fs.existsSync(scriptsDir)) {
    console.log(`Creating scripts directory: ${scriptsDir}`)
    fs.mkdirSync(scriptsDir, { recursive: true })
  }

  return {
    systemDir,
    chatHistoryDir,
    scriptsDir,
  }
}

/**
 * Find conversation files in the chat_history directory
 * @param {string} chatHistoryDir - Path to the chat_history directory
 * @returns {string[]} - Array of file paths
 */
function findConversationFiles(chatHistoryDir) {
  try {
    const files = fs
      .readdirSync(chatHistoryDir)
      .filter((file) => file.endsWith('.md') || file.endsWith('.txt') || file.endsWith('.json'))
      .map((file) => path.join(chatHistoryDir, file))

    return files
  } catch (err) {
    console.error(`Error finding conversation files: ${err.message}`)
    return []
  }
}

/**
 * Run the Python extraction script
 * @param {string} inputFile - Path to the conversation export file
 * @param {string} outputFile - Path where the cleaned conversation should be saved
 * @param {boolean} deleteOriginal - Whether to delete the original file after successful extraction
 * @returns {boolean} - True if successful, false otherwise
 */
function runPythonExtraction(inputFile, outputFile, deleteOriginal = false) {
  try {
    console.log('Attempting extraction using Python script...')

    // Construct the Python command
    // Update path to look in the system scripts directory if available
    let scriptPath
    const systemScriptsPath = path.join(
      handoffsDir,
      '0-system',
      'scripts',
      '1-extract_conversation.py'
    )

    if (fs.existsSync(systemScriptsPath)) {
      scriptPath = systemScriptsPath
      console.log(`Using script from system directory: ${scriptPath}`)
    } else {
      scriptPath = path.join(path.dirname(__dirname), '2-scripts', '1-extract_conversation.py')
      console.log(`Using script from source directory: ${scriptPath}`)
    }
    const command = `python "${scriptPath}" "${inputFile}" "${outputFile}"`

    // Execute the command
    execSync(command, { stdio: 'inherit' })

    // Verify the output file was created
    if (fs.existsSync(outputFile)) {
      console.log(`✅ Python extraction successful: ${outputFile}`)

      // Delete original file if requested
      if (deleteOriginal) {
        try {
          fs.unlinkSync(inputFile)
          console.log(`✅ Deleted original file: ${inputFile}`)
        } catch (deleteErr) {
          console.warn(`⚠️ Warning: Could not delete original file: ${deleteErr.message}`)
        }
      }

      return true
    }
    console.log('❌ Python extraction completed but output file not found')
    return false
  } catch (err) {
    console.log(`❌ Python extraction failed: ${err.message}`)
    return false
  }
}

/**
 * Run the Node.js extraction script
 * @param {string} inputFile - Path to the conversation export file
 * @param {string} outputFile - Path where the cleaned conversation should be saved
 * @param {boolean} deleteOriginal - Whether to delete the original file after successful extraction
 * @returns {boolean} - True if successful, false otherwise
 */
function runNodeExtraction(inputFile, outputFile, deleteOriginal = false) {
  try {
    console.log('Attempting extraction using Node.js script...')

    // Use this file itself for extraction
    // We'll implement a direct extraction method instead of calling another script
    // First, check if we have an extraction function in this file
    if (typeof extractConversationDirect === 'function') {
      console.log('Using direct extraction method...')
      const result = extractConversationDirect(inputFile, outputFile)

      if (result) {
        console.log(`✅ Direct extraction successful: ${outputFile}`)

        // Delete original file if requested
        if (deleteOriginal) {
          try {
            fs.unlinkSync(inputFile)
            console.log(`✅ Deleted original file: ${inputFile}`)
          } catch (deleteErr) {
            console.warn(`⚠️ Warning: Could not delete original file: ${deleteErr.message}`)
          }
        }

        return true
      }
      console.log('❌ Direct extraction failed')
      return false
    }

    // Fall back to external script if direct extraction is not available
    // Update path to look in the system scripts directory if available
    let scriptPath
    const systemScriptsPath = path.join(
      handoffsDir,
      '0-system',
      'scripts',
      '1-extract-conversation.js'
    )

    if (fs.existsSync(systemScriptsPath)) {
      scriptPath = systemScriptsPath
      console.log(`Using script from system directory: ${scriptPath}`)
    } else {
      scriptPath = path.join(path.dirname(__dirname), '2-scripts', '1-extract-conversation.js')
      console.log(`Using script from source directory: ${scriptPath}`)
    }
    const command = `node "${scriptPath}" "${inputFile}" "${outputFile}"`

    // Execute the command
    execSync(command, { stdio: 'inherit' })

    // Verify the output file was created
    if (fs.existsSync(outputFile)) {
      console.log(`✅ Node.js extraction successful: ${outputFile}`)

      // Delete original file if requested
      if (deleteOriginal) {
        try {
          fs.unlinkSync(inputFile)
          console.log(`✅ Deleted original file: ${inputFile}`)
        } catch (deleteErr) {
          console.warn(`⚠️ Warning: Could not delete original file: ${deleteErr.message}`)
        }
      }

      return true
    }
    console.log('❌ Node.js extraction completed but output file not found')
    return false
  } catch (err) {
    console.log(`❌ Node.js extraction failed: ${err.message}`)
    return false
  }
}

/**
 * Main function to run the extraction process
 */
function main() {
  // Parse command line arguments
  const args = process.argv.slice(2)
  let inputFile = null

  // Parse arguments and update the global handoffsDir
  if (args.length >= 1) {
    // First argument could be either input file or handoffs directory
    if (args[0].endsWith('.md') || args[0].endsWith('.txt') || args[0].endsWith('.json')) {
      inputFile = args[0]
      if (args.length >= 2) {
        handoffsDir = args[1]
      }
    } else {
      handoffsDir = args[0]
    }
  }

  try {
    // Ensure handoffs directory exists
    if (!fs.existsSync(handoffsDir)) {
      console.log(`Creating handoffs directory: ${handoffsDir}`)
      fs.mkdirSync(handoffsDir, { recursive: true })
    }
  } catch (err) {
    console.error(`Error with handoffs directory: ${err.message}`)
    console.log('Falling back to current directory + /handoffs')
    handoffsDir = path.join(process.cwd(), 'handoffs')
    fs.mkdirSync(handoffsDir, { recursive: true })
  }

  // Ensure system directories exist
  const { systemDir, chatHistoryDir, scriptsDir } = ensureSystemDirs(handoffsDir)

  // If no input file specified, look in chat_history directory
  if (!inputFile) {
    const conversationFiles = findConversationFiles(chatHistoryDir)

    if (conversationFiles.length === 0) {
      console.log(`
No conversation files found in ${chatHistoryDir}

Usage: node extract-conversation.js <conversation_export_file> [handoffs_dir]

Arguments:
  conversation_export_file  Path to the exported conversation file
  handoffs_dir              (Optional) Path to the handoffs directory (default: "handoffs")

Please place your conversation export files in the chat_history directory or provide a direct path.
      `)
      process.exit(1)
    }

    // Use the first file found
    inputFile = conversationFiles[0]
    console.log(`Found conversation file: ${inputFile}`)
  }

  // Ensure input file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`)
    process.exit(1)
  }

  // Check file size - warn if over 1MB
  const fileStats = fs.statSync(inputFile)
  const fileSizeMB = fileStats.size / (1024 * 1024)
  let sizeBadge = '🟢'

  if (fileSizeMB > 5) {
    sizeBadge = '🔴'
    console.warn(
      `\n⚠️ WARNING: File is very large (${fileSizeMB.toFixed(2)} MB). This may take some time to process.`
    )
  } else if (fileSizeMB > 1) {
    sizeBadge = '🟠'
    console.warn(`\n⚠️ Notice: File is moderately large (${fileSizeMB.toFixed(2)} MB).`)
  }

  // Determine if this is a file from chat_history
  const isFromChatHistory = inputFile.includes(path.join(handoffsDir, '0-system', 'chat_history'))

  // Determine the next handoff number
  const nextNum = determineNextHandoffNumber(handoffsDir)

  // Construct the output filename
  const outputFile = path.join(handoffsDir, `${nextNum}-chat_transcript.md`)

  console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║        Conversation Extraction Process           ║
║                                                  ║
╚══════════════════════════════════════════════════╝

Input file: ${inputFile} ${sizeBadge}
Output file: ${outputFile}
Next handoff number: ${nextNum}
Auto-cleanup: ${isFromChatHistory ? 'Yes (will delete original after success)' : 'No'}
`)

  // First try Python extraction
  const pythonSuccess = runPythonExtraction(inputFile, outputFile, isFromChatHistory)

  // If Python fails, try Node.js extraction
  if (!pythonSuccess) {
    console.log('\nPython extraction failed, trying Node.js...\n')
    const nodeSuccess = runNodeExtraction(inputFile, outputFile, isFromChatHistory)

    if (!nodeSuccess) {
      console.error(
        '\n❌ Both extraction methods failed. Please check the input file and try again.'
      )
      process.exit(1)
    }
  }

  console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║           Extraction Complete                    ║
║                                                  ║
╚══════════════════════════════════════════════════╝

The conversation has been extracted and saved to:
${outputFile}

This file can now be used by the handoff-manager to create a
handoff document with conversation insights.

Next steps:
1. Create a handoff document incorporating the extracted conversation:
   "I need to create a handoff document incorporating insights from our conversation."

2. The handoff-manager will automatically analyze the extracted file
   and incorporate relevant insights into the handoff document.
`)
}

// Run the script
main()
