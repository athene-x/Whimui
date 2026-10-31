import type { NextConfig } from 'next';

import createNextIntlPlugin from 'next-intl/plugin';

const config: NextConfig = { transpilePackages: ['@athenex/web-core'] };

export default createNextIntlPlugin('./src/i18n/request.ts')(config);
