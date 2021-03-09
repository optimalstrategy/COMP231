/**
 * Removes old files.
 */

import fs from 'fs-extra';


try {
    fs.removeSync('./dist/');
} catch (err) {
    console.error(err);
}
