
<template>
  <main class='max-w-4xl mx-auto p-8'>
    <div class=''>
      <h1 class='text-4xl mb-4'>Demo API tỉnh thành Việt Nam với VueJS</h1>
      <p>Code theo Vue 3, TypeScript</p>
      <location-picker class='mt-4'></location-picker>
    </div>
  </main>
</template>

<script lang='ts'>
import { defineComponent } from 'vue'
import LocationPicker from './components/LocationPicker.vue'

export default defineComponent({
  components: {
    LocationPicker,
  },
})
</script>
