const raw = 'eyJ0ZXN0Ijoib2sifQ==';

function decodeUtf8Base64(value) {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

export const badayatFullTemplateBodies = JSON.parse(decodeUtf8Base64(raw));
