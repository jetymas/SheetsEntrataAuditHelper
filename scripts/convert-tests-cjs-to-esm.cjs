#!/usr/bin/env node
const fs = require("fs");
const _path = require("path");
const glob = require("glob");
const recast = require("recast");
const parser = require("recast/parsers/babel");

// Builders
const b = recast.types.builders;

// Find all CommonJS Jest test files
const files = glob.sync("tests/**/*.test.js", { nodir: true });

files.forEach((file) => {
  const code = fs.readFileSync(file, "utf8");
  const ast = recast.parse(code, { parser });

  // Transform require() to import
  recast.types.visit(ast, {
    visitVariableDeclaration(pathNode) {
      const decl = pathNode.node.declarations[0];
      if (
        decl &&
        decl.init &&
        decl.init.type === "CallExpression" &&
        decl.init.callee.name === "require"
      ) {
        const source = decl.init.arguments[0].value;
        let importDecl;
        if (decl.id.type === "Identifier") {
          importDecl = b.importDeclaration(
            [b.importDefaultSpecifier(b.identifier(decl.id.name))],
            b.literal(source),
          );
        } else if (decl.id.type === "ObjectPattern") {
          importDecl = b.importDeclaration(
            decl.id.properties.map((prop) =>
              b.importSpecifier(b.identifier(prop.key.name)),
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

  // Transform module.exports = ... to export default
  recast.types.visit(ast, {
    visitAssignmentExpression(pathNode) {
      const { left, right } = pathNode.node;
      if (
        left.type === "MemberExpression" &&
        left.object.name === "module" &&
        left.property.name === "exports"
      ) {
        const exportDecl = b.exportDefaultDeclaration(right);
        pathNode.replace(exportDecl);
        return false;
      }
      this.traverse(pathNode);
    },
  });

  // Write to new .mjs file and prepend jest import
  const newFile = file.replace(/\.js$/, ".mjs");
  const transformedCode = recast.print(ast).code;
  const output = `import { jest } from '@jest/globals';\n${transformedCode}`;
  fs.writeFileSync(newFile, output, "utf8");
  fs.unlinkSync(file);
  console.log(`Converted ${file} → ${newFile}`);
});
