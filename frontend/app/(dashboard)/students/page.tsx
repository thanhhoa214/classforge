import { StudentDataTable } from "./components/student-data-table";

export default function StudentsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Student Management</h1>
      </div>
      <StudentDataTable />
    </div>
  );
}
