<template>
  <div class='grid md:grid-cols-3 space-y-4 md:space-y-0 md:space-x-4'>
    <div class='relative' v-click-away='hideProvinceList'>
      <input
        class='p-1 px-2 appearance-none outline-none text-gray-800 border'
        v-model.trim='provinceSearch'
        placeholder='Tỉnh...'
        @focus='startSearchingProvince'
      />

      <div
        class='absolute z-10 max-h-48 w-full bg-gray-100 overflow-y-auto shadow'
        v-show='provinceListShown && filteredProvinces.length'
      >
        <ul class='list-none'>
          <li
            v-for='(item, idx) of filteredProvinces'
            :key='idx'
            v-html='highlightName(item)'
            class='px-2 py-1 cursor-pointer bg-white hover:bg-blue-100'
            @click='selectProvince(item)'
          ></li>
        </ul>
      </div>
    </div>
    <div class='relative' v-click-away='hideDistrictList'>
      <input
        class='p-1 px-2 appearance-none outline-none text-gray-800 border'
        v-model.trim='districtSearch'
        placeholder='Huyện...'
        @focus='startSearchingDistrict'
        @keyup='searchDistrictOnTyping'
      />

      <div
        class='absolute z-10 max-h-48 w-full bg-gray-100 overflow-y-auto shadow'
        v-show='districtListShown && filteredDistricts.length'
      >
        <ul class='list-none'>
          <li
            v-for='(item, idx) of filteredDistricts'
            :key='idx'
            v-html='highlightName(item)'
            class='px-2 py-1 cursor-pointer bg-white hover:bg-blue-100'
            @click='selectDistrict(item)'
          ></li>
        </ul>
      </div>
    </div>
    <div class='relative' v-click-away='hideWardList'>
      <input
        class='p-1 px-2 appearance-none outline-none text-gray-800 border'
        v-model.trim='wardSearch'
        placeholder='Xã...'
        @focus='startSearchingWard'
      />

      <div
        class='absolute z-10 max-h-48 w-full bg-gray-100 overflow-y-auto shadow'
        v-show='wardListShown && filteredWards.length'
      >
        <ul class='list-none'>
          <li
            v-for='(item, idx) of filteredWards'
            :key='idx'
            class='px-2 py-1 cursor-pointer bg-white hover:bg-blue-100'
            @click='selectWard(item)'
            v-html='highlightName(item)'
          ></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang='ts'>
import { defineComponent, ref } from 'vue'
import ky from 'ky'
import { array, mask } from 'superstruct'
import { mixin as VueClickAway } from 'vue3-click-away'
import { debounce } from 'ts-debounce'

import { Base, Ward, WardSchema, District, DistrictShema, Province, ProvinceSchema } from '../structs'

const BASE_API_URL = 'https://provinces.open-api.vn/api'

/*
* The Lunr engine consider each keyword optional, but in the context of
* this demo, we want all keywords to be present.
* This function is to prefix all keywords with plus ("+"),
* ex: "Bà Rịa" -> "+Bà +Rịa".
*/
function markRequireAll(query: string) {
  const words = query.split(/\s+/)
  return words.map(w => `+${w}`).join(' ')
}

function highlightName(item: Base) {
  if (!item.matches) {
    return item.name
  }
  const name = item.name
  const matches = Object.values(item.matches)
  matches.sort((v1, v2) => v1[0] - v2[0])
  const parts = []
  var lastPos = 0
  for (const [s, e] of matches) {
    parts.push(name.slice(lastPos, s))
    parts.push(`<strong>${name.slice(s, e)}</strong>`)
    lastPos = e
  }
  parts.push(name.slice(lastPos))
  return parts.join('')
}

