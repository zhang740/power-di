// tslint:disable
import * as path from 'path';
import * as fs from 'fs';
import * as ts from 'typescript';
import { NodeTransformer, walker } from './util';

console.log('[power-di] load transformer: class metadata.');

export default function transformer(program: ts.Program) {
  const typeChecker = program.getTypeChecker();
  return {
    before(ctx: ts.TransformationContext) {
      return (sourceFile: ts.SourceFile) => {
        return walker(sourceFile, ctx, before(ctx, sourceFile, typeChecker));
      };
    },
  };
}

export function before(
  ctx: ts.TransformationContext,
  sf: ts.SourceFile,
  typeChecker: ts.TypeChecker
): NodeTransformer {
  const pkg = findPkg(sf.fileName);
  if (!pkg) {
    console.log('no pkg', sf.fileName);
  }
  return (node: ts.Node) => {
    if (!pkg) {
      return node;
    }
    if (!ts.isDecorator(node)) {
      return node;
    }
    // 处理注入 type
    if (
      ['inject', 'getContributions', 'getExtensions', 'getPlugins'].includes(
        `${getDecoratorName(node)}`
      )
    ) {
      return processInject(node, sf, typeChecker);
    }

    // 处理 class
    if (['injectable', 'extension', 'contribution'].includes(`${getDecoratorName(node)}`)) {
      return processClassInfo(node, pkg, sf, typeChecker);
    }

    return node;
  };
}

function processClassInfo(
  node: ts.Decorator,
  pkg: ReturnType<typeof findPkg>,
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker
) {
  const clsNode = node.parent;
  if (!ts.isClassDeclaration(clsNode) || !ts.isCallExpression(node.expression)) {
    return node;
  }
  const decoratorFactory = node.expression;
  if (
    decoratorFactory.arguments &&
    decoratorFactory.arguments[0] &&
    !ts.isObjectLiteralExpression(decoratorFactory.arguments[0])
  ) {
    console.warn(
      '[power-di] class metadata transformer fail!',
      `@${getDecoratorName(node)} of class [${
      clsNode.name.escapedText
      }] param is not a ObjectLiteral.`
    );
    return node;
  }
  const oldArg = decoratorFactory.arguments.length && decoratorFactory.arguments[0];
  const oldArgObj = oldArg && ts.isObjectLiteralExpression(oldArg) && oldArg;

  const impls =
    !hasField(oldArgObj, 'implements') &&
    clsNode.heritageClauses?.find(hc => hc.token === ts.SyntaxKind.ImplementsKeyword);

  impls &&
    impls.types.forEach(typeNode => {
      const type = typeChecker.getTypeFromTypeNode(typeNode);
      const symbol = type.getSymbol();
      fixedImport(symbol?.name || typeNode.getText(), sourceFile);
    });

  const info = [
    ts.createPropertyAssignment('pkg', ts.createStringLiteral(pkg.name)),
    ts.createPropertyAssignment('version', ts.createStringLiteral(pkg.version)),
    impls &&
    ts.createPropertyAssignment(
      'implements',
      ts.createArrayLiteral(impls.types.map(type => type.expression))
    ),
  ].filter(s => s);

  const config = oldArgObj
    ? ts.updateObjectLiteral(
      oldArgObj,
      ts.createNodeArray([
        ...info,
        ...oldArgObj.properties.filter(
          p =>
            p.name &&
            ts.isIdentifier(p.name) &&
            !['pkg', 'version', impls ? 'implements' : undefined]
              .filter(s => s)
              .includes(`${p.name.escapedText}`)
        ),
      ])
    )
    : ts.createObjectLiteral(ts.createNodeArray(info), false);

  return ts.updateDecorator(
    node,
    ts.updateCall(decoratorFactory, decoratorFactory.expression, decoratorFactory.typeArguments, [
      config,
    ])
  );
}

