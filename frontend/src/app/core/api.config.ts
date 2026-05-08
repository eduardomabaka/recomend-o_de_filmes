const runtime = globalThis as typeof globalThis & { __API_BASE_URL__?: string };

const PHP_DEV_SERVER_PORT = '8010';
const APACHE_PROJECT_PATH = '/filme/backend/public/index.php';

function getFallbackBaseUrl(): string {
  if (typeof window === 'undefined') {
    return `http://127.0.0.1:${PHP_DEV_SERVER_PORT}/index.php`;
  }

  const isLocalDevHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  const isLikelyAngularDevServer =
    isLocalDevHost && window.location.port !== '' && window.location.port !== PHP_DEV_SERVER_PORT;

  // Quando roda via `ng serve`, use `npm run backend` para subir a API PHP.
  if (isLikelyAngularDevServer) {
    return `${window.location.protocol}//${window.location.hostname}:${PHP_DEV_SERVER_PORT}/index.php`;
  }

  // Em deploy no Apache/XAMPP no mesmo host, usa o caminho do projeto em htdocs.
  return `${window.location.protocol}//${window.location.host}${APACHE_PROJECT_PATH}`;
}

const fallbackBaseUrl = getFallbackBaseUrl();

export const API_BASE_URL = runtime.__API_BASE_URL__ ?? fallbackBaseUrl;
