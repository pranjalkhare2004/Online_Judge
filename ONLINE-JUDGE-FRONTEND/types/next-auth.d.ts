import { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      rating: number
      username: string
    } & DefaultSession["user"]
    accessToken?: string
  }

  interface User extends DefaultUser {
    role: string
    rating: number
    username: string
    token?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    rating: number
    username: string
    accessToken?: string
  }
}
