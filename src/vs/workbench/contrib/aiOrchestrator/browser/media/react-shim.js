/*---------------------------------------------------------------------------------------------
 *  React Shim - Provides React globals for esbuild inject
 *--------------------------------------------------------------------------------------------*/

// This file is injected by esbuild to provide React globals
// It will be bundled with the Mission Control app
import * as React from 'react';
import * as ReactDOM from 'react-dom';

// Make React available globally for JSX
window.React = React;
window.ReactDOM = ReactDOM;

export { React, ReactDOM };
