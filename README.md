# ReactEval: ReactJS Codegen Evaluation Framework

Video walkthrough:

<a href="https://www.youtube.com/watch?v=tMVqY0igi6Q" target="_blank">
  <img src="https://github.com/gitwitorg/react-eval/assets/33395784/e712d7df-2fb5-469f-bed0-c505026bd8bf" width="400" alt="ReactEval: Evaluating LLM-generated code for ReactJS web apps">
</a>

## Table of Contents

- [What is this for?](#what-is-this-for)
- [Installation](#installation)
- [Usage](#usage)
  - [Important files](#important-files)
  - [Workflow](#workflow)
- [Custom evaluations](#custom-evaluations)

## What is this for?

This is a framework for **measuring the effectiveness of AI agents in generating ReactJS code**.

It was created to evaluate [GitWit](https://github.com/gitwitorg/gitwit-server), but it's easy to use this framework with your own code generation tool/agent.

You can do experiments like:
- Which tasks does my agent excel at?
- What issues does the code outputted by my agent have?
- How does changing the LLMs change the performance of my agent?

In short, you can batch run a list of prompts on your agent, then run the resulting code in a ReactJS sandbox, storing all errors and screenshots for later analysis.

<img src="https://github.com/gitwitorg/react-eval/assets/33395784/8790e161-ef51-4e3e-8fee-c523d40b9688" align="center" width="700" />

## Installation

To clone the repository and install dependencies, run:

```bash
git clone https://github.com/gitwitorg/react-eval/
cd react-eval
yarn install
```

The React evaluation sandbox uses a custom [E2B](https://e2b.dev/) sandbox. To access E2B, install the E2B CLI tool and authenticate:

```bash
yarn global add @e2b/cli@latest
e2b auth login
```

Now, you need an [OpenAI API key](https://platform.openai.com/api-keys) (or [Azure API key](https://oai.azure.com/portal)) and an [E2B API key](https://e2b.dev/docs/getting-started/api-key).

Finally, copy .env.example or create a .env file with the following:

```txt
E2B_API_KEY=e2b_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Once these steps are finished, you can go on to the instructions below.

## Usage

### Important files

The inputs and outputs of evaluations are structured like this:

| Component                  | Location                                         |
|----------------------------|--------------------------------------------------|
| Evaluation Tasks           | `/evals/[eval].json`                             |
| Generated Code             | `/runs/[run]/generations.json`                   |
| Evaluation Results         | `/runs/[run]/evaluations.json`                   |
| Logs, Screenshots          | `/runs/[run]/logs`, `/runs/[run]/screenshots`    |

### Workflow

A typical workflow is 1) generate 2) evaluate 3) view. For example:

```bash
yarn generate react
yarn evaluate 1
yarn view 1
```

These steps will be explained below:

**Generate**

The command `yarn generate [eval-name]`, runs the agent M x N times. M is the number of prompts in [eval-name], and N is a number you can configure in `config.json`.

The results are stored in JSON format in a director such as `/runs/1/`. (If 1 is taken, 2 will be used, etc.)

**Evaluate**

Run `yarn evaluate [run-name]`, to evaluate each code generation. Evaluation results will appear in the same folder as the generations.

**View**

Run `yarn view [run-name]`, to see the results in HTML format. You don't have to wait until the evaluation results are finished to do this, just run the command again to update the generated HTML.

## Custom evaluations

### Using your own code generation agent

To integrate React Eval to your own code generation tool, see where the `generateCode` function is called in [generate.ts](https://github.com/gitwitorg/react-eval/blob/main/generate.ts#L70). Currently this function is used to apply one prompt to one file, and replace the entire file with the reuslts.

### Modifying GitWit Server

React Eval is configured to generate code with GitWit server by default. To modify the server code, first fork and clone [gitwit-server](https://github.com/gitwitorg/gitwit-server) to your computer. In the `gitwit-server` directory, run `yarn link`. Then, in the `react-eval` directory run `yarn install gitwit-server`.

### Modifying the sandbox template

If you make any changes inside the sandbox directory, you need to create a new E2B sandbox as follows. This requires Docker to be installed and running.

```bash
cd sandbox
e2b template build --name "your-sandbox-name"
```

Then, change react-evals in evaluate.ts to your new sandbox name.
