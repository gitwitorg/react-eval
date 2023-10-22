# GitWit React Codegen Evaluation

## Get started:

Configure the Firestore database: In a Firebase project, navigate to Project settings -> Service accounts, Generate new private key. Take the contents of this file, and remove all newlines to get the configuration string `{ "type": "service_account", ... }`.

Store the configuration string in .env:

```bash
echo 'FIRESTORE_CREDENTIALS={ "type": "service_account", ... }' > .env
```

Run:

```bash
npm install
npm start
```

## EC2 Setup

Create a new EC2 instance running Amazon Linux 2023.

Log into the instance.

Install dependencies:

```bash
sudo yum install npm git libXcomposite libXdamage libXrandr libgbm libxkbcommon pango alsa-lib atk at-spi2-atk cups-libs libdrm chromium
```

Connect to Git repository:

```bash
ssh-keygen
cat ~/.ssh/id_rsa.pub
```

Add to GitHub [SSH Keys](https://github.com/settings/keys).

Clone the repository:

```bash
git clone git@github.com:gitwitorg/gitwit-data-analyser
cd gitwit-data-analyser
```

Follow the get started settings above.

## Additional settings

- PORT (optional): The port to test React apps on.