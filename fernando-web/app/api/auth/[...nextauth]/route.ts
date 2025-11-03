import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Simple authentication - works with existing credentials
        if (
          credentials?.email === 'peter@directskip.com' &&
          credentials?.password === 'fernando123'
        ) {
          return {
            id: 'peter',
            email: 'peter@directskip.com',
            name: 'Peter Faquart',
          }
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'fernando-dev-secret-change-in-production',
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
