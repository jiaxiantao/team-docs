import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { compare } from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { isGitHubAuthEnabled } from "@/lib/github-auth";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

const nodeAuthConfig = {
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user?.passwordHash) return null;

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
        };
      },
    }),
    ...(isGitHubAuthEnabled()
      ? [
          GitHub({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "github") {
        if (!user.email) return false;

        const existing = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, passwordHash: true },
        });

        if (existing?.passwordHash) {
          return "/login?error=OAuthAccountNotLinked";
        }

        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          create: {
            email: user.email,
            name: user.name ?? user.email,
            image: user.image ?? null,
          },
          update: {
            name: user.name ?? undefined,
            image: user.image ?? undefined,
          },
        });

        user.id = dbUser.id;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(nodeAuthConfig);
