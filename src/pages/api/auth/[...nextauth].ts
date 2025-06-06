import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import InstagramProvider from "next-auth/providers/instagram";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
    InstagramProvider({
      clientId: process.env.IG_CLIENT_ID!,
      clientSecret: process.env.IG_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          provider: account?.provider || "oauth",
          providerId: account?.providerAccountId || "",
        },
        create: {
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          provider: account?.provider || "oauth",
          providerId: account?.providerAccountId || "",
        },
      });
      return true;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
        });
        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.verifiedAt = dbUser.verifiedAt;
        }
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.email) return;
      const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
      if (dbUser && !dbUser.verifiedAt) {
        // TODO: redirect to verification flow on frontend
      }
    },
  },
});
