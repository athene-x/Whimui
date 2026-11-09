export type Ping = { ok: boolean; at: string };

export type ListEcho = {
  searchTerm: string | null;
  sort: string | null;
  filters: string[];
  page: string | null;
  size: string | null;
};

export type Me = {
  sub: string;
  preferredUsername?: string;
  email?: string;
  name?: string;
  iss: string;
  aud: string[];
  azp?: string;
  sid?: string;
  exp: number;
  scope?: string;
};
