#!/usr/bin/env ts-node

import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

// Define types for the command line arguments and the sizes and paths
interface Arguments {
    source: string
}

interface SizeAndPath {
    size: number
    path: string
}

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
    .option('source', {
        alias: 's',
        description: 'Path to the source image',
        type: 'string',
        demandOption: true // Make --source a required argument
    })
    .argv as Arguments // Specify the arguments type

// Use the provided source file from --source argument
const sourceFile: string = argv.source

// Get the filename from the source file path
const sourceFileName = path.basename(sourceFile)

// Define the output sizes and paths
const sizesAndPaths: SizeAndPath[] = [
    { size: 192, path: './public/icons/icon-192.png' },
    { size: 512, path: './public/icons/icon-512.png' },
    { size: 1024, path: './public/icons/icon-1024.png' },
    { size: 180, path: './public/apple-touch-icon.png' }
]

// Function to load ES modules
async function loadModules() {
    const imagemin = (await import('imagemin')).default
    return { imagemin }
}

// Function to generate and optimize the icons
async function generateIcons() {
    try {
        // Check if the source file exists
        if (!fs.existsSync(sourceFile)) {
            throw new Error(`Source file not found: ${sourceFile}`)
        }

        // Generate resized images
        for (const item of sizesAndPaths) {
            const { size, path: outputPath } = item

            // Get the filename from the output path
            const outputFileName = path.basename(outputPath)

            // Skip resizing if the source and output filenames are the same
            if (outputFileName === sourceFileName) {
                console.log(`Skipping ${outputPath} since its fileName matches the source fileName.`)
                continue
            }

            console.log(`Generating ${outputPath}...`)
            await sharp(sourceFile)
                .resize(size, size)
                .toFile(outputPath)

            console.log(`${outputPath} generated successfully.`)
        }

        // Load imagemin and plugins dynamically
        const { imagemin } = await loadModules()

        // Optimize images
        for (const item of sizesAndPaths) {
            const { path: outputPath } = item
            const destination = outputPath.includes('apple-touch-icon') ? './public' : './public/icons'

            console.log(`Optimizing ${outputPath}...`)
            await imagemin([outputPath], {
                destination,
                plugins: []
            })

            console.log(`${outputPath} optimized successfully.`)
        }

        // Generate and save circle-cropped favicon.ico
        const faviconPath = './public/favicon.ico'
        const faviconSize = 48

        console.log(`Generating ${faviconPath}...`)
        const roundedCorners = Buffer.from(
            `<svg><circle cx="${faviconSize / 2}" cy="${faviconSize / 2}" r="${faviconSize / 2}"/></svg>`
        )

        await sharp(sourceFile)
            .resize(faviconSize, faviconSize)
            .composite([{ input: roundedCorners, blend: 'dest-in' }])
            .toFile(faviconPath)

        console.log(`${faviconPath} generated successfully.`)

        console.log('All images optimized successfully.')
    } catch (error: any) {
        console.error(`Error generating icons: ${error.message}`)
    }
}

// Run the script
generateIcons()