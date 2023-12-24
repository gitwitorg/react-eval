# GitWit React Codegen Evaluation

## Get started:

The React evaluation sandbox uses a custom E2B sandbox, which needs to be built before it can be used. This requires E2B's Pro tier. Install the E2B CLI and authenticate:

```bash
npm install -g @e2b/cli@latest
e2b login
```

Add your E2B API key to .env:

```bash
echo 'E2B_API_KEY=e2b_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' > .env
```

Build the sandbox:

```bash
cd sandbox
e2b build --name "react-evals"
```