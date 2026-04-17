const fs = require('fs');
const path = require('path');

const scan = (dir) => {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      scan(p);
    } else if (p.endsWith('.jsx')) {
      let c = fs.readFileSync(p, 'utf8');
      
      // Map old arbitrary colors to the new deadtimes semantic ones
      c = c.replace(/className="bg-\[#0f1d33\].*?"/g, 'className="card"');
      c = c.replace(/bg-\[#0f1d33\]/g, 'bg-deadtimes-card');
      c = c.replace(/bg-white/g, 'bg-deadtimes-card');
      c = c.replace(/text-gray-[456]00(?:\/\d+)?/g, 'text-zinc-400');
      c = c.replace(/text-gray-[789]00(?:\/\d+)?/g, 'text-white');
      c = c.replace(/text-black/g, 'text-white');
      c = c.replace(/border-gray-[34]00/g, 'border-deadtimes-border');
      c = c.replace(/border-blue-[789]00(?:\/\d+)?/g, 'border-deadtimes-border');
      c = c.replace(/bg-blue-[89]00(?:\/\d+)?/g, 'bg-deadtimes-accent');
      c = c.replace(/hover:bg-blue-[789]00/g, 'hover:bg-deadtimes-hover');
      c = c.replace(/hover:bg-gray-200/g, 'hover:bg-deadtimes-hover');
      
      // specifically targeting the scan buttons logic from earlier manually:
      c = c.replace(/text-gray-800\/70 bg-white border border-gray-300 rounded-md hover:bg-white/g, 'btn btn-secondary btn-sm');
      
      fs.writeFileSync(p, c);
    }
  });
};

scan(path.join(__dirname, 'frontend/src'));
console.log('Class replacement done.');
