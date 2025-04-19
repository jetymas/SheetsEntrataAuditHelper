#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const recast = require('recast');
const parser = require('recast/parsers/babel');
const b = recast.types.builders;

// Find all .js files in src/js
const files = glob.sync('src/js/**/*.js', { nodir: true });

files.forEach(file => {
  const code = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = recast.parse(code, { parser });
  } catch (e) {
    console.warn(`Skipping ${file} due to parse error: ${e.message}`);
    return;
  }

  // Transform require to import
  recast.types.visit(ast, {
    visitVariableDeclaration(pathNode) {
      const decl = pathNode.node.declarations[0];
      if (decl && decl.init && decl.init.type === 'CallExpression' && decl.init.callee.name === 'require') {
        const source = decl.init.arguments[0].value;
        let importDecl;
        if (decl.id.type === 'Identifier') {
          importDecl = b.importDeclaration([
            b.importDefaultSpecifier(b.identifier(decl.id.name))
          ], b.literal(source));
        } else if (decl.id.type === 'ObjectPattern') {
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

  // Transform module.exports assignments to export default
  recast.types.visit(ast, {
    visitAssignmentExpression(pathNode) {
      const { left, right } = pathNode.node;
      if (left.type === 'MemberExpression' && left.object.name === 'module' && left.property.name === 'exports') {
        const exportDecl = b.exportDefaultDeclaration(right);
        pathNode.replace(exportDecl);
        return false;
      }
      this.traverse(pathNode);
    }
  });

  // Write new .mjs file
  const newFile = file.replace(/\.js$/, '.mjs');
  fs.writeFileSync(newFile, recast.print(ast).code, 'utf8');
  fs.unlinkSync(file);
  console.log(`Converted ${file} → ${newFile}`);
});
