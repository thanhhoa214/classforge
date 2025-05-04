import neo4j, { Integer, Node, Relationship } from "neo4j-driver-lite";

export const neo4jDriver = neo4j.driver(
  "neo4j+s://e737894e.databases.neo4j.io",
  neo4j.auth.basic("neo4j", "ZMRSwIxV-TRAcC6tTnVsMsneqz5wfc0nSbYG6p4RBXg")
);

export interface Participant {
  attendance: string;
  completeyears: string;
  email: string;
  first_name: string;
  house: string;
  last_name: string;
  participant_id: string;
  perc_academic: string;
  perc_effort: string;
}

export type ParticipantNode = Node<Integer, Participant>;
export type RelationshipNode = Relationship<
  Integer,
  { run_id: number[] },
  NetworkType
>;

export const enum NetworkType {
  has_friend = "has_friend",
  has_influence = "has_influence",
  get_advice = "get_advice",
  has_feedback = "has_feedback",
  spend_more_time = "spend_more_time",
  disrespect = "disrespect",
}
