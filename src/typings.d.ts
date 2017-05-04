export interface FleetUpData {
  Success: boolean;
  Message: string;
  CachedUntilUTC: string;
  CachedUntilString: string;
  Code: number;
  Data: Array<FleetUpOperationData>;
}

export interface FleetUpOperationData {
  Id: number;
  OperationId: number;
  Subject: string;
  Start: string;
  End: string;
  StartString: string;
  Location: string;
  LocationId: number;
  LocationInfo: string;
  Details: string;
  Url: string;
  Organizer: string;
  Category: string;
  Group: string;
  GroupId: number;
  Doctrines: Array<{
    Id: number;
    Name: string;
  }>;
}

export interface OperationData {
  [id: number]: FleetUpOperationData;
}
