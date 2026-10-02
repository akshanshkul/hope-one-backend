import { query } from "../config/database.js";

export const createCatalogOptionsTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS catalog_options (
      id UUID PRIMARY KEY,
      category TEXT NOT NULL,
      value TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      UNIQUE (category, value)
    )
  `);
};

export const listCatalogOptions = async () => {
  const result = await query(
    "SELECT category, value FROM catalog_options ORDER BY category, sort_order, value"
  );
  return result.rows.reduce((options, row) => {
    (options[row.category] ||= []).push(row.value);
    return options;
  }, {});
};