export default defineComponent({
  setup() {
    const provinceSearch = ref('')
    const provinceListShown = ref(false)
    const filteredProvinces = ref<Province[]>([])
    const selectedProvince = ref<Province | null>(null)
    const districtSearch = ref('')
    const districtListShown = ref(false)
    const filteredDistricts = ref<District[]>([])
    const selectedDistrict = ref<District | null>(null)
    const wardSearch = ref('')
    const wardListShown = ref(false)
    const filteredWards = ref<Ward[]>([])
    const selectedWard = ref<Ward | null>(null)

    /* I prefer define component methods in Options API style,
     * but sometimes it is only possible with Compsition API
     */
    const searchDistrict = async (term: string, provinceCode: number) => {
      if (selectedDistrict.value && selectedDistrict.value.name === term) {
        return
      }
      const rdata = await ky.get(`${BASE_API_URL}/d/search/`, {
        searchParams: { q: markRequireAll(term), p: provinceCode }
      }).json()
      filteredDistricts.value = mask(rdata, array(DistrictShema))
    }
    const searchDistrictOnTyping = debounce(async () => {
      const term = districtSearch.value.trim()
      if (!term || !selectedProvince.value) {
        return
      }
      await searchDistrict(term, selectedProvince.value.code)
    }, 300)
    return {
      provinceSearch,
      provinceListShown,
      filteredProvinces,
      selectedProvince,
      districtSearch,
      districtListShown,
      filteredDistricts,
      selectedDistrict,
      wardSearch,
      wardListShown,
      filteredWards,
      selectedWard,
      // Methods
      searchDistrict,
      searchDistrictOnTyping,
    }
  },
  mixins: [VueClickAway],
  methods: {
    highlightName,
    resetProvince() {
      this.provinceSearch = ''
      this.selectedProvince = null
      this.filteredProvinces = []
      this.provinceListShown = false
    },
    resetDistrict() {
      this.districtSearch = ''
      this.selectedDistrict = null
      this.filteredDistricts = []
      this.districtListShown = false
    },
    resetWard() {
      this.wardSearch = ''
      this.selectedWard = null
      this.filteredWards = []
      this.wardListShown = false
    },
    hideProvinceList() {
      this.provinceListShown = false
    },
    hideDistrictList() {
      this.districtListShown = false
    },
    hideWardList() {
      this.wardListShown = false
    },
    async fetchProvinces() {
      const rdata = await ky.get(`${BASE_API_URL}/p/`).json()
      this.filteredProvinces = mask(rdata, array(ProvinceSchema))
    },
    async fetchDistricts(provinceCode: number) {
      const rdata = await ky.get(`${BASE_API_URL}/p/${provinceCode}`, { searchParams: { depth: 2 } }).json()
      const province = mask(rdata, ProvinceSchema)
      this.filteredDistricts = province.districts
    },
    async fetchWards(districtCode: number) {
      const rdata = await ky.get(`${BASE_API_URL}/d/${districtCode}`, { searchParams: { depth: 2 } }).json()
      const district = mask(rdata, DistrictShema)
      this.filteredWards = district.wards
    },
    async searchProvince(term: string) {
      if (this.selectedProvince && this.selectedProvince.name === term) {
        return
      }
      const rdata = await ky.get(`${BASE_API_URL}/p/search/`, {
        searchParams: { q: markRequireAll(term) }
      }).json()
      this.filteredProvinces = mask(rdata, array(ProvinceSchema))
    },

    async searchWard(term: string, districtCode: number) {
      if (this.selectedWard && this.selectedWard.name === term) {
        return
      }
      const rdata = await ky.get(`${BASE_API_URL}/w/search/`, {
        searchParams: { q: markRequireAll(term), d: districtCode }
      }).json()
      this.filteredWards = mask(rdata, array(WardSchema))
    },
    async startSearchingProvince() {
      this.provinceListShown = true
      if (!this.filteredProvinces.length) {
        this.fetchProvinces()
      }
    },
    async startSearchingDistrict() {
      this.districtListShown = true
      if (this.filteredDistricts.length || !this.selectedProvince) {
        return
      }
      await this.fetchDistricts(this.selectedProvince.code)
    },
    async startSearchingWard() {
      this.wardListShown = true
      if (this.filteredWards.length || !this.selectedDistrict) {
        return
      }
      await this.fetchWards(this.selectedDistrict.code)
    },
    selectProvince(province: Province) {
      this.hideProvinceList()
      this.selectedProvince = province
      this.provinceSearch = province.name
      this.resetDistrict()
      this.resetWard()
    },
    selectDistrict(district: District) {
      this.hideDistrictList()
      this.selectedDistrict = district
      this.districtSearch = district.name
      this.resetWard()
    },
    selectWard(ward: Ward) {
      this.hideWardList()
      this.selectedWard = ward
      this.wardSearch = ward.name
    },
  }
})
</script>
