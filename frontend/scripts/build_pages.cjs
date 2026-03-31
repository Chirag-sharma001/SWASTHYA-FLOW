const fs = require('fs');
const path = require('path');

const uiDir = path.join(__dirname, '../../stitch_ui');
const pagesDir = path.join(__dirname, '../src/pages');

const files = {
  'role_selection.html': 'RoleSelection',
  'reception_panel.html': 'ReceptionPanel',
  'doctor_panel.html': 'DoctorPanel',
  'patient_display_panel.html': 'PatientDisplayPanel'
};

function htmlToJSX(html) {
  return html
    .replace(/class=/g, 'className=')
    .replace(/for=/g, 'htmlFor=')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<input(.*?)>/g, (match, attrs) => {
      if (attrs.endsWith('/')) return match;
      return `<input${attrs} />`;
    })
    .replace(/<br>/g, '<br />')
    .replace(/<img(.*?)>/g, (match, attrs) => {
      if (attrs.endsWith('/')) return match;
      return `<img${attrs} />`;
    })
    .replace(/style="([^"]*)"/g, (match, styleString) => {
      const parts = styleString.split(';').filter(Boolean);
      const styleObj = {};
      parts.forEach(p => {
        let [key, val] = p.split(':');
        if (key && val) {
          key = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
          val = val.trim();
          
          if (!isNaN(val) && val !== '') {
            val = Number(val);
          } else {
            val = val.replace(/'/g, "\\'");
            val = `'${val}'`;
          }
          styleObj[key] = val;
        }
      });
      const entries = Object.entries(styleObj).map(([k, v]) => `${k}: ${v}`).join(', ');
      return `style={{ ${entries} }}`;
    });
}

function processFile(filename, compName) {
  const html = fs.readFileSync(path.join(uiDir, filename), 'utf8');
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let content = bodyMatch ? bodyMatch[1] : html;
  
  content = htmlToJSX(content);

  const component = `
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ${compName}() {
  const navigate = useNavigate();
  return (
    <>
      ${content}
    </>
  );
}
`;
  
  fs.writeFileSync(path.join(pagesDir, `${compName}.jsx`), component);
  console.log(`Created ${compName}.jsx`);
}

for (const [file, comp] of Object.entries(files)) {
  processFile(file, comp);
}
