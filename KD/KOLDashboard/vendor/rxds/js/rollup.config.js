
export default {
  input: 'rxds.js',
  output: {
    file: 'rxds_bundle.js',
    format: 'iife',
    name:'rxds',
    intro: 'var ENVIRONMENT = "production";var version = 1;',
    banner: '/* RXDS Client version 2.0 */',
    footer: '/* Copyright © 2018, RxDataScience,Inc. All rights reserved. */'
    , globals: {version:2.0, util: 'util'}
  },
  treeshake: false

  //plugins: [
    //builtins(),
    //commonjs(),
    //nodeResolve({
      //jsnext: true,
      //module: true,
      //browser: true  
    //}),
    //json({
      //include: 'node_modules/iconv-lite/**',  // Default: undefined 
      //preferConst: true, // Default: false 
    //}),
  //]
}
