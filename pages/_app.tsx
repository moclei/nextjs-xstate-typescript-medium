import '../styles/globals.css'
import type { AppProps } from 'next/app'
import {SearchStateProvider} from "../src/services/useSearch";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SearchStateProvider>
      <Component {...pageProps} />
    </SearchStateProvider>
  );
}

export default MyApp
