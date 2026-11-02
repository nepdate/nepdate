<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  adToBs,
  bsToAd,
  fiscalYear,
  formatDate,
  isProjected,
  parseDate,
  today,
  type AdDate,
} from '@nepdatejs/core';

const ad = ref<AdDate>(today('AD'));
const adText = ref(formatDate(ad.value, 'iso'));
const bsText = ref(formatDate(adToBs(ad.value), 'iso'));
const problem = ref('');

function fromAd(event: Event): void {
  adText.value = (event.target as HTMLInputElement).value;
  apply(() => {
    const date = parseDate(adText.value, 'AD');
    if (!date) {
      throw new Error('Enter an AD date as YYYY-MM-DD.');
    }
    bsText.value = formatDate(adToBs(date), 'iso');
    return date;
  });
}

function fromBs(event: Event): void {
  bsText.value = (event.target as HTMLInputElement).value;
  apply(() => {
    const date = parseDate(bsText.value, 'BS');
    if (!date) {
      throw new Error('Enter a BS date as YYYY-MM-DD, between 1970 and 2099.');
    }
    const converted = bsToAd(date);
    adText.value = formatDate(converted, 'iso');
    return converted;
  });
}

function apply(read: () => AdDate): void {
  try {
    ad.value = read();
    problem.value = '';
  } catch (error) {
    problem.value = (error as Error).message;
  }
}

const facts = computed(() => {
  const bs = adToBs(ad.value);

  return [
    ['In English', formatDate(bs, 'full')],
    ['In Nepali', formatDate(bs, 'full', 'ne')],
    ['AD', formatDate(ad.value, 'full')],
    ['Fiscal year', fiscalYear(bs).label],
    ['Stored value', formatDate(ad.value, 'iso')],
    ...(isProjected(bs) ? [['Note', 'This BS year is a projection']] : []),
  ];
});
</script>

<template>
  <div class="demo">
    <div class="converter">
      <label>
        AD date
        <input :value="adText" inputmode="numeric" @input="fromAd" />
      </label>
      <label>
        BS date
        <input :value="bsText" inputmode="numeric" @input="fromBs" />
      </label>
    </div>
    <p v-if="problem" class="converter__error" role="alert">{{ problem }}</p>
    <dl class="converter__facts">
      <div v-for="[name, value] in facts" :key="name">
        <dt>{{ name }}</dt>
        <dd>{{ value }}</dd>
      </div>
    </dl>
  </div>
</template>
