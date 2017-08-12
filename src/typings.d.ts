export interface IFleetUpData {
  Success: boolean;
  Message: string;
  CachedUntilUTC: string;
  CachedUntilString: string;
  Code: number;
  Data: IFleetUpOperationData[];
}

export interface IFleetUpOperationData {
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

export interface IOperationData {
  [id: number]: IFleetUpOperationData;
}
