![Ryo Wallet](https://ryo-currency.com/img/ryo-wallet-screenshots/ryo-wallet.png)

Next Generation GUI Wallet for Ryo-currency

---

Meet Atom, the new Electron based Ryo Wallet. Being the foundation for further development, this initial release already brings several improvements over previous GUI wallet.

- Wallet switch option.
You can keep several Ryo wallets on one PC, and switch between them easily - just pick your Ryo wallet from the list and enter your password.

- Wallet naming and identifying
Easily identify your wallets - you can give names to them, and each wallet has its own unique identicon image.

- Mixed sync. logic
We took best from both ways of sync: remote (speed) and local (reliability). At wallet startup, you connect to remote node granting quicker operation state. At the same time, you download blockchain files on your hard drive. It will add more reliability to wallet operation. If remote connection fails, you will have local node running. You can also choose to run as normal full node or lite option.

- Power user settings
You can rely on predefined optimum settings, or you can edit settings (list will be expanded):
  - Sync. switch (mixed/local/remote)
  - Lmdb storage path
  - Various ports (daemon, p2p, ryod, remote etc)
  - Remote node URL
  - Bandwidth utilization (upload/download speed)

- Improved address book
Adding recipients into your address book will let you keep track of who you have sent funds to - you can add recipients of your payments beforehand, or after transactions. Seamless Ryo address validation of fields is built into the address book.

- Lazy load tx history tab
Scroll down and check your transactions list without pagination

- Interface updates
Resizable window with various UX improvements over previous version

- Increased stability and response time
Known issue with stuck processes after closing GUI wallet is now a past history. Overall increased speed and reduced response time of wallet's interface.

- Non latin seed restore
Restore your wallet with non-latin characters (Russian, German, Chinese and other languages)

- Import wallet from old GUI
Ryo wallet will scan default folders used by Lite wallet and GUI wallet and will give ability to restore from key files.

---

![Ryo Wallet Screenshot](https://ryo-currency.com/img/ryo-wallet-screenshots/01-initialize.png)
![Ryo Wallet Screenshot](https://ryo-currency.com/img/ryo-wallet-screenshots/02_wallet-select-1-light.png)
![Ryo Wallet Screenshot](https://ryo-currency.com/img/ryo-wallet-screenshots/03_wallet-select-2-light.png)
![Ryo Wallet Screenshot](https://ryo-currency.com/img/ryo-wallet-screenshots/04_wallet-main-light.png)
![Ryo Wallet Screenshot](https://ryo-currency.com/img/ryo-wallet-screenshots/05_wallet-receive-1-light.png)
![Ryo Wallet Screenshot](https://ryo-currency.com/img/ryo-wallet-screenshots/06_wallet-receive-2-light.png)
![Ryo Wallet Screenshot](https://ryo-currency.com/img/ryo-wallet-screenshots/07_wallet-send-light.png)
![Ryo Wallet Screenshot](https://ryo-currency.com/img/ryo-wallet-screenshots/08_wallet-address-book-1-light.png)
![Ryo Wallet Screenshot](https://ryo-currency.com/img/ryo-wallet-screenshots/09_wallet-address-book-2.png)
![Ryo Wallet Screenshot](https://ryo-currency.com/img/ryo-wallet-screenshots/10_wallet-address-book-3-light.png)
![Ryo Wallet Screenshot](https://ryo-currency.com/img/ryo-wallet-screenshots/11_tx-history-light.png)
![Ryo Wallet Screenshot](https://ryo-currency.com/img/ryo-wallet-screenshots/12_switch-wallet-light.png)

---

### Building from source

```
npm install -g quasar-cli
git clone https://github.com/ryo-currency/ryo-wallet
cd ryo-wallet
cp /path/to/ryo/binaries/ryod bin/
cp /path/to/ryo/binaries/ryo-wallet-rpc bin/
npm install
quasar build -m electron -t mat
```
