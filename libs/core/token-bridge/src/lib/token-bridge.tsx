import React from 'react';

// Função que percorre o objeto W3C recursivamente
export function parseTokensToCSS(tokens: any, prefix = '--'): string {
  let cssString = '';

  for (const key in tokens) {
    if (Object.prototype.hasOwnProperty.call(tokens, key)) {
      const node = tokens[key];
      const newPrefix = prefix === '--' ? `${prefix}${key}` : `${prefix}-${key}`;

      if (node && typeof node === 'object') {
        if ('$value' in node) {
          // É um token final
          cssString += `${newPrefix}: ${node.$value};\n`;
        } else {
          // É um grupo, desce recursivamente
          cssString += parseTokensToCSS(node, newPrefix);
        }
      }
    }
  }

  return cssString;
}

export interface TokenInjectorProps {
  tokens: any;
}

export const TokenInjector: React.FC<TokenInjectorProps> = ({ tokens }) => {
  const cssVariables = parseTokensToCSS(tokens);

  return (
    <style dangerouslySetInnerHTML={{ __html: `:root {\n${cssVariables}}` }} />
  );
};
