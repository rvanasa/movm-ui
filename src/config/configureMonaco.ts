import motokoTheme from 'monaco-themes/themes/Blackboard.json';
import { configure } from 'motoko/contrib/monaco';
import prettier from 'prettier';

export const configureMonaco = (monaco) => {
  monaco.editor.defineTheme('motoko-theme', motokoTheme);
  configure(monaco);

  // Asynchronously load WASM
  import('prettier-plugin-motoko/src/environments/web')
    .then((motokoPlugin) => {
      monaco.languages.registerDocumentFormattingEditProvider('motoko', {
        provideDocumentFormattingEdits(model, _options, _token) {
          const source = model.getValue();
          const formatted = prettier.format(source, {
            plugins: [motokoPlugin],
            filepath: '*.mo',
          });
          return [
            {
              range: model.getFullModelRange(),
              text: formatted,
            },
          ];
        },
      });
    })
    .catch((err) => console.error(err));
};
