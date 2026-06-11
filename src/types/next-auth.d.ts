declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      emailVerified: boolean
      profileComplete: boolean
      isAdmin: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub?: string
    email?: string
    name?: string
    emailVerified?: boolean
    profileComplete?: boolean
    isAdmin?: boolean
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    emailVerified?: boolean
    profileComplete?: boolean
    isAdmin?: boolean
  }
}
