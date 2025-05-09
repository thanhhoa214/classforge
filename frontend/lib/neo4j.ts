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
  moretime_out_degree: number;
  advice_closeness: number;
  moretime_in_degree: number;
  friends_in_degree: number;
  disrespect_in_degree: number;
  influential_in_degree: number;
  advice_out_degree: number;
  influential_out_degree: number;
  friends_out_degree: number;
  moretime_betweenness: number;
  disrespect_out_degree: number;
  disrespect_closeness: number;
  advice_in_degree: number;
  disrespect_betweenness: number;
  advice_betweenness: number;
  influential_betweenness: number;
  friends_betweenness: number;
  moretime_closeness: number;
  mental_score: number;
  influential_closeness: number;
  friends_closeness: number;
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
export type SurveyDataNode = Node<
  Integer,
  {
    attendance: number;
    bullying: number;
    comfortable: number;
    covid: number;
    criticises: number;
    current_class: Integer;
    depressed: number;
    future: number;
    hopeless: number;
    intelligence1: number;
    intelligence2: number;
    isolated: number;
    language: number;
    manbox5_1: number;
    manbox5_2: number;
    manbox5_3: number;
    manbox5_4: number;
    manbox5_5: number;
    men_better_stem: number;
    nerds: number;
    nervous: number;
    opinion: number;
    participant_id: Integer;
    perc_academic: number;
    perc_effort: number;
    pwi_wellbeing: number;
    restless: number;
    soft: number;
    tried: number;
    women_different: number;
    worthless: number;
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
