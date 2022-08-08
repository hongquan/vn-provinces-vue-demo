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
        @keyup='searchDistrictOnTyping()'
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

<script setup lang='ts'>
import { ref } from 'vue'
import ky from 'ky'
import { array, mask } from 'superstruct'
import { directive as vClickAway } from 'vue3-click-away'
import { debounce } from 'ts-debounce'

import { Base, Ward, WardSchema, District, DistrictShema, Province, ProvinceSchema } from '../structs'

const BASE_API_URL = 'https://provinces.open-api.vn/api'

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

function resetProvince() {
  provinceSearch.value = ''
  selectedProvince.value = null
  filteredProvinces.value = []
  provinceListShown.value = false
}

function resetDistrict() {
  districtSearch.value = ''
  selectedDistrict.value = null
  filteredDistricts.value = []
  districtListShown.value = false
}

function resetWard() {
  wardSearch.value = ''
  selectedWard.value = null
  filteredWards.value = []
  wardListShown.value = false
}

function hideProvinceList() {
  provinceListShown.value = false
}

function hideDistrictList() {
  districtListShown.value = false
}

function hideWardList() {
  wardListShown.value = false
}

async function fetchProvinces() {
  const rdata = await ky.get(`${BASE_API_URL}/p/`).json()
  filteredProvinces.value = mask(rdata, array(ProvinceSchema))
}

async function fetchDistricts(provinceCode: number) {
  const rdata = await ky.get(`${BASE_API_URL}/p/${provinceCode}`, { searchParams: { depth: 2 } }).json()
  const province = mask(rdata, ProvinceSchema)
  filteredDistricts.value = province.districts
}

async function fetchWards(districtCode: number) {
  const rdata = await ky.get(`${BASE_API_URL}/d/${districtCode}`, { searchParams: { depth: 2 } }).json()
  const district = mask(rdata, DistrictShema)
  filteredWards.value = district.wards
}

async function searchProvince(term: string) {
  if (selectedProvince.value && selectedProvince.value.name === term) {
    return
  }
  const rdata = await ky.get(`${BASE_API_URL}/p/search/`, {
    searchParams: { q: markRequireAll(term) }
  }).json()
  filteredProvinces.value = mask(rdata, array(ProvinceSchema))
}

async function searchWard(term: string, districtCode: number) {
  if (selectedWard.value && selectedWard.value.name === term) {
    return
  }
  const rdata = await ky.get(`${BASE_API_URL}/w/search/`, {
    searchParams: { q: markRequireAll(term), d: districtCode }
  }).json()
  filteredWards.value = mask(rdata, array(WardSchema))
}

async function startSearchingProvince() {
  provinceListShown.value = true
  if (!filteredProvinces.value.length) {
    await fetchProvinces()
  }
}

async function startSearchingDistrict() {
  districtListShown.value = true
  if (filteredDistricts.value.length || !selectedProvince.value) {
    return
  }
  await fetchDistricts(selectedProvince.value.code)
}

async function startSearchingWard() {
  wardListShown.value = true
  if (filteredWards.value.length || !selectedDistrict.value) {
    return
  }
  await fetchWards(selectedDistrict.value.code)
}

function selectProvince(province: Province) {
  hideProvinceList()
  selectedProvince.value = province
  provinceSearch.value = province.name
  resetDistrict()
  resetWard()
}

function selectDistrict(district: District) {
  hideDistrictList()
  selectedDistrict.value = district
  districtSearch.value = district.name
  resetWard()
}

function selectWard(ward: Ward) {
  hideWardList()
  selectedWard.value = ward
  wardSearch.value = ward.name
}
</script>
