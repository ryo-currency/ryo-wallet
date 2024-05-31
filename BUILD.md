![Ryo Wallet](https://ryo-currency.com/img/ryo-wallet-screenshots/ryo-wallet.png)

Next Generation GUI Wallet for Ryo-currency

---

[DESCRIPTION](/README.md) - BUILD - [LICENSE](/LICENSE)

---



## Building on Ubuntu
> Tested on: Ubuntu 18.04.6 LTS + 22.04

1. Check whether you have git installed: `git --version` if no version is output, install it: `sudo apt install git`

2. Check whether you have git installed: `curl -v` if no version is output, install it: `sudo apt install curl`

3. Run: `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash`
then execute: `source ~/.profile` (no output or result will be provided)

4. Check whether you have nvm installed: `nvm ls` (if not: will show zero node distros installed)
`nvm ls-remote` (will list all remote available node distros for install, it is a long list!)
`nvm install lts/erbium` (or same as: `nvm install v12.22.12`).
Doublecheck successful installation with `nvm list` (will show that we installed it and are switched to it).
Now node is installed and appears in the list (other versions are not installed, so shown in red. we can install multiple node versions and switch between them)
![Ubuntu_4](https://user-images.githubusercontent.com/42204984/174149661-0932e56c-96c3-4a90-843a-96a3dfde4d5f.png)


5. Run: `npm install -g @quasar/cli` (will output that "added XYZ packages from XYZ contributors")
`quasar -v` (will output that installed version is 1.3.2)
6. Run: `git config --global url.https://github.com/.insteadOf git://github.com/` (no output will be provided)

7. Install build tools: `sudo apt-get install build-essential`
![Ubuntu_7](https://user-images.githubusercontent.com/42204984/174149865-64c34c4e-f927-4b81-a78f-a8f22500873b.png)

8. `cd ~ && git clone https://github.com/ryo-currency/ryo-wallet`
("cd ~" is added just in case you are in some other folder than ~, to be sure that you install it there)
(after cloning git will output: "Resolving deltas: 100% (XYZ/XYZ), done."

9. `cd ryo-wallet`

10. Download and extract linux binaries: **ryo-wallet-rpc** and **ryod** to `/ryo-wallet/bin` folder from [Ryo Github](https://github.com/ryo-currency/ryo-currency/releases) (other files in linux package like ryo-wallet-cli are **not** needed)

11. `npm install` (we will see that node_modules folder appeared in /ryo-wallet folder)
installed all required node components ("1733 packages from 1034 contributors" message)
![Ubuntu_11](https://user-images.githubusercontent.com/42204984/174149892-ca0a9b98-8e9d-4894-9a13-19878af3e43d.png)

12. `npm run build`
after some time (depenting on your CPU speed) you see successful build message
![Ubuntu_12](https://user-images.githubusercontent.com/42204984/174149964-25ba70b5-a381-43f3-8691-0f517b154622.png)

13. run to check: /ryo-wallet/dist/electron-mat/packaged/linux-unpacked/ryo-wallet-atom
![Ubuntu_13](https://user-images.githubusercontent.com/42204984/174149979-a8640aa1-61ad-435f-b9ef-9ae6d15777cb.png)


### Troubleshooting and tips:


- **Something went wrong, I need to clean temporary files.**

  - If something went wrong during your build step (#12) delete folder "build" in /ryo-wallet if you added or edited versions of packages in package.json file you need to have folder "node_modules" deleted in /ryo-wallet folder and execute step #11 again.


- **command 'build' is not recognised**

  - make sure you run `npm run build` not `npm build`


- **There are a lot of "warn" messages during build (#12)and node modules install (#11)**

  - That's normal. Some modules get updated, some are deprecated, unless you have "error" type message appearing- the process is going normal.



- **ERR! Unexpected end of JSON input while parsing near '… - -\r\nVersion: OpenP'** (on #12 npm-build step)

  - Try: `npm cache clean - force` and then repeat #12 step again



> Note1: If you have issues during build - please visit our [forum](https://www.reddit.com/r/ryocurrency) for support

> Note2: Video Format of the guide above is [available on our Youtube channel](https://youtu.be/tUoLFWttrv0)

---

## Building on Windows

> Run PowerShell as admin (press "win" button and type "powershell" in search and right click the icon and choose "run as admin")

> In PowerShell you can press tab in path to fill suggested matching word
> Disable uac (google link)is recommended otherwise you will be prompted on every required prerequisite app setup questions

>HDD Space/Internet traffic requirement for packages and the wallet build: ~11-12gb
>CPU/RAM requirement: 4 core+/4Gb+

1. Install git: [git-scm.com/downloads](https://git-scm.com/downloads)

2. Install python: [www.python.org/downloads/release/python-278](https://www.python.org/downloads/release/python-278/)

3. Install nvm: [github.com/coreybutler/nvm-windows/releases](https://github.com/coreybutler/nvm-windows/releases)

4. Install build tools using gui installer from the [Microsoft website](https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=Community&rel=16):
select "building desktop apps with C++" there in the payloads list. Make sure you have added "**v140** build tools" set to install.

5. PowerShell.
Run: `nvm install v12.22.12`
after it being installed run: `nvm use 12.22.12` (it will output "now using nvm 12.22.12")

6. PowerShell.
Install Quasar-cli: `npm install -g quasar-cli`

7. Reboot

8. PowerShell.
Run `git config --global url.https://github.com/.insteadOf git://github.com/` (no output will be provided)
then `cd C:\Users\your_username\Desktop\` (type instead of `your_username` - your windows username in path)
then `git clone https://github.com/ryo-currency/ryo-wallet.git`
then `cd ryo-wallet`
Download **Windows** binaries from [Ryo Github](https://github.com/ryo-currency/ryo-currency/releases) page and extract `ryod.exe` and `ryo-wallet-rpc.exe` files to `\bin` folder of Atom folder in the following path: `C:\Users\your_username\Desktop\ryo-wallet\bin`.

9. Run: `npm install`
(notice that folder "node_modules" gets created inside of the Atom Wallet folder)
![Windows_9](https://user-images.githubusercontent.com/42204984/174351866-55122b2a-4dec-43f3-ba1b-62207bf4014d.png)

10. Run: `npm run build`
(notice that "dist" folder gets created inside of Atom Wallet folder)
![Windows_10](https://user-images.githubusercontent.com/42204984/174350846-1d0f37ad-cd8e-4872-8e81-0803307cce3a.png)

11. Run wallet binaries .exe in path `C:\Users\user_name\Desktop\ryo-wallet\dist\electron-mat\Packaged\win-unpacked` and test it.



### Troubleshooting and tips:

1. Run this command `npm config set msvs_version "C:\Program Files (x86)\Microsoft Visual Studio\2019\Community"` in PowerShell if you get this error during "npm install" (#9) step:
```gyp ERR! find VS msvs_version was set from command line or npm config
gyp ERR! find VS - looking for Visual Studio installed in "C:\Program Files (x86)\Microsoft Visual Studio\2019\Enterprise"
gyp ERR! find VS VCINSTALLDIR not set, not running in VS Command Prompt
gyp ERR! find VS checking VS2019 (16.11.32510.428) found at:
gyp ERR! find VS "C:\Program Files (x86)\Microsoft Visual Studio\2019\Community"
gyp ERR! find VS - found "Visual Studio C++ core features"
gyp ERR! find VS - found VC++ toolset: v142
gyp ERR! find VS - found Windows SDK: 10.0.19041.0
gyp ERR! find VS - msvs_version does not point to this installation
gyp ERR! find VS could not find a version of Visual Studio 2017 or newer to use
gyp ERR! find VS looking for Visual Studio 2015
gyp ERR! find VS - found in "C:\Program Files (x86)\Microsoft Visual Studio 14.0"
gyp ERR! find VS - could not find MSBuild in registry for this version
gyp ERR! find VS not looking for VS2013 as it is only supported up to Node.js 8
gyp ERR! find VS
gyp ERR! find VS valid versions for msvs_version:
gyp ERR! find VS - "2019"
gyp ERR! find VS - "C:\Program Files (x86)\Microsoft Visual Studio\2019\Community"
gyp ERR! find VS
gyp ERR! find VS **************************************************************
gyp ERR! find VS You need to install the latest version of Visual Studio
gyp ERR! find VS including the "Desktop development with C++" workload.
gyp ERR! find VS For more information consult the documentation at:
gyp ERR! find VS https://github.com/nodejs/node-gyp#on-windows
gyp ERR! find VS **************************************************************
gyp ERR! find VS
gyp ERR! configure error
gyp ERR! stack Error: Could not find any Visual Studio installation to use
```