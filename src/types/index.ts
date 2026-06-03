export interface Trench {
  id: string;
  name: string;
  location: string;
  length: number;
  width: number;
  depth: number;
  created_at: string;
  updated_at: string;
}

export interface Stratum {
  id: string;
  trench_id: string;
  name: string;
  color: string;
  description: string;
  top_depth: number;
  bottom_depth: number;
  order_index: number;
  dip: number;
  strike: number;
}

export interface Artifact {
  id: string;
  trench_id: string;
  stratum_id: string | null;
  name: string;
  type: string;
  pos_x: number;
  pos_y: number;
  pos_z: number;
  description: string;
}

export interface Photo {
  id: string;
  trench_id: string;
  stratum_id: string | null;
  artifact_id: string | null;
  filename: string;
  original_name: string;
  description: string;
  uploaded_at: string;
  url: string;
}
