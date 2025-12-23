#!/usr/bin/env node

/**
 * MP4 faststart Checker and Fixer
 * 
 * Checks if MP4 files have the moov atom at the beginning (faststart)
 * for instant web playback. Can optionally fix files using ffmpeg.
 * 
 * Usage:
 *   node check-faststart.js <file-or-directory> [--fix]
 * 
 * Examples:
 *   node check-faststart.js video.mp4
 *   node check-faststart.js ./videos --fix
 */

const fs = require('fs')
const path = require('path')
const { execSync, spawn } = require('child_process')

// MP4 atom types we care about
const MOOV_ATOM = Buffer.from('moov')
const MDAT_ATOM = Buffer.from('mdat')
const FTYP_ATOM = Buffer.from('ftyp')

/**
 * Read the atom structure of an MP4 file
 * Returns an array of { type, offset, size }
 */
function readAtoms(filePath) {
    const fd = fs.openSync(filePath, 'r')
    const fileSize = fs.statSync(filePath).size
    const atoms = []
    let offset = 0

    try {
        while (offset < fileSize) {
            const header = Buffer.alloc(8)
            const bytesRead = fs.readSync(fd, header, 0, 8, offset)

            if (bytesRead < 8) break

            let size = header.readUInt32BE(0)
            const type = header.slice(4, 8).toString('latin1')

            // Handle extended size (size = 1 means 64-bit size follows)
            if (size === 1) {
                const extHeader = Buffer.alloc(8)
                fs.readSync(fd, extHeader, 0, 8, offset + 8)
                size = Number(extHeader.readBigUInt64BE(0))
            }

            // Handle size = 0 (atom extends to end of file)
            if (size === 0) {
                size = fileSize - offset
            }

            atoms.push({ type, offset, size })

            // Skip to next atom
            offset += size

            // Safety: prevent infinite loop
            if (size === 0) break
        }
    } finally {
        fs.closeSync(fd)
    }

    return atoms
}

/**
 * Check if an MP4 has faststart (moov before mdat)
 */
function checkFaststart(filePath) {
    const atoms = readAtoms(filePath)

    let moovOffset = -1
    let mdatOffset = -1

    for (const atom of atoms) {
        if (atom.type === 'moov' && moovOffset === -1) {
            moovOffset = atom.offset
        }
        if (atom.type === 'mdat' && mdatOffset === -1) {
            mdatOffset = atom.offset
        }
    }

    const hasMoov = moovOffset !== -1
    const hasMdat = mdatOffset !== -1
    const isFaststart = hasMoov && hasMdat && moovOffset < mdatOffset

    return {
        filePath,
        atoms: atoms.map(a => `${a.type}@${a.offset}`).join(', '),
        moovOffset,
        mdatOffset,
        hasFaststart: isFaststart,
        needsFix: hasMoov && hasMdat && !isFaststart
    }
}

/**
 * Fix an MP4 to have faststart using ffmpeg
 */
function fixFaststart(filePath) {
    const ext = path.extname(filePath)
    const basename = path.basename(filePath, ext)
    const dirname = path.dirname(filePath)
    const tempPath = path.join(dirname, `${basename}_faststart${ext}`)

    console.log(`  Fixing: ${filePath}`)
    console.log(`  Output: ${tempPath}`)

    try {
        // Run ffmpeg to remux with faststart
        execSync(`ffmpeg -i "${filePath}" -c copy -movflags +faststart "${tempPath}" -y`, {
            stdio: 'pipe'
        })

        // Verify the fix worked
        const result = checkFaststart(tempPath)
        if (result.hasFaststart) {
            // Replace original with fixed version
            fs.unlinkSync(filePath)
            fs.renameSync(tempPath, filePath)
            console.log(`  ✅ Fixed successfully!`)
            return true
        } else {
            fs.unlinkSync(tempPath)
            console.log(`  ❌ Fix failed - moov still after mdat`)
            return false
        }
    } catch (err) {
        console.log(`  ❌ Error: ${err.message}`)
        // Cleanup temp file if it exists
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath)
        }
        return false
    }
}

/**
 * Check if ffmpeg is available
 */
function checkFfmpeg() {
    try {
        execSync('ffmpeg -version', { stdio: 'pipe' })
        return true
    } catch {
        return false
    }
}

/**
 * Get all MP4 files in a directory recursively
 */
function getMp4Files(dirPath, files = []) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)

        if (entry.isDirectory()) {
            getMp4Files(fullPath, files)
        } else if (entry.isFile() && /\.mp4$/i.test(entry.name)) {
            files.push(fullPath)
        }
    }

    return files
}

// Main execution
function main() {
    const args = process.argv.slice(2)

    if (args.length === 0) {
        console.log(`
MP4 faststart Checker
=====================

Usage: node check-faststart.js <file-or-directory> [--fix]

Options:
  --fix    Automatically fix files that need faststart (requires ffmpeg)

Examples:
  node check-faststart.js video.mp4
  node check-faststart.js ./videos
  node check-faststart.js ./videos --fix
`)
        process.exit(0)
    }

    const target = args[0]
    const shouldFix = args.includes('--fix')

    if (!fs.existsSync(target)) {
        console.error(`Error: "${target}" does not exist`)
        process.exit(1)
    }

    // Check for ffmpeg if fixing is requested
    if (shouldFix && !checkFfmpeg()) {
        console.error(`Error: ffmpeg is required for the --fix option but was not found.`)
        console.error(`Please install ffmpeg: https://ffmpeg.org/download.html`)
        process.exit(1)
    }

    // Get list of files to check
    const stat = fs.statSync(target)
    const files = stat.isDirectory() ? getMp4Files(target) : [target]

    if (files.length === 0) {
        console.log('No MP4 files found.')
        process.exit(0)
    }

    console.log(`\nChecking ${files.length} MP4 file(s)...\n`)

    let fastStartCount = 0
    let needsFixCount = 0
    let fixedCount = 0

    for (const file of files) {
        const result = checkFaststart(file)

        if (result.hasFaststart) {
            console.log(`✅ ${path.basename(file)} - faststart OK`)
            fastStartCount++
        } else if (result.needsFix) {
            console.log(`⚠️  ${path.basename(file)} - needs faststart`)
            console.log(`   moov@${result.moovOffset}, mdat@${result.mdatOffset}`)
            needsFixCount++

            if (shouldFix) {
                if (fixFaststart(file)) {
                    fixedCount++
                }
            }
        } else {
            console.log(`❓ ${path.basename(file)} - unusual structure: ${result.atoms}`)
        }
    }

    console.log(`\n${'='.repeat(50)}`)
    console.log(`Summary:`)
    console.log(`  Total files:     ${files.length}`)
    console.log(`  faststart OK:    ${fastStartCount}`)
    console.log(`  Needs fix:       ${needsFixCount}`)
    if (shouldFix) {
        console.log(`  Fixed:           ${fixedCount}`)
    }

    if (needsFixCount > 0 && !shouldFix) {
        console.log(`\nTip: Run with --fix to automatically fix these files`)
    }
}

main()
