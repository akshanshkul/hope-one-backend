import { registerPushToken, unregisterPushToken } from "../services/push-token.service.js";

export const register = async (req, res) => {
  const token = await registerPushToken(req.user.id, req.body || {});
  res.status(201).json({ success: true, message: "Push notification token registered", data: token });
};

export const unregister = async (req, res) => {
  const removed = await unregisterPushToken(req.user.id, req.body || {});
  res.json({ success: true, message: removed ? "Push notification token removed" : "Token was not registered" });
};
