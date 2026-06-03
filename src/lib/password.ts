import { hash } from "bcryptjs";

const ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ROUNDS);
}
