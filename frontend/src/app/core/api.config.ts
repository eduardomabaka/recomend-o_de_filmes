const runtime = globalThis as typeof globalThis & { __API_BASE_URL__?: string };

const PHP_DEV_SERVER_PORT = '8010';
const APACHE_PROJECT_PATH = '/filme/backend/public/index.php';

function getDevServerBaseUrl(protocol: string, hostname: string): string {
  return `${protocol}//${hostname}:${PHP_DEV_SERVER_PORT}/index.php`;
}

function getApacheBaseUrl(protocol: string, host: string): string {
  return `${protocol}//${host}${APACHE_PROJECT_PATH}`;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function getApiBaseCandidates(): string[] {
  const runtimeBaseUrl = runtime.__API_BASE_URL__;
  if (typeof runtimeBaseUrl === 'string' && runtimeBaseUrl.trim() !== '') {
    return [runtimeBaseUrl];
  }

  if (typeof window === 'undefined') {
    return [getDevServerBaseUrl('http:', '127.0.0.1')];
  }

  const { protocol, host, hostname, port } = window.location;
  const isLocalDevHost = ['localhost', '127.0.0.1', '::1'].includes(hostname);
  const isLikelyAngularDevServer = isLocalDevHost && port !== '' && port !== PHP_DEV_SERVER_PORT;
  const devBaseUrl = getDevServerBaseUrl(protocol, hostname);

  // Em `ng serve`, prioriza Apache/XAMPP e mantém fallback para PHP embutido.
  if (isLikelyAngularDevServer) {
    const apacheBaseUrl = getApacheBaseUrl(protocol, hostname);
    return unique([apacheBaseUrl, devBaseUrl]);
  }

  // Em deploy local no Apache, tenta primeiro Apache e mantém fallback para o PHP embutido.
  const apacheBaseUrl = getApacheBaseUrl(protocol, host);
  return unique([apacheBaseUrl, devBaseUrl]);
}

export const API_BASE_URL = getApiBaseCandidates()[0];
