import { z } from 'zod';

const roomIdSchema = z
  .string()
  .min(8)
  .max(32)
  .regex(/^[A-Za-z0-9_-]+$/);

const displayNameSchema = z
  .string()
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .min(1)
      .max(30)
      .regex(/^[\p{L}\p{N} \-']+$/u),
  );

const participantIdSchema = z.string().uuid();

export const roomJoinPayloadSchema = z
  .object({
    roomId: roomIdSchema,
    displayName: displayNameSchema,
  })
  .strict();

export const roomLeavePayloadSchema = z.object({}).strict();

export const chatSendPayloadSchema = z
  .object({
    text: z.string(),
  })
  .strict();

export const mediaStatePayloadSchema = z
  .object({
    microphoneEnabled: z.boolean(),
    cameraEnabled: z.boolean(),
  })
  .strict();

export const signalOfferPayloadSchema = z
  .object({
    toParticipantId: participantIdSchema,
    sdp: z.string().min(1),
  })
  .strict();

export const signalAnswerPayloadSchema = z
  .object({
    toParticipantId: participantIdSchema,
    sdp: z.string().min(1),
  })
  .strict();

export const signalIcePayloadSchema = z
  .object({
    toParticipantId: participantIdSchema,
    candidate: z.string().min(1),
  })
  .strict();
