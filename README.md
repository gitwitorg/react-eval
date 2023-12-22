# GitWit React Codegen Evaluation

## Get started:

If running macOS, specify the path to Chrome for Puppeteer:

```bash
echo 'CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"\n' >> .env
```

Run:

```bash
npm install
npm start
```

## Additional settings

- PORT (optional): The port to test React apps on.
- FIRESTORE_COLLECTION_NAME (optional): The collection to save results to.
- SCREENSHOT (optional): If set, saves a Base64 encoded screenshot for each project.