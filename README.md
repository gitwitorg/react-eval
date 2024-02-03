# React Codegen Evaluation

## What is this for?

This is a framework for measuring the effectiveness of LLMs and/or AI agents on generating ReactJS code.

The main features are:
- Batch code generation using OpenAI
- Batch ReactJS compilation and end-to-end testing using cloud sandboxes
- Quick visualization of evaluation results

You're welcome to use this framework with your own code generation tool. By default it works with [GitWit core](https://github.com/gitwitorg/gitwit-server).

<img src="https://github.com/gitwitorg/react-eval/assets/33395784/63e918f4-034a-4b64-9d7b-1daa750eff2a" width="700" />

## Getting started

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

Once these steps are finished, you can go on to the instructions below.

## Usage

**1. Create an evaluation set**

Your evaluation sets go in the `evals` directory. (These are lists of prompts that you want to test against.) These are simple JSON files.

**2. Configure the number of generations per prompt**

Edit config.json to adjust the number of times you want to generate code for each prompt. This is three by default. For a thorough evaluation, 10 times is recommended.

**3. Run batch generations**

Run `yarn generate EVALNAME`, to generate N code generations for each prompt in `evals/EVALNAME.json`. You will see a confirmation prompt before hitting return.

A new folder will be created and automatically named `runs/RUN` where `RUN` is an unused number. (You can rename this to describe your test.) The generation results will appear here.

**4. Run batch evaluations**

Run `yarn evaluate RUN`, to evaluate each generation in the sandbox. Evaluation results will appear in the same folder.

**5. View evaluations**

Run `yarn view RUN`, to see the results in a visual format. You don't have to wait until the evaluation results are finished to do this, but you do have to run the command again to see the updated results.

**6. Integrate with your own code generation tool**

Modify `generate.ts` to make this same process work with your own React generation code.
