import { getMotorById } from "@/lib/actions";
import { MotorForm } from "@/components/motor-form";
import { Motor } from "@/types/motor";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface EditMotorPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditMotorPage({ params }: EditMotorPageProps) {
  const { id } = await params;
  const motor = await getMotorById(parseInt(id));

  if (!motor) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6">
        <MotorForm motor={motor as unknown as Motor} />
      </div>
    </div>
  );
}
