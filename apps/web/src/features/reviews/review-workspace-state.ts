import type {
  ReviewFocusValue,
} from "@/features/profile/profile-options";
import type {
  PasteLanguage,
} from "@/features/reviews/review-options";

export type ExistingPastedReview = {
  id: string;
  name: string;
  language: PasteLanguage;
  reviewFocus: ReviewFocusValue[];
  code: string;
};