export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  imgUrl: string | null;
}

export interface JwtClaims {
  sub: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
  };
}
