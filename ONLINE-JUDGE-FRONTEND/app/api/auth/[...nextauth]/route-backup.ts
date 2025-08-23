import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await response.json();

          if (data.success && data.data.user) {
            return {
              id: data.data.user.id || data.data.user._id,
              email: data.data.user.email,
              name: data.data.user.name,
              username: data.data.user.username,
              image: data.data.user.avatar,
              role: data.data.user.role || 'user',
              token: data.data.token,
            };
          }
          return null;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        token.accessToken = account.access_token;
        token.username = (user as any).username;
        token.role = (user as any).role;
        token.authToken = (user as any).token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.username = token.username as string;
      session.user.role = token.role as string;
      session.user.authToken = token.authToken as string;
      return session;
    },
    async signIn({ user, account, profile }) {
      // Handle OAuth sign in
      if (account?.provider === 'google' && profile) {
        try {
          // Send OAuth data to backend
          const response = await fetch(`${API_BASE_URL}/auth/oauth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              googleId: profile.sub,
              email: profile.email,
              name: profile.name,
              picture: profile.picture,
            }),
          });

          const data = await response.json();
          if (data.success) {
            // Store the backend token
            user.authToken = data.data.token;
            return true;
          }
        } catch (error) {
          console.error('OAuth backend error:', error);
        }
      }
      return true;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth'
  },
  session: {
    strategy: 'jwt' as const,
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
              rating: data.data.user.rating,
              token: data.data.token,
            }
          }
          return null
        } catch (error) {
          console.error('Login error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          // Check if user exists in our database
          const checkResponse = await fetch(`${API_BASE_URL}/auth/oauth/check`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              provider: account.provider,
              providerId: account.providerAccountId,
            }),
          })

          const checkData = await checkResponse.json()

          if (!checkData.exists) {
            // Create new user via OAuth
            const createResponse = await fetch(`${API_BASE_URL}/auth/oauth/register`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: user.name,
                email: user.email,
                avatar: user.image,
                provider: account.provider,
                providerId: account.providerAccountId,
                username: user.email?.split('@')[0] + '_' + account.provider,
              }),
            })

            const createData = await createResponse.json()
            if (!createData.success) {
              console.error('OAuth user creation failed:', createData.message)
              return false
            }
          }

          return true
        } catch (error) {
          console.error('OAuth sign in error:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.rating = user.rating
        token.username = user.username
        if (user.token) {
          token.accessToken = user.token
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.rating = token.rating as number
        session.user.username = token.username as string
        session.accessToken = token.accessToken as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth',
    error: '/auth',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
