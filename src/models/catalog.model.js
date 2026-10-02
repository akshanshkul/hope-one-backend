import { createHospitalsTable } from "./hospital.model.js";
import { createAssistanceProgramsTable } from "./assistance.model.js";
import { createCatalogOptionsTable } from "./catalog-option.model.js";

export { createHospitalsTable, listHospitals } from "./hospital.model.js";
export {
  createAssistanceProgramsTable,
  listAssistancePrograms,
} from "./assistance.model.js";
export {
  createCatalogOptionsTable,
  listCatalogOptions,
} from "./catalog-option.model.js";

export const createCatalogTables = async () => {
  await createHospitalsTable();
  await createAssistanceProgramsTable();
  await createCatalogOptionsTable();
};
