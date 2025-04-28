import { Suspense, useState } from "react";
import { ForceGraph2D } from "react-force-graph";

// Fake simple data (you can later replace with real)
const networkData = {
  nodes: [
    { id: "student1", name: "Student 1" },
    { id: "student2", name: "Student 2" },
    { id: "student3", name: "Student 3" },
    { id: "student4", name: "Student 4" },
  ],
  links: [
    { source: "student1", target: "student2", type: "friendship" },
    { source: "student1", target: "student3", type: "disrespect" },
    { source: "student2", target: "student4", type: "friendship" },
  ],
};

export default function NetworkPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [friendshipEnabled, setFriendshipEnabled] = useState(true);
  const [disrespectEnabled, setDisrespectEnabled] = useState(true);

  const filteredLinks = networkData.links.filter((link) => {
    if (link.type === "friendship" && friendshipEnabled) return true;
    if (link.type === "disrespect" && disrespectEnabled) return true;
    return false;
  });

  const filteredNodes = networkData.nodes.filter((node) =>
    node.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

  const finalNodes =
    searchTerm.length > 0
      ? networkData.nodes.filter((n) => filteredNodeIds.has(n.id))
      : networkData.nodes;

  const finalLinks =
    searchTerm.length > 0
      ? filteredLinks.filter(
          (l) =>
            filteredNodeIds.has(l.source as string) ||
            filteredNodeIds.has(l.target as string)
        )
      : filteredLinks;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Social Network Analysis</h1>

      {/* Filter Bar */}
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Search student..."
          className="border rounded p-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={friendshipEnabled}
            onChange={() => setFriendshipEnabled(!friendshipEnabled)}
          />
          Friendship
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={disrespectEnabled}
            onChange={() => setDisrespectEnabled(!disrespectEnabled)}
          />
          Disrespect
        </label>
      </div>

      {/* Graph */}
      <div className="border rounded-lg h-[600px]">
        <ForceGraph2D
          graphData={{
            nodes: finalNodes,
            links: finalLinks,
          }}
          nodeLabel="name"
          nodeAutoColorBy="id"
          linkColor={(link) => (link.type === "friendship" ? "green" : "red")}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.fillStyle = "black";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(label, node.x!, node.y!);
          }}
        />
      </div>
    </div>
  );
}
