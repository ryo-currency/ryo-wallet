// ./build_installer.js

// 1. Import Modules
const { MSICreator } = require('@zenul_abidin/electron-wix-msi');
const path = require('path');
const fsPromises = require('fs/promises');

// 2. Define input and output directory.
// Important: the directories must be absolute, not relative.
const APP_DIR = path.resolve(__dirname, './dist/electron-mat/Packaged/win-unpacked');
const OUT_DIR = path.resolve(__dirname, './dist/electron-mat/windows_installer');

// 3, Copy LICENSE file into app directory or else the build will abort.
async function copyLicenseFile() {
  try {
    await fsPromises.copyFile(path.resolve(__dirname, './LICENSE'), path.join(APP_DIR, './LICENSE'), 0)
  } catch (err) {
    process.stderr.write(`Could not copy LICENSE file to app directory (does it exist?): ${err}`)
    process.exit()
  }
}

copyLicenseFile()

// 4. Instantiate the MSICreator
const msiCreator = new MSICreator({
    appDirectory: APP_DIR,
    outputDirectory: OUT_DIR,

    // Configure metadata
    description: 'Ryo Wallet -  Privacy for eveRYOne',
    exe: 'Ryo Wallet Atom',
    name: 'Ryo Wallet Atom',
    manufacturer: 'Ryo Wallet Developers',
    version: '1.5.0',

    // Configure installer User Interface
    ui: {
        chooseDirectory: true,
        images: {
            background: path.resolve(__dirname, './build_assets/ryo-wallet-background.jpg'),
            banner: path.resolve(__dirname, './build_assets/ryo-wallet-banner.jpg'),
        }
    },
});

// 5. Create a .wxs template file
msiCreator.create().then(function(){

    // 6: Compile the template to a .msi file
    msiCreator.compile();
});

