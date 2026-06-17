export function isGitHubAuthEnabled(): boolean {
  return Boolean(process.env.GITHUB_ID && process.env.GITHUB_SECRET);
}
