import { readdir, lstat, mkdir, exists } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { Router } from '@stricjs/router';
import { dir, file } from '@stricjs/utils';

type FileAccumulatorType = { files: string[]; folders: string[] };
const publicDir = 'public';
const buildDir = 'build';

async function getFiles(directoryPath: string): Promise<string[]> {
    try {
        const fileNames: string[] = [];
        const folderNames: string[] = [''];

        while (folderNames.length > 0) {
            const currentDir = folderNames.pop() ?? '';
            const currentFileNames = await readdir(join(directoryPath, currentDir));
            const { files, folders } = await currentFileNames.reduce(
                async (accumulatorPromise, fileName) => {
                    const filePath = join(directoryPath, currentDir, fileName);
                    const fileStat = await lstat(filePath);
                    const accumulator = await accumulatorPromise;

                    if (fileStat.isDirectory()) {
                        accumulator.folders.push(fileName);
                    } else {
                        accumulator.files.push(fileName);
                    }
                    return accumulator;
                },
                Promise.resolve({ files: [], folders: [] } as FileAccumulatorType),
            );
            fileNames.push(...files.map((file) => join(currentDir, file)));
            folderNames.push(...folders.map((folder) => join(currentDir, folder)));
        }

        return fileNames;
    } catch (err) {
        console.error(err);
        return [];
    }
}

async function copyFromPublicToBuild() {
    const publicFiles = await getFiles(publicDir);
    publicFiles.forEach(async (fileName) => {
        const file = Bun.file(join(publicDir, fileName));
        const outputPath = join(buildDir, fileName);
        const dirName = dirname(outputPath);
        const dirExists = await exists(dirName);

        if (!dirExists) {
            try {
                await mkdir(dirName);
            } catch {}
        }

        await Bun.write(outputPath, file);
    });
}

await copyFromPublicToBuild();
await Bun.build({
    entrypoints: ['./src/client/index.ts'],
    outdir: buildDir,
});

export default new Router().get('/', file(`${buildDir}/index.html`)).get('/*', dir(buildDir));
