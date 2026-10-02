import "./config/dns.js";

import app from "./app.js";
import env from "./config/env.js";
import { checkDatabaseConnection } from "./config/database.js";
import { createUsersTable } from "./models/user.model.js";
import { createCatalogTables } from "./models/catalog.model.js";
import { createDocumentsTable } from "./models/document.model.js";
import { createOrganizationTables } from "./models/organization.model.js";
import { seedDemoOrganizations } from "./models/organization.model.js";
import { seedCatalog } from "./services/catalog.service.js";
import { createPartnerTables } from "./models/partner.model.js";

const startServer = async () => {
  try {
    await checkDatabaseConnection();
    await createUsersTable();
    await createCatalogTables();
    await createDocumentsTable();
    await createOrganizationTables();
    await createPartnerTables();
    await seedDemoOrganizations();
    await seedCatalog();

    const server = app.listen(env.port, () => {
      console.log(`
🚀 Server started

Environment : ${env.nodeEnv}
Port        : ${env.port}
API         : http://localhost:${env.port}${env.apiPrefix}
Health      : http://localhost:${env.port}${env.apiPrefix}/health
      `);
    });

    const shutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down...`);

      server.close(() => {
        console.log("Server closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Failed to start server");
    if (error.code === "ENOTFOUND") {
      console.error(
        `Database host "${env.database.host}" could not be resolved. ` +
          "For Supabase, use the IPv4-compatible pooler DATABASE_URL from Project Settings > Database."
      );
    } else if (error.code === "ENETUNREACH") {
      console.error(
        "The database resolved to an unreachable network address. " +
          "For an IPv6-only Supabase direct endpoint, use its IPv4-compatible pooler connection string."
      );
    }
    console.error(error);

    process.exit(1);
  }
};

startServer();