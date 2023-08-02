interface ICategory {
  name: string;
  url: string;
  swaggerVersion: string;
  location: string;
}

interface IApiJSON {
  basePath: string;
  definitions: Record<string, IDefinition>;
  host: string;
  info: string;
  paths: Record<string, IPath>;
  swagger: string;
  tags: Array<ITag>;
}

type IProperty =
  | IPropertyBaseType
  | IPropertyArrayObject
  | IPropertyArrayRef
  | IPropertyEnum
  | IPropertyRef;

interface IPropertyBaseType {
  description: string;
  type: string;
}

interface IPropertyArrayBase {
  // items: ISchema;
  description: string;
  type: string;
}

interface IPropertyArrayObject extends IPropertyArrayBase {
  items: {
    type: string;
    description?: string;
  };
}

interface IPropertyArrayRef extends IPropertyArrayBase {
  items: ISchema;
}

interface IPropertyEnum {
  description: string;
  enum: unknown[];
  type: string;
}

interface IPropertyRef {
  description: string;
  $ref: string;
  originalRef: string;
}

interface IDefinition {
  properties: Record<string, IProperty>;
  title: string;
  type: string;
  required?: string[];
}

interface ITag {
  description: string;
  name: string;
}

type IPath = IPathGET | IPathPOST | IPathDELETE | IPathPUT;

interface IPathGET {
  get: IPathDetail;
}
interface IPathPOST {
  post: IPathDetail;
}

interface IPathDELETE {
  delete: IPathDetail;
}
interface IPathPUT {
  put: IPathDetail;
}

export interface IPathDetail {
  consumes: Array<string>;
  deprecated: boolean;
  description: string;
  operationId: string;
  parameters: Array<IParams> | null;
  responses: {
    200: {
      description: string;
      schema: {
        $ref: string;
        originalRef: string | null;
      } | null;
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
  schema?: ISchema; // 目前只有post请求有，post请求也不一定有
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

interface IGenConfig {
  baseUrl: string;
  genBase?: {
    apiFileDir: string;
    typeFileDir: string;
  };
  categoryName: string;
}