function processInject(node: ts.Decorator, sourceFile: ts.SourceFile, typeChecker: ts.TypeChecker) {
  const propertyNode = node.parent;
  if (!ts.isPropertyDeclaration(propertyNode) || !ts.isCallExpression(node.expression)) {
    return node;
  }
  const decoratorFactory = node.expression;
  if (
    decoratorFactory.arguments &&
    decoratorFactory.arguments[0] &&
    !ts.isObjectLiteralExpression(decoratorFactory.arguments[0])
  ) {
    console.warn(
      '[power-di] class metadata transformer fail!',
      `@${getDecoratorName(
        node
      )} of class [${propertyNode.name.getText()}] param is not a ObjectLiteral.`
    );
    return node;
  }
  const oldArg = decoratorFactory.arguments.length && decoratorFactory.arguments[0];
  const oldArgObj = oldArg && ts.isObjectLiteralExpression(oldArg) && oldArg;

  if (
    oldArgObj &&
    oldArgObj.properties.some(
      p => p.name && ts.isIdentifier(p.name) && 'type' === `${p.name.escapedText}`
    )
  ) {
    return node;
  }

  const refType = propertyNode.type
    ? ts.isTypeReferenceNode(propertyNode.type)
      ? propertyNode.type
      : ts.isArrayTypeNode(propertyNode.type)
        ? ts.isTypeReferenceNode(propertyNode.type.elementType)
          ? propertyNode.type.elementType
          : undefined
        : undefined
    : undefined;
  if (!refType) {
    return node;
  }

  let identifier = refType.typeName as ts.Identifier;
  if (identifier.escapedText === 'Array') {
    identifier = (refType.typeArguments[0] as ts.TypeReferenceNode)?.typeName as ts.Identifier;
    if (!identifier) {
      console.warn(
        '[power-di] class metadata transformer fail!',
        getDecoratorName(node),
        propertyNode.name.getText(),
        refType.getText()
      );
      return node;
    }
  }

  fixedImport(identifier.escapedText, sourceFile);

  const info = [refType && ts.createPropertyAssignment('type', identifier)];

  const config = oldArgObj
    ? ts.updateObjectLiteral(oldArgObj, ts.createNodeArray([...info, ...oldArgObj.properties]))
    : ts.createObjectLiteral(ts.createNodeArray(info), false);

  return ts.updateDecorator(
    node,
    ts.updateCall(decoratorFactory, decoratorFactory.expression, decoratorFactory.typeArguments, [
      config,
    ])
  );
}

const pkgCache: { path: string; pkg: any }[] = [];
function findPkg(filePath: string): any {
  if (filePath === '/') {
    return;
  }
  const parsed = path.parse(filePath);

  const cache = pkgCache
    .sort((a, b) => b.path.length - a.path.length)
    .find(pc => parsed.dir === pc.path);
  if (cache) {
    return cache.pkg;
  }

  const pkgPath = path.join(parsed.dir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return findPkg(parsed.dir);
  }

  const pkgData = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkgCache.push({ path: parsed.dir, pkg: pkgData });
  return pkgData;
}

function getDecoratorName(node: ts.Decorator) {
  if (!node) {
    return '';
  }
  return ts.isIdentifier(node.expression)
    ? node.expression.escapedText
    : ts.isCallExpression(node.expression) && ts.isIdentifier(node.expression.expression)
      ? node.expression.expression.escapedText
      : '';
}

function getField(config: ts.Expression | undefined, fieldName: string) {
  const prop =
    config &&
    ts.isObjectLiteralExpression(config) &&
    config.properties.find(p => {
      return p.name && ts.isIdentifier(p.name) && p.name.escapedText === fieldName;
    });
  return prop && ts.isPropertyAssignment(prop) && prop;
}

function hasField(config: ts.Expression | undefined, fieldName: string) {
  return !!getField(config, fieldName);
}

function fixedImport(escapedText: string | ts.__String, sourceFile: ts.SourceFile) {
  sourceFile.statements
    .filter(n => ts.isImportDeclaration(n))
    .forEach((im: ts.ImportDeclaration) => {
      const nb = im.importClause?.namedBindings as ts.NamedImports;
      const el = nb?.elements?.find(el => {
        return el.name.escapedText === escapedText;
      });
      if (el) {
        im.flags = im.flags | ts.NodeFlags.Synthesized;
      }
    });
}
