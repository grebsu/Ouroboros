import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getUserByUsername } from "../../../../lib/users"; // Adjust path as needed

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) {
          return null;
        }

        const user = await getUserByUsername(credentials.username);

        if (user && bcrypt.compareSync(credentials.password, user.password)) {
          return { id: user.id, name: user.username, email: user.username }; // Return user object
        } else {
          return null; // Authentication failed
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", // Specify your custom login page
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };