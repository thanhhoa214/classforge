import neo4j, { Integer, Node, Relationship } from "neo4j-driver-lite";

export const neo4jDriver = neo4j.driver(
  "bolt://127.0.0.1:7687",
  neo4j.auth.basic("neo4j", "password")
);

export interface Participant {
  attendance: Integer;
  completeyears: Integer;
  email: string;
  first_name: string;
  house: string;
  last_name: string;
  participant_id: Integer;
  perc_academic: string;
  perc_effort: Integer;
}
export interface Metric {
  academic_score: number;
  social_score: number;
  mental_score: number;
}

export interface Process {
  updated_at: Date;
  name: string;
  created_at: Date;
  description: string;
  run_type: string;
  id: Integer;
  start_date: Date;
}

export type ProcessNode = Node<Integer, Process>;
export type ParticipantNode = Node<Integer, Participant>;
export type RelationshipNode = Relationship<
  Integer,
  { run_id: Integer },
  NetworkType
>;
export type MetricNode = Node<Integer, Metric>;

export const enum NetworkType {
  has_friend = "has_friend",
  has_influence = "has_influence",
  get_advice = "get_advice",
  has_feedback = "has_feedback",
  spend_more_time = "spend_more_time",
  disrespect = "disrespect",
}
