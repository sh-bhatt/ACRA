export type QueueReviewActionState = {
  status: "idle" | "error";
  message: string;
};

export const initialQueueReviewActionState:
  QueueReviewActionState = {
    status: "idle",
    message: "",
  };