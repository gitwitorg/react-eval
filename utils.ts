// https://stackoverflow.com/a/71239408/8784402

export const asyncMap = async <T, Q>(
  x: T[],
  threads: number,
  fn: (v: T, i: number, a: T[]) => Promise<Q>
) => {
  let k = 0;
  const result = Array(x.length) as Q[];
  await Promise.all(
    [...Array(threads)].map(async () => {
      while (k < x.length) result[k] = await fn(x[k], k++, x);
    })
  );
  return result;
};
