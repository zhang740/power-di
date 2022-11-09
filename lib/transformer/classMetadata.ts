// tslint:disable
import * as path from 'path';
import * as fs from 'fs';
import * as ts from 'typescript';
import { NodeTransformer, walker } from './util';

console.log('[power-di] load transformer: class metadata.');

export default function transformer(program: ts.Program, config?: Config) {
  const typeChecker = program.getTypeChecker();
  return {
    before(ctx: ts.TransformationContext) {
      return (sourceFile: ts.SourceFile) => {
        return walker(sourceFile, ctx, before(ctx, sourceFile, typeChecker, config));
      };
    },
  };
}

export function before(
  ctx: ts.TransformationContext,
  sf: ts.SourceFile,
  typeChecker: ts.TypeChecker,
  config?: Config
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
    const injectDecorators = config?.decoratorNames?.inject ||
      pkg['power-di']?.decoratorNames?.inject || [
        'inject',
        'getContributions',
        'getExtensions',
        'getPlugins',
      ];
    if (injectDecorators.includes(`${getDecoratorName(node)}`)) {
      return processInject(ctx, node, sf, typeChecker);
    }

    // 处理 class
    const classDecorators = config?.decoratorNames?.class ||
      pkg['power-di']?.decoratorNames?.class || [
        'classInfo',
        'injectable',
        'contribution',
        'extension',
        'plugin',
      ];
    if (classDecorators.includes(`${getDecoratorName(node)}`)) {
      return processClassInfo(ctx, node, pkg, sf, typeChecker);
    }

    return node;
  };
}

function processClassInfo(
  ctx: ts.TransformationContext,
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
      fixedImport(ctx, symbol?.name || typeNode.getText(), sourceFile);
    });

  const f = ctx.factory;

  const info = [
    f.createPropertyAssignment('pkg', f.createStringLiteral(pkg.name)),
    f.createPropertyAssignment('version', f.createStringLiteral(pkg.version)),
    impls &&
      f.createPropertyAssignment(
        'implements',
        f.createArrayLiteralExpression(impls.types.map(type => type.expression))
      ),
  ].filter(s => s);

  const config = oldArgObj
    ? f.updateObjectLiteralExpression(
        oldArgObj,
        f.createNodeArray([
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
    : f.createObjectLiteralExpression(f.createNodeArray(info), false);

  return f.updateDecorator(
    node,
    f.updateCallExpression(
      decoratorFactory,
      decoratorFactory.expression,
      decoratorFactory.typeArguments,
      [config]
    )
  );
}

function processInject(
  ctx: ts.TransformationContext,
  node: ts.Decorator,
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker
) {
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

  fixedImport(ctx, identifier.escapedText, sourceFile);

  const f = ctx.factory;

  const info = [
    f.createPropertyAssignment('type', identifier),
    propertyNode.questionToken && f.createPropertyAssignment('optional', f.createTrue()),
  ].filter(
    s => s && (!oldArgObj || oldArgObj.properties.every(p => p.name.getText() !== s.name.getText()))
  );

  const config = oldArgObj
    ? f.updateObjectLiteralExpression(
        oldArgObj,
        f.createNodeArray([...info, ...oldArgObj.properties])
      )
    : f.createObjectLiteralExpression(f.createNodeArray(info), false);

  return f.updateDecorator(
    node,
    f.updateCallExpression(
      decoratorFactory,
      decoratorFactory.expression,
      decoratorFactory.typeArguments,
      [config]
    )
  );
}

type Config = {
  decoratorNames?: {
    inject?: string[];
    class?: string[];
  };
};

type PkgJSONType = {
  name: string;
  version: string;
  'power-di'?: Config;
};

const pkgCache: { path: string; pkg: PkgJSONType }[] = [];
function findPkg(filePath: string): PkgJSONType {
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

function fixedImport(
  ctx: ts.TransformationContext,
  escapedText: string | ts.__String,
  sourceFile: ts.SourceFile
) {
  // const f = ctx.factory;

  // IFoo<IBar> => IFoo
  escapedText = `${escapedText}`.split('<')[0];

  sourceFile.statements
    .filter(n => ts.isImportDeclaration(n))
    .forEach((im: ts.ImportDeclaration) => {
      const nb = im.importClause?.namedBindings as ts.NamedImports;
      const el = nb?.elements?.find(el => {
        return el.name.escapedText === escapedText;
      });
      if (el) {
        (im as any).flags = im.flags | ts.NodeFlags.Synthesized;
      }
    });
}
