import fs from "node:fs";
import path from "node:path";

export interface Engine {
    name: string,
    path: string
};

// given a dir (path to a folder), returns all of the immediate children files that are .exe
// returns a list of objects: { name, path }
export function getEngines(dir: string): Engine[] {
    const engines: Engine[] = [];
    fs.readdirSync(dir).forEach(fileName => {
        if (fileName.endsWith(".exe")){
            engines.push({
                name: fileName.substring(0, fileName.length - 4),
                path: path.join(dir, fileName)
            });
        }
    });
    return engines;
}
