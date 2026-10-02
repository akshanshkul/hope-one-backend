import { createPartnerRecord, deletePartnerRecord, listPartnerRecords, updatePartnerRecord } from "../services/partner.service.js";

export const list = async (req, res) => res.json({ success: true, data: { records: await listPartnerRecords(req.user.id, req.params.resource) } });
export const create = async (req, res) => res.status(201).json({ success: true, data: { record: await createPartnerRecord(req.user.id, req.params.resource, req.body) } });
export const update = async (req, res) => res.json({ success: true, data: { record: await updatePartnerRecord(req.user.id, req.params.resource, req.params.id, req.body) } });
export const remove = async (req, res) => res.json({ success: true, data: { record: await deletePartnerRecord(req.user.id, req.params.resource, req.params.id) } });
