/**
 * Ambient Type Declarations for Vitest and Supertest in apps/api/test
 * File: apps/api/test/test-env.d.ts
 */

declare module 'vitest' {
  export interface ExpectStatic {
    (actual: any): any;
    [key: string]: any;
  }
  export const describe: {
    (name: string, fn: () => void): void;
    skip: (name: string, fn: () => void) => void;
    only: (name: string, fn: () => void) => void;
  };
  export const it: {
    (name: string, fn: () => void | Promise<void>): void;
    skip: (name: string, fn: () => void | Promise<void>) => void;
    only: (name: string, fn: () => void | Promise<void>) => void;
  };
  export const test: typeof it;
  export const expect: ExpectStatic;
  export function beforeAll(fn: () => void | Promise<void>): void;
  export function afterAll(fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;
}

declare module 'supertest' {
  export interface TestResponse {
    status: number;
    statusCode: number;
    body: any;
    text: string;
    headers: Record<string, any>;
    header: Record<string, any>;
    [key: string]: any;
  }

  export interface TestRequest extends Promise<TestResponse> {
    get(url: string): this;
    post(url: string): this;
    put(url: string): this;
    patch(url: string): this;
    delete(url: string): this;
    options(url: string): this;
    set(field: string, val: string): this;
    set(fields: Record<string, string>): this;
    send(data?: any): this;
    attach(name: string, file: any, options?: any): this;
    field(name: string, val: any): this;
    expect(status: number): this;
    expect(body: any): this;
    expect(checker: (res: TestResponse) => any): this;
  }

  export interface SuperTest {
    (app: any): TestRequest;
    get(url: string): TestRequest;
    post(url: string): TestRequest;
    put(url: string): TestRequest;
    patch(url: string): TestRequest;
    delete(url: string): TestRequest;
    options(url: string): TestRequest;
  }

  function supertest(app: any): TestRequest;
  export default supertest;
}
