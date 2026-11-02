import { watchEffect } from 'vue';
import { useData, type Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import '@nepdatejs/styles';
import './custom.css';
import Converter from './Converter.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('Converter', Converter);
    // Custom elements exist only in the browser.
    if (!import.meta.env.SSR) {
      void import('@nepdatejs/vanilla/define');
    }
  },
  setup() {
    // The live examples follow the site's light/dark switch.
    const { isDark } = useData();
    watchEffect(() => {
      if (!import.meta.env.SSR) {
        document.documentElement.dataset['ndpTheme'] = isDark.value ? 'dark' : 'light';
      }
    });
  },
} satisfies Theme;
