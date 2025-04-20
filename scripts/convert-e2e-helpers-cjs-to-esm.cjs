#!/usr/bin/env node
const fs = require("fs");

const recast = require("recast");
const glob = require("glob");
const parser = require("recast/parsers/babel");
const b = recast.types.builders;

// Files to convert
const helperFiles = glob.sync("tests/e2e/helpers/*.js", { nodir: true });

helperFiles.forEach((file) => {
  const code = fs.readFileSync(file, "utf8");
  let ast;
  try {
    ast = recast.parse(code, { parser });
  } catch (e) {
    console.warn(`Skipping ${file}: ${e.message}`);
    return;
  }

  // Replace require calls
  recast.types.visit(ast, {
    visitVariableDeclaration(pathNode) {
      const decl = pathNode.node.declarations[0];
      if (
        decl.init &&
        decl.init.type === "CallExpression" &&
        decl.init.callee.name === "require"
      ) {
        const source = decl.init.arguments[0].value;
        const id = decl.id;
        let importDecl;
        if (id.type === "Identifier") {
          importDecl = b.importDeclaration(
            [b.importDefaultSpecifier(b.identifier(id.name))],
            b.literal(source),
          );
        } else if (id.type === "ObjectPattern") {
          importDecl = b.importDeclaration(
            id.properties.map((p) =>
              b.importSpecifier(b.identifier(p.key.name)),
            ),
            b.literal(source),
          );
        }
        if (importDecl) {
          pathNode.replace(importDecl);
          return false;
        }
      }
      this.traverse(pathNode);
    },
  });

  // Remove module.exports
  recast.types.visit(ast, {
    visitExpressionStatement(pathNode) {
      const expr = pathNode.node.expression;
      if (
        expr.type === "AssignmentExpression" &&
        expr.left.type === "MemberExpression" &&
        expr.left.object &&
        expr.left.object.name === "module"
      ) {
        pathNode.prune();
        return false;
      }
      this.traverse(pathNode);
    },
  });

  // Add named exports at end
  const exports = [
    "injectChromeIdentityStub",
    "launchExtensionWithServer",
    "setupRequestInterception",
    "captureScreenshotsOnFailure",
    "autoStubAllPages",
  ];
  const exportDecl = b.exportNamedDeclaration(
    null,
    exports.map((name) =>
      b.exportSpecifier(b.identifier(name), b.identifier(name)),
    ),
  );
  ast.program.body.push(exportDecl);

  // Write new .mjs file
  const newFile = file.replace(/\.js$/, ".mjs");
  fs.writeFileSync(newFile, recast.print(ast).code, "utf8");
  fs.unlinkSync(file);
  console.log(`Converted ${file} -> ${newFile}`);
});
