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

export interface IPathDetail {
  consumes: Array<string>;
  deprecated: boolean;
  description: string;
  operationId: string;
  parameters: Array<IParams>;
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

export interface IParams {
  name: string;
  description: string;
  name: string;
  required: string;
  in: string;
  schema?: ISchema; // 目前只有post请求有
  type: string; // 传入的类型
}

interface ISchema {
  $ref: string;
  originalRef: string;
}

interface ITagFileMap {
  tagName: string;
  fileName: string;
}
