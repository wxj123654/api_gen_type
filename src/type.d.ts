interface ICategory {
  name: string;
  url: string;
  swaggerVersion: string;
  location: string;
}

interface IApiJSON {
  basePath: string;
  definitions: string;
  host: string;
  info: string;
  paths: Record<string, IPath>;
  swagger: string;
  tags: Array<ITag>;
}

interface ITag {
  description: string;
  name: string;
}

type IPath = IPathGET | IPathPOST;

interface IPathGET {
  get: IPathDetail;
}
interface IPathPOST {
  post: IPathDetail;
}

interface IPathDetail {
  consumes: Array<string>;
  deprecated: boolean;
  description: string;
  operationId: string;
  responses: {
    200: {
      description: string;
      schema: {
        $ref: string;
        originalRef: string;
      };
    };
  };
  summary: string;
  tags: Array<string>;
}
