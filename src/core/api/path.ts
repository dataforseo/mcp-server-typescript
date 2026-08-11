function applyAiSuffixToPathname(pathname: string): string {
  const withoutTrailingSlash = pathname.replace(/\/$/, "");
  if (withoutTrailingSlash.endsWith(".ai")) {
    return pathname;
  }
  return `${withoutTrailingSlash}.ai`;
}

export function applyAiModePath(path: string, aiMode: boolean): string {
  if (!aiMode) {
    return path;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    const url = new URL(path);
    url.pathname = applyAiSuffixToPathname(url.pathname);
    return url.toString();
  }

  return applyAiSuffixToPathname(path);
}
