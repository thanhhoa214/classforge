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
export type MetricNode = Node<
  Integer,
  {
    academic_score: number;
    advice_betweenness: Integer;
    advice_closeness: number;
    advice_in_degree: Integer;
    advice_out_degree: Integer;
    disrespect_betweenness: Integer;
    disrespect_closeness: number;
    disrespect_in_degree: Integer;
    disrespect_out_degree: Integer;
    friends_betweenness: number;
    friends_closeness: number;
    friends_in_degree: Integer;
    friends_out_degree: Integer;
    influential_betweenness: number;
    influential_closeness: number;
    influential_in_degree: Integer;
    influential_out_degree: Integer;
    mental_score: number;
    moretime_betweenness: number;
    moretime_closeness: number;
    moretime_in_degree: Integer;
    moretime_out_degree: Integer;
    social_score: number;
  }
>;

export const enum NetworkType {
  has_friend = "has_friend",
  has_influence = "has_influence",
  get_advice = "get_advice",
  has_feedback = "has_feedback",
  spend_more_time = "spend_more_time",
  disrespect = "disrespect",
}
