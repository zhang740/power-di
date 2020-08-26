import * as ts from 'typescript';

export type NodeTransformer = (node: ts.Node) => ts.Node;

export type NodeTransformerFactory = (
  context: ts.TransformationContext,
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker
) => NodeTransformer;

export function walker(
  sourceFile: ts.SourceFile,
  ctx: ts.TransformationContext,
  nodeTransformer?: NodeTransformer
) {
  function visitor(node: ts.Node): any {
    return ts.visitEachChild(nodeTransformer(node), visitor, ctx);
  }
  return ts.visitEachChild(sourceFile, visitor, ctx);
}
