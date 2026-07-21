import { redirect } from "next/navigation";

type ReviewDetailsPageProps = {
  params: Promise<{
    reviewId: string;
  }>;
};

export default async function ReviewDetailsPage({
  params,
}: ReviewDetailsPageProps) {
  const { reviewId } = await params;

  redirect(
    `/reviews/new?reviewId=${encodeURIComponent(
      reviewId,
    )}`,
  );
}