import { removePushToken, upsertPushToken } from "../models/push-token.model.js";

const validate = ({ token, platform, deviceId }) => {
  if (typeof token !== "string" || token.trim().length < 10 || token.trim().length > 4096) {
    const error = new Error("token must be a string between 10 and 4096 characters");
    error.statusCode = 400;
    throw error;
  }
  if (platform !== undefined &&
      (typeof platform !== "string" || !["android", "ios", "web"].includes(platform.toLowerCase()))) {
    const error = new Error("platform must be android, ios, or web");
    error.statusCode = 400;
    throw error;
  }
  if (deviceId !== undefined &&
      (typeof deviceId !== "string" || deviceId.trim().length < 1 || deviceId.trim().length > 255)) {
    const error = new Error("deviceId must be a non-empty string of at most 255 characters");
    error.statusCode = 400;
    throw error;
  }
};

export const registerPushToken = async (userId, input) => {
  validate(input);
  return upsertPushToken({
    userId,
    token: input.token.trim(),
    platform: input.platform?.toLowerCase(),
    deviceId: input.deviceId?.trim()
  });
};

export const unregisterPushToken = async (userId, input) => {
  validate({ token: input.token });
  return removePushToken(userId, input.token.trim());
};
