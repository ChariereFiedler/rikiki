export async function resolve(specifier, context, next) {
  if (specifier === 'rolldown') throw new Error("Cannot find package 'rolldown'");
  return next(specifier, context);
}
