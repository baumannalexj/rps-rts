/** Composition root: the only file that imports runtime code from @rps/core. */
import './theme/tokens.css';
import './theme/styles.css';
import { createLocalSimulationPort } from '@rps/core';
import { mountApp } from './app/App.ts';

const port = createLocalSimulationPort();
// Open mid-match at 16x so the charts have something to show, like the prototype.
port.reset({ seed: 42, prewarmTicks: 240 });
port.setSpeed(80);
port.play();
mountApp(document.getElementById('app')!, port);
