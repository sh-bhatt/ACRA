export type NewReviewActionState = {
  status: "idle" | "error";
  message: string;
};

export const initialNewReviewActionState:
  NewReviewActionState = {
    status: "idle",
    message: "",
  };