export type NewReviewActionState = {
  status: "idle" | "error" | "success";
  message: string;
  reviewId: string | null;
  queued: boolean;
};

export const initialNewReviewActionState:
  NewReviewActionState = {
    status: "idle",
    message: "",
    reviewId: null,
    queued: false,
  };