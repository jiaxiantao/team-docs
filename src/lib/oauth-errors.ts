const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "该邮箱已使用密码注册，请使用邮箱密码登录，或联系管理员合并账号",
  AccessDenied: "授权被拒绝，请重试",
  Configuration: "OAuth 配置错误，请检查 GITHUB_ID / GITHUB_SECRET",
  Default: "第三方登录失败，请稍后重试",
};

export function oauthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return OAUTH_ERROR_MESSAGES[code] ?? OAUTH_ERROR_MESSAGES.Default;
}
