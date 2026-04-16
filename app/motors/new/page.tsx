import { MotorForm } from "@/components/motor-form";

export default function NewMotorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6">
        <MotorForm />
      </div>
    </div>
  );
}
