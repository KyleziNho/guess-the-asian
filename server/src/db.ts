import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data", "game.db");

const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });

export interface Person {
  id: number;
  wikidata_id: string;
  name: string;
  description: string;
  country: string;
  image_url: string;
}

const randomStmt = db.prepare(`
  SELECT id, wikidata_id, name, description, country, image_url
  FROM people
  ORDER BY RANDOM()
  LIMIT ?
`);

const statsStmt = db.prepare(`
  SELECT country, COUNT(*) as count
  FROM people
  GROUP BY country
  ORDER BY count DESC
`);

const totalStmt = db.prepare(`SELECT COUNT(*) as total FROM people`);

export function getRandomPeople(count: number): Person[] {
  return randomStmt.all(count) as Person[];
}

export function getStats(): { countries: { country: string; count: number }[]; total: number } {
  const countries = statsStmt.all() as { country: string; count: number }[];
  const { total } = totalStmt.get() as { total: number };
  return { countries, total };
}

export default db;
