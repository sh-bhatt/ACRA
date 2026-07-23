import { z } from "zod";

import {
  aiReviewStructuredOutputSchema,
} from "@acra/review-schema";

const generatedSchema =
  z.toJSONSchema(
    aiReviewStructuredOutputSchema,
    {
      target: "draft-07",
    },
  );

export const aiReviewJsonSchema:
  Record<string, unknown> =
  Object.fromEntries(
    Object.entries(
      generatedSchema,
    ).filter(
      ([key]) =>
        key !== "$schema",
    ),
  );