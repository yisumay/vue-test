export const compose = (...fn) =>
  fn.reduce((acc, cur) => {
    return async (...args) => acc(await cur(...args));
  });
