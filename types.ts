export type EvalItem = {
  prompt: string;
};

export type GenerationResult = EvalItem & {
  id: string;
  created: string;
  appDotJS: string;
  packageDotJSON: string;
};