#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';
import recast from 'recast';
import * as parser from 'recast/parsers/babel';

// Parse with Babel parser

// Find all CommonJS Jest test files
const files = globSync('tests/**/*.test.js', { nodir: true });

files.forEach(file => {
  const code = fs.readFileSync(file, 'utf8');
  const ast = recast.parse(code, { parser });
  const b = recast.types.builders;

  // Transform require statements to import
  recast.types.visit(ast, {
    visitVariableDeclaration(pathNode) {
      const decl = pathNode.node.declarations[0];
      if (decl && decl.init && decl.init.callee && decl.init.callee.name === 'require') {
        const source = decl.init.arguments[0].value;
        let importDecl;
        if (decl.id.type === 'Identifier') {
          // const X = require('...')
          importDecl = b.importDeclaration(
            [b.importDefaultSpecifier(b.identifier(decl.id.name))],
            b.literal(source)
          );
        } else if (decl.id.type === 'ObjectPattern') {
          // const { a, b } = require('...')
          importDecl = b.importDeclaration(
            decl.id.properties.map(prop => b.importSpecifier(b.identifier(prop.key.name))),
            b.literal(source)
          );
        }
        if (importDecl) {
          pathNode.replace(importDecl);
          return false;
        }
      }
      this.traverse(pathNode);
    }
  });

  // Transform module.exports = ... to export default
  recast.types.visit(ast, {
    visitExpressionStatement(pathNode) {
      const expr = pathNode.node.expression;
      if (
        expr.type === 'AssignmentExpression' &&
        expr.left.object && expr.left.object.name === 'module' &&
        expr.left.property && expr.left.property.name === 'exports'
      ) {
        const exportDecl = b.exportDefaultDeclaration(expr.right);
        pathNode.replace(exportDecl);
        return false;
      }
      this.traverse(pathNode);
    }
  });

  // Write transformed code to .mjs file and remove old .js
  const newFile = file.replace(/\.js$/, '.mjs');
  fs.writeFileSync(newFile, recast.print(ast).code, 'utf8');
  fs.unlinkSync(file);
  console.log(`Converted ${file} → ${newFile}`);
});
