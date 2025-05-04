import ParticipantNetwork from "./participant-network";

export default function NetworkPage() {
  return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Social Network Analysis</h1>

      <div className="mb-4">
        <ParticipantNetwork participantIds={["32391", "32392"]} />
      </div>
    </div>
  );
}
